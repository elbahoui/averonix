import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse

from ..assessment.engine import evaluate, questions_for_sector
from ..assessment.scoring import AssessmentValidationError
from ..auth import AuthenticatedUser, ensure_user, get_current_user_optional
from ..config import is_production
from ..persistence import (
    evaluate_assessment_session,
    get_or_create_assessment_session,
    latest_assessment_result,
    list_assessment_responses,
    require_organization_access,
    row_to_response,
    save_assessment_response,
)
from ..schemas import (
    AssessmentEvaluateIn,
    AssessmentResult,
    AssessmentSessionResponseIn,
)
from ..sector import normalize_sector
from ..supabase_client import SupabaseConfigError

router = APIRouter(prefix="/assessment")
logger = logging.getLogger("averonix.assessment")


@router.get("/questions")
async def get_questions(sector: str = Query("general_sme")):
    normalized_sector = normalize_sector(sector)
    return {"sector": normalized_sector, "domains": questions_for_sector(normalized_sector)}


@router.get("/session")
async def get_session(
    organizationId: str,
    sector: str = Query("general_sme"),
    user: AuthenticatedUser | None = Depends(get_current_user_optional),
):
    user = ensure_user(user)
    try:
        return await get_or_create_assessment_session(organizationId, user.id, sector)
    except SupabaseConfigError as exc:
        logger.exception("supabase_assessment_configuration_error")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable.") from exc


@router.get("/session/{session_id}/responses")
async def get_session_responses(
    session_id: str,
    organizationId: str,
    user: AuthenticatedUser | None = Depends(get_current_user_optional),
):
    user = ensure_user(user)
    await require_organization_access(organizationId, user.id)
    rows = await list_assessment_responses(session_id, organizationId)
    return {
        "responses": [
            row_to_response(row).model_dump(by_alias=False)
            for row in rows
        ]
    }


@router.put("/session/{session_id}/responses/{question_id}")
async def put_session_response(
    session_id: str,
    question_id: str,
    payload: AssessmentSessionResponseIn,
    user: AuthenticatedUser | None = Depends(get_current_user_optional),
):
    user = ensure_user(user)
    response = payload.response
    if response.questionId != question_id:
        raise HTTPException(status_code=400, detail="questionId does not match request path.")
    row = await save_assessment_response(payload.organizationId, session_id, user.id, response)
    return {"response": row}


@router.get("/results/latest")
async def get_latest_result(
    organizationId: str,
    sessionId: str | None = None,
    user: AuthenticatedUser | None = Depends(get_current_user_optional),
):
    user = ensure_user(user)
    result = await latest_assessment_result(organizationId, user.id, sessionId)
    return {"result": result}


@router.post("/evaluate", response_model=AssessmentResult)
async def post_evaluate(
    payload: AssessmentEvaluateIn,
    user: AuthenticatedUser | None = Depends(get_current_user_optional),
):
    if payload.organizationId or payload.sessionId:
        user = ensure_user(user)
        if not payload.organizationId or not payload.sessionId:
            raise HTTPException(
                status_code=400,
                detail="organizationId and sessionId are required for persisted evaluation.",
            )
        try:
            return await evaluate_assessment_session(payload.organizationId, payload.sessionId, user.id)
        except AssessmentValidationError as exc:
            return JSONResponse(status_code=400, content={"error": exc.to_error()})

    if is_production():
        raise HTTPException(status_code=401, detail="Authentication required.")

    try:
        return evaluate(payload)
    except AssessmentValidationError as exc:
        return JSONResponse(status_code=400, content={"error": exc.to_error()})
