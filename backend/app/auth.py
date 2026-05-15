"""Authentication and organization authorization helpers."""
from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Iterable

from fastapi import Header, HTTPException

from .config import dev_auth_bypass_enabled, is_production
from .supabase_client import SupabaseConfigError, SupabaseHttpError, verify_supabase_token

logger = logging.getLogger("averonix.auth")


@dataclass(frozen=True)
class AuthenticatedUser:
    id: str
    email: str | None = None


async def get_current_user_optional(
    authorization: str | None = Header(default=None),
) -> AuthenticatedUser | None:
    if not authorization:
        if is_production():
            raise HTTPException(status_code=401, detail="Authentication required.")
        if dev_auth_bypass_enabled():
            return AuthenticatedUser(id="00000000-0000-4000-8000-000000000001")
        return None

    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required.")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Bearer token required.")

    try:
        payload = await verify_supabase_token(token)
    except SupabaseConfigError as exc:
        logger.exception("supabase_auth_configuration_error")
        raise HTTPException(status_code=500, detail="Backend configuration error.") from exc
    except SupabaseHttpError as exc:
        raise HTTPException(status_code=401, detail="Invalid authentication token.") from exc

    user_id = payload.get("id") or payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")
    return AuthenticatedUser(id=str(user_id), email=payload.get("email"))


async def get_current_user(
    user: AuthenticatedUser | None = None,
) -> AuthenticatedUser:
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return user


def ensure_user(user: AuthenticatedUser | None) -> AuthenticatedUser:
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required.")
    return user


def ensure_role(role: str | None, allowed: Iterable[str]) -> None:
    if role not in set(allowed):
        raise HTTPException(status_code=403, detail="Insufficient organization permissions.")
