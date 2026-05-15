"""Company sector normalization shared by backend modules."""
from __future__ import annotations

from typing import Literal

CompanySector = Literal[
    "saas",
    "fintech",
    "healthcare",
    "ecommerce",
    "education",
    "telecom",
    "professional_services",
    "general_sme",
]


def normalize_sector(value: str | None) -> CompanySector:
    raw = (
        (value or "")
        .strip()
        .lower()
        .replace("&", "and")
        .replace("_", " ")
        .replace("/", " ")
        .replace("-", " ")
    )
    raw = " ".join(raw.split())
    if raw in {"saas", "software", "startup", "saas software"}:
        return "saas"
    if raw in {"e commerce", "ecommerce", "commerce", "shop"}:
        return "ecommerce"
    if raw in {"healthtech", "health", "healthcare", "clinic"}:
        return "healthcare"
    if raw in {"fintech", "finance", "financial"}:
        return "fintech"
    if raw in {"education", "school", "training"}:
        return "education"
    if raw in {"telecom", "network", "isp"}:
        return "telecom"
    if raw in {"professional services", "consulting", "agency", "services"}:
        return "professional_services"
    return "general_sme"
