from __future__ import annotations

import asyncio
import logging
import time
from collections import defaultdict

from fastapi import APIRouter, Depends, Header, HTTPException, Request

from ..agent.engine import run_agent_scan
from ..auth import AuthenticatedUser, get_current_user_optional
from ..config import get_api_key, is_production
from ..persistence import latest_agent_scan, persist_agent_scan, require_organization_access
from ..schemas import AgentScanInput, AgentScanResult
from ..security import InvalidDomainError

router = APIRouter(prefix="/agent")
logger = logging.getLogger("averonix.agent")

SCAN_TIMEOUT_SECONDS = 30
SCAN_RATE_LIMIT = 5
SCAN_RATE_WINDOW_SECONDS = 60
_scan_windows: dict[str, list[float]] = defaultdict(list)


@router.get("/scans/latest")
async def get_latest_scan(
    organizationId: str,
    user: AuthenticatedUser | None = Depends(get_current_user_optional),
):
    if user is None:
        if is_production():
            raise HTTPException(status_code=401, detail="Authentication required.")
        return {"scan": None}
    await require_organization_access(organizationId, user.id)
    return {"scan": await latest_agent_scan(organizationId, user.id)}


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",", 1)[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _check_rate_limit(client_ip: str) -> None:
    now = time.monotonic()
    window = [
        ts
        for ts in _scan_windows[client_ip]
        if now - ts < SCAN_RATE_WINDOW_SECONDS
    ]
    if len(window) >= SCAN_RATE_LIMIT:
        _scan_windows[client_ip] = window
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded. Try again in one minute.",
        )
    window.append(now)
    _scan_windows[client_ip] = window


def _check_api_key(api_key: str | None) -> None:
    expected = get_api_key()
    if not is_production():
        return
    if not expected:
        raise HTTPException(status_code=401, detail="Agent API key is required in production.")
    if api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing API key.")


@router.post("/scan", response_model=AgentScanResult)
async def agent_scan(
    payload: AgentScanInput,
    request: Request,
    x_averonix_api_key: str | None = Header(default=None),
    user: AuthenticatedUser | None = Depends(get_current_user_optional),
) -> AgentScanResult:
    client_ip = _client_ip(request)
    if is_production() and user is None:
        _check_api_key(x_averonix_api_key)
        raise HTTPException(status_code=401, detail="Authentication required.")
    if is_production() and not payload.organizationId:
        raise HTTPException(status_code=400, detail="organizationId is required.")
    if user and payload.organizationId:
        await require_organization_access(payload.organizationId, user.id, write=True)
    _check_rate_limit(client_ip)
    started = time.perf_counter()
    target = payload.domain
    try:
        result = await asyncio.wait_for(
            run_agent_scan(payload),
            timeout=SCAN_TIMEOUT_SECONDS,
        )
        logger.info(
            "agent_scan_completed",
            extra={
                "client_ip": client_ip,
                "target": result.target.get("domain"),
                "status": result.summary.riskInterpretation,
                "duration_ms": round((time.perf_counter() - started) * 1000),
            },
        )
        if user and payload.organizationId:
            await persist_agent_scan(payload.organizationId, user.id, result)
        return result
    except InvalidDomainError as e:
        logger.warning(
            "agent_scan_rejected",
            extra={
                "client_ip": client_ip,
                "target": target,
                "status": "rejected",
                "duration_ms": round((time.perf_counter() - started) * 1000),
            },
        )
        raise HTTPException(status_code=400, detail=str(e))
    except asyncio.TimeoutError:
        logger.warning(
            "agent_scan_timeout",
            extra={
                "client_ip": client_ip,
                "target": target,
                "status": "timeout",
                "duration_ms": round((time.perf_counter() - started) * 1000),
            },
        )
        raise HTTPException(status_code=504, detail="Agent scan timed out.")
    except Exception:  # pragma: no cover
        logger.exception(
            "agent_scan_failed",
            extra={
                "client_ip": client_ip,
                "target": target,
                "status": "error",
                "duration_ms": round((time.perf_counter() - started) * 1000),
            },
        )
        raise HTTPException(status_code=500, detail="Agent scan failed. Please try again later.")
