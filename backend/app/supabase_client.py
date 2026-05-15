"""Small Supabase REST client used by the FastAPI backend.

The backend intentionally talks to Supabase from the server side only. Browser
code must never receive the service role key.
"""
from __future__ import annotations

from typing import Any

import httpx

from .config import (
    get_supabase_publishable_key,
    get_supabase_service_role_key,
    get_supabase_url,
)


class SupabaseConfigError(RuntimeError):
    """Raised when server-side Supabase persistence is not configured."""


class SupabaseHttpError(RuntimeError):
    """Raised when Supabase returns a non-success response."""

    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def _service_headers(prefer: str | None = None) -> dict[str, str]:
    key = get_supabase_service_role_key()
    if not key:
        raise SupabaseConfigError("SUPABASE_SERVICE_ROLE_KEY is not configured.")
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


def _auth_headers(token: str) -> dict[str, str]:
    key = get_supabase_publishable_key()
    if not key:
        raise SupabaseConfigError("SUPABASE_PUBLISHABLE_KEY is not configured.")
    return {"apikey": key, "Authorization": f"Bearer {token}"}


def _base_url() -> str:
    url = get_supabase_url()
    if not url:
        raise SupabaseConfigError("SUPABASE_URL is not configured.")
    return url


def persistence_configured() -> bool:
    return bool(get_supabase_url() and get_supabase_service_role_key())


async def verify_supabase_token(token: str) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            f"{_base_url()}/auth/v1/user",
            headers=_auth_headers(token),
        )
    if response.status_code != 200:
        raise SupabaseHttpError(response.status_code, "Invalid Supabase token.")
    return response.json()


async def rest_select(
    table: str,
    params: dict[str, str] | None = None,
) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(
            f"{_base_url()}/rest/v1/{table}",
            headers=_service_headers(),
            params=params or {},
        )
    if response.status_code >= 400:
        raise SupabaseHttpError(response.status_code, response.text)
    return response.json()


async def rest_insert(
    table: str,
    payload: dict[str, Any],
    *,
    prefer: str = "return=representation",
) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            f"{_base_url()}/rest/v1/{table}",
            headers=_service_headers(prefer),
            json=payload,
        )
    if response.status_code >= 400:
        raise SupabaseHttpError(response.status_code, response.text)
    return response.json() if response.content else []


async def rest_upsert(
    table: str,
    payload: dict[str, Any],
    *,
    on_conflict: str,
) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            f"{_base_url()}/rest/v1/{table}",
            headers=_service_headers("resolution=merge-duplicates,return=representation"),
            params={"on_conflict": on_conflict},
            json=payload,
        )
    if response.status_code >= 400:
        raise SupabaseHttpError(response.status_code, response.text)
    return response.json() if response.content else []


async def rest_update(
    table: str,
    payload: dict[str, Any],
    params: dict[str, str],
) -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.patch(
            f"{_base_url()}/rest/v1/{table}",
            headers=_service_headers("return=representation"),
            params=params,
            json=payload,
        )
    if response.status_code >= 400:
        raise SupabaseHttpError(response.status_code, response.text)
    return response.json() if response.content else []
