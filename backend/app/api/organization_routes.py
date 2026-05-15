import logging

from fastapi import APIRouter, Depends, HTTPException

from ..auth import AuthenticatedUser, ensure_user, get_current_user_optional
from ..persistence import create_organization, get_or_backfill_current_organization, update_organization
from ..schemas import OrganizationIn
from ..supabase_client import SupabaseConfigError

router = APIRouter(prefix="/organizations")
logger = logging.getLogger("averonix.organizations")


@router.get("/current")
async def current_organization(user: AuthenticatedUser | None = Depends(get_current_user_optional)):
    user = ensure_user(user)
    try:
        org = await get_or_backfill_current_organization(user.id)
    except SupabaseConfigError as exc:
        logger.exception("supabase_organization_configuration_error")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable.") from exc
    return {"organization": org}


@router.post("")
async def create(payload: OrganizationIn, user: AuthenticatedUser | None = Depends(get_current_user_optional)):
    user = ensure_user(user)
    try:
        org = await create_organization(user.id, payload.model_dump())
    except SupabaseConfigError as exc:
        logger.exception("supabase_organization_configuration_error")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable.") from exc
    return {"organization": org}


@router.patch("/{organization_id}")
async def update(
    organization_id: str,
    payload: OrganizationIn,
    user: AuthenticatedUser | None = Depends(get_current_user_optional),
):
    user = ensure_user(user)
    org = await update_organization(organization_id, user.id, payload.model_dump())
    return {"organization": org}
