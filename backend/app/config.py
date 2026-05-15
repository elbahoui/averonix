"""Application configuration."""
from __future__ import annotations
import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()


@lru_cache(maxsize=1)
def get_app_env() -> str:
    return os.getenv("AVERONIX_ENV", "development").strip().lower() or "development"


def is_production() -> bool:
    return get_app_env() == "production"


@lru_cache(maxsize=1)
def get_allowed_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS")
    if raw:
        origins = [o.strip() for o in raw.split(",") if o.strip()]
        if is_production() and "*" in origins:
            raise RuntimeError("Wildcard CORS origins are not allowed in production.")
        return origins
    if is_production():
        raise RuntimeError("ALLOWED_ORIGINS must be set in production.")
    return ["http://localhost:8080", "http://localhost:5173", "http://localhost:3000"]


def get_api_key() -> str | None:
    value = os.getenv("AVERONIX_API_KEY")
    return value.strip() if value and value.strip() else None


def dev_auth_bypass_enabled() -> bool:
    return (
        not is_production()
        and os.getenv("AVERONIX_DEV_AUTH_BYPASS", "").strip().lower()
        in {"1", "true", "yes", "on"}
    )


def get_supabase_url() -> str | None:
    value = os.getenv("SUPABASE_URL")
    return value.rstrip("/") if value and value.strip() else None


def get_supabase_publishable_key() -> str | None:
    value = os.getenv("SUPABASE_PUBLISHABLE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    return value.strip() if value and value.strip() else None


def get_supabase_service_role_key() -> str | None:
    value = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    return value.strip() if value and value.strip() else None
