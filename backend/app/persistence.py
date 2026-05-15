"""Organization-owned persistence helpers for the MVP backend path."""
from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException

from .assessment.engine import evaluate
from .assessment.scoring import AssessmentValidationError
from .schemas import (
    AgentScanResult,
    AssessmentEvaluateIn,
    AssessmentResponseIn,
    AssessmentResult,
)
from .sector import normalize_sector
from .supabase_client import rest_insert, rest_select, rest_update, rest_upsert

MODEL_VERSION = "iso27001-mvp-d1-d9-v1"
FRAMEWORK_ID = "iso27001"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def slugify(value: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return base[:48] or "workspace"


async def audit_log(
    organization_id: str | None,
    user_id: str | None,
    action: str,
    *,
    entity_type: str | None = None,
    entity_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    try:
        await rest_insert(
            "audit_logs",
            {
                "organization_id": organization_id,
                "user_id": user_id,
                "action": action,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "metadata": metadata or {},
            },
        )
    except Exception:
        # Audit logging should not break the primary user action.
        return


async def get_membership(organization_id: str, user_id: str) -> dict[str, Any] | None:
    rows = await rest_select(
        "organization_members",
        {
            "select": "*",
            "organization_id": f"eq.{organization_id}",
            "user_id": f"eq.{user_id}",
            "limit": "1",
        },
    )
    return rows[0] if rows else None


async def require_organization_access(
    organization_id: str,
    user_id: str,
    *,
    write: bool = False,
) -> dict[str, Any]:
    membership = await get_membership(organization_id, user_id)
    if not membership:
        raise HTTPException(status_code=403, detail="Organization access denied.")
    if write and membership.get("role") == "viewer":
        raise HTTPException(status_code=403, detail="Insufficient organization permissions.")
    return membership


async def create_organization(user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    name = (payload.get("name") or "Averonix Workspace").strip()
    sector = normalize_sector(payload.get("sector"))
    org_rows = await rest_insert(
        "organizations",
        {
            "name": name,
            "slug": f"{slugify(name)}-{user_id[:8]}",
            "sector": sector,
            "size": payload.get("size"),
            "domain": payload.get("domain"),
            "city": payload.get("city"),
            "country": payload.get("country") or "Morocco",
            "profile_completed": bool(payload.get("profileCompleted")),
            "created_by": user_id,
        },
    )
    org = org_rows[0]
    await rest_insert(
        "organization_members",
        {
            "organization_id": org["id"],
            "user_id": user_id,
            "role": "owner",
        },
    )
    await audit_log(org["id"], user_id, "organization.created", entity_type="organization", entity_id=org["id"])
    return org


async def get_or_backfill_current_organization(user_id: str) -> dict[str, Any] | None:
    memberships = await rest_select(
        "organization_members",
        {"select": "organization_id,role", "user_id": f"eq.{user_id}", "limit": "1"},
    )
    if memberships:
        org_id = memberships[0]["organization_id"]
        orgs = await rest_select("organizations", {"select": "*", "id": f"eq.{org_id}", "limit": "1"})
        return orgs[0] if orgs else None

    companies = await rest_select("companies", {"select": "*", "user_id": f"eq.{user_id}", "limit": "1"})
    if not companies:
        return None

    company = companies[0]
    org = await create_organization(
        user_id,
        {
            "name": company.get("name") or "Averonix Workspace",
            "sector": company.get("sector") or "general_sme",
            "size": company.get("size"),
            "domain": company.get("domain"),
            "city": company.get("city"),
            "country": company.get("country") or "Morocco",
            "profileCompleted": bool(company.get("onboarding_completed")),
        },
    )
    await rest_update(
        "companies",
        {"organization_id": org["id"]},
        {"user_id": f"eq.{user_id}"},
    )
    return org


async def update_organization(organization_id: str, user_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    membership = await require_organization_access(organization_id, user_id, write=True)
    if membership.get("role") not in {"owner", "admin"}:
        raise HTTPException(status_code=403, detail="Only owners and admins can update organization.")
    update = {
        key: value
        for key, value in {
            "name": payload.get("name"),
            "sector": normalize_sector(payload.get("sector")) if payload.get("sector") else None,
            "size": payload.get("size"),
            "domain": payload.get("domain"),
            "city": payload.get("city"),
            "country": payload.get("country"),
            "profile_completed": payload.get("profileCompleted"),
        }.items()
        if value is not None
    }
    rows = await rest_update("organizations", update, {"id": f"eq.{organization_id}"})
    await audit_log(organization_id, user_id, "organization.updated", entity_type="organization", entity_id=organization_id)
    return rows[0]


async def latest_session(organization_id: str, sector: str) -> dict[str, Any] | None:
    rows = await rest_select(
        "assessment_sessions",
        {
            "select": "*",
            "organization_id": f"eq.{organization_id}",
            "framework_id": f"eq.{FRAMEWORK_ID}",
            "model_version": f"eq.{MODEL_VERSION}",
            "sector": f"eq.{normalize_sector(sector)}",
            "order": "updated_at.desc",
            "limit": "1",
        },
    )
    return rows[0] if rows else None


async def get_or_create_assessment_session(
    organization_id: str,
    user_id: str,
    sector: str,
) -> dict[str, Any]:
    await require_organization_access(organization_id, user_id)
    existing = await latest_session(organization_id, sector)
    if existing:
        return existing
    rows = await rest_insert(
        "assessment_sessions",
        {
            "organization_id": organization_id,
            "user_id": user_id,
            "framework_id": FRAMEWORK_ID,
            "model_version": MODEL_VERSION,
            "sector": normalize_sector(sector),
            "status": "draft",
            "question_count": 81,
            "answered_count": 0,
        },
    )
    session = rows[0]
    await audit_log(organization_id, user_id, "assessment.session.created", entity_type="assessment_session", entity_id=session["id"])
    return session


async def get_session(session_id: str, organization_id: str) -> dict[str, Any]:
    rows = await rest_select(
        "assessment_sessions",
        {"select": "*", "id": f"eq.{session_id}", "organization_id": f"eq.{organization_id}", "limit": "1"},
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Assessment session not found.")
    return rows[0]


async def list_assessment_responses(session_id: str, organization_id: str) -> list[dict[str, Any]]:
    return await rest_select(
        "assessment_responses",
        {
            "select": "*",
            "session_id": f"eq.{session_id}",
            "organization_id": f"eq.{organization_id}",
            "order": "question_id.asc",
        },
    )


def row_to_response(row: dict[str, Any]) -> AssessmentResponseIn:
    return AssessmentResponseIn(
        questionId=row["question_id"],
        domainId=row["domain_id"],
        maturityLevel=int(row["maturity_level"]),
        evidenceConfidence=float(row["evidence_confidence"]),
        evidenceNote=row.get("evidence_note") or "",
    )


async def save_assessment_response(
    organization_id: str,
    session_id: str,
    user_id: str,
    response: AssessmentResponseIn,
) -> dict[str, Any]:
    await require_organization_access(organization_id, user_id, write=True)
    session = await get_session(session_id, organization_id)
    try:
        evaluate(AssessmentEvaluateIn(sector=session["sector"], final=False, responses=[response]))
    except AssessmentValidationError as exc:
        raise HTTPException(status_code=400, detail="Invalid assessment response.") from exc
    rows = await rest_upsert(
        "assessment_responses",
        {
            "session_id": session_id,
            "organization_id": organization_id,
            "question_id": response.questionId,
            "domain_id": response.domainId,
            "maturity_level": response.maturityLevel,
            "evidence_confidence": response.evidenceConfidence,
            "evidence_note": response.evidenceNote or "",
            "answered_by": user_id,
            "updated_at": utc_now(),
        },
        on_conflict="session_id,question_id",
    )
    responses = await list_assessment_responses(session_id, organization_id)
    next_status = "stale" if session.get("status") == "completed" else session.get("status", "draft")
    if next_status == "completed":
        next_status = "stale"
    await rest_update(
        "assessment_sessions",
        {
            "answered_count": len(responses),
            "status": next_status,
            "completed_at": None if next_status == "stale" else session.get("completed_at"),
            "updated_at": utc_now(),
        },
        {"id": f"eq.{session_id}", "organization_id": f"eq.{organization_id}"},
    )
    await audit_log(organization_id, user_id, "assessment.response.saved", entity_type="assessment_session", entity_id=session_id, metadata={"questionId": response.questionId})
    return rows[0]


def compute_response_hash(responses: list[AssessmentResponseIn]) -> str:
    normalized = [
        {
            "questionId": r.questionId,
            "maturityLevel": r.maturityLevel,
            "evidenceConfidence": r.evidenceConfidence,
            "evidenceNote": (r.evidenceNote or "").strip(),
        }
        for r in sorted(responses, key=lambda item: item.questionId)
    ]
    raw = json.dumps(normalized, separators=(",", ":"), sort_keys=True)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def result_to_row(
    result: AssessmentResult,
    *,
    organization_id: str,
    session: dict[str, Any],
    user_id: str,
    response_hash: str,
) -> dict[str, Any]:
    return {
        "session_id": session["id"],
        "organization_id": organization_id,
        "user_id": user_id,
        "framework_id": FRAMEWORK_ID,
        "model_version": MODEL_VERSION,
        "sector": session["sector"],
        "overall_score": result.overallScore,
        "risk_level": result.riskLevel,
        "evidence_confidence": result.evidenceConfidence,
        "question_count": 81,
        "answered_count": 81,
        "domain_scores": {key: value.model_dump() for key, value in result.domainScores.items()},
        "critical_gaps": result.criticalGaps,
        "weak_evidence": result.weakEvidence,
        "recommendations": result.recommendations,
        "response_hash": response_hash,
        "source": "backend",
    }


def row_to_result(row: dict[str, Any], stale: bool = False) -> dict[str, Any]:
    return {
        "id": row.get("id"),
        "sessionId": row.get("session_id"),
        "organizationId": row.get("organization_id"),
        "frameworkId": row.get("framework_id"),
        "modelVersion": row.get("model_version"),
        "sector": row.get("sector"),
        "overallScore": int(round(float(row.get("overall_score", 0)))),
        "riskLevel": row.get("risk_level"),
        "evidenceConfidence": int(round(float(row.get("evidence_confidence", 0)))),
        "questionCount": int(row.get("question_count", 0)),
        "answeredCount": int(row.get("answered_count", 0)),
        "domainScores": row.get("domain_scores") or {},
        "criticalGaps": row.get("critical_gaps") or [],
        "weakEvidence": row.get("weak_evidence") or [],
        "recommendations": row.get("recommendations") or [],
        "responseHash": row.get("response_hash"),
        "source": row.get("source") or "backend",
        "completedAt": row.get("created_at"),
        "stale": stale,
    }


async def evaluate_assessment_session(
    organization_id: str,
    session_id: str,
    user_id: str,
) -> dict[str, Any]:
    await require_organization_access(organization_id, user_id, write=True)
    session = await get_session(session_id, organization_id)
    rows = await list_assessment_responses(session_id, organization_id)
    responses = [row_to_response(row) for row in rows]
    result = evaluate(AssessmentEvaluateIn(sector=session["sector"], final=True, responses=responses))
    response_hash = compute_response_hash(responses)
    result_rows = await rest_insert(
        "assessment_results",
        result_to_row(
            result,
            organization_id=organization_id,
            session=session,
            user_id=user_id,
            response_hash=response_hash,
        ),
    )
    saved = result_rows[0]
    await rest_update(
        "assessment_sessions",
        {
            "status": "completed",
            "answered_count": len(responses),
            "completed_at": saved.get("created_at") or utc_now(),
            "updated_at": utc_now(),
        },
        {"id": f"eq.{session_id}", "organization_id": f"eq.{organization_id}"},
    )
    await audit_log(organization_id, user_id, "assessment.evaluated", entity_type="assessment_result", entity_id=saved["id"])
    return row_to_result(saved)


async def latest_assessment_result(
    organization_id: str,
    user_id: str,
    session_id: str | None = None,
) -> dict[str, Any] | None:
    await require_organization_access(organization_id, user_id)
    params = {
        "select": "*",
        "organization_id": f"eq.{organization_id}",
        "order": "created_at.desc",
        "limit": "1",
    }
    if session_id:
        params["session_id"] = f"eq.{session_id}"
    rows = await rest_select("assessment_results", params)
    if not rows:
        return None
    result = rows[0]
    responses = [row_to_response(row) for row in await list_assessment_responses(result["session_id"], organization_id)]
    stale = compute_response_hash(responses) != result.get("response_hash")
    if stale:
        await rest_update(
            "assessment_sessions",
            {"status": "stale", "updated_at": utc_now()},
            {"id": f"eq.{result['session_id']}", "organization_id": f"eq.{organization_id}"},
        )
    return row_to_result(result, stale=stale)


async def persist_agent_scan(
    organization_id: str,
    user_id: str,
    result: AgentScanResult,
) -> dict[str, Any]:
    await require_organization_access(organization_id, user_id, write=True)
    rows = await rest_insert(
        "agent_scans",
        {
            "organization_id": organization_id,
            "user_id": user_id,
            "target_domain": result.target.get("domain"),
            "normalized_domain": result.target.get("domain"),
            "sector": result.target.get("sector"),
            "verified_signal_score": result.summary.verifiedSignalScore,
            "evidence_confidence": result.summary.evidenceConfidence,
            "agent_readiness_impact": result.summary.agentReadinessImpact,
            "risk_interpretation": result.summary.riskInterpretation,
            "critical_findings_count": result.summary.criticalFindings,
            "checks": [check.model_dump() for check in result.checks],
            "findings": [finding.model_dump() for finding in result.findings],
            "mapped_evidence": [mq.model_dump() for mq in result.mappedQuestions],
            "domain_coverage": {key: value.model_dump() for key, value in result.domainCoverage.items()},
            "limitations": result.limitations,
            "status": "completed",
        },
    )
    await audit_log(organization_id, user_id, "agent.scan.completed", entity_type="agent_scan", entity_id=rows[0]["id"])
    return rows[0]


def agent_row_to_result(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "createdAt": row["created_at"],
        "target": {
            "domain": row["normalized_domain"],
            "sector": row.get("sector"),
        },
        "summary": {
            "verifiedSignalScore": int(row.get("verified_signal_score") or 0),
            "evidenceConfidence": int(row.get("evidence_confidence") or 0),
            "agentReadinessImpact": int(row.get("agent_readiness_impact") or 0),
            "riskInterpretation": row.get("risk_interpretation") or "insufficient_evidence",
            "agentScore": int(row.get("verified_signal_score") or 0),
            "riskLevel": row.get("risk_interpretation") or "critical",
            "automatedQuestions": 12,
            "totalModelQuestions": 270,
            "coveragePercent": 4,
            "passedChecks": len([c for c in (row.get("checks") or []) if c.get("status") == "passed"]),
            "warningChecks": len([c for c in (row.get("checks") or []) if c.get("status") == "warning"]),
            "failedChecks": len([c for c in (row.get("checks") or []) if c.get("status") == "failed"]),
            "notChecked": len([c for c in (row.get("checks") or []) if c.get("status") == "not_checked"]),
            "criticalFindings": int(row.get("critical_findings_count") or 0),
        },
        "checks": row.get("checks") or [],
        "findings": row.get("findings") or [],
        "mappedQuestions": row.get("mapped_evidence") or [],
        "domainCoverage": row.get("domain_coverage") or {},
        "limitations": row.get("limitations") or [],
    }


async def latest_agent_scan(organization_id: str, user_id: str) -> dict[str, Any] | None:
    await require_organization_access(organization_id, user_id)
    rows = await rest_select(
        "agent_scans",
        {
            "select": "*",
            "organization_id": f"eq.{organization_id}",
            "order": "created_at.desc",
            "limit": "1",
        },
    )
    return agent_row_to_result(rows[0]) if rows else None
