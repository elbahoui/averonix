"""Loads ISO/IEC 27001 readiness questions from JSON."""
from __future__ import annotations
import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from ..sector import normalize_sector

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "iso27001"


@lru_cache(maxsize=1)
def load_all_domains() -> list[dict[str, Any]]:
    domains = []
    for i in range(1, 10):
        with open(DATA_DIR / f"d{i}.json", "r", encoding="utf-8") as f:
            domains.append(json.load(f))
    return domains


def all_questions() -> list[dict[str, Any]]:
    out = []
    for d in load_all_domains():
        out.extend(d.get("coreQuestions", []) or [])
        out.extend(d.get("sectorQuestions", []) or [])
    return out


def find_question(qid: str) -> dict[str, Any] | None:
    for q in all_questions():
        if q.get("id") == qid:
            return q
    return None


def questions_for_sector(sector: str) -> dict[str, Any]:
    """Returns {domainId: {domain, questions: [6 core + 3 sector]}} for the given sector."""
    sector = normalize_sector(sector)
    out: dict[str, Any] = {}
    for d in load_all_domains():
        meta = d["domain"]
        core = d.get("coreQuestions", []) or []
        sector_qs = [
            q for q in (d.get("sectorQuestions", []) or [])
            if sector in [normalize_sector(s) for s in (q.get("appliesTo") or [])]
        ]
        out[meta["id"]] = {
            "domain": meta,
            "questions": core + sector_qs[:3],
        }
    return out
