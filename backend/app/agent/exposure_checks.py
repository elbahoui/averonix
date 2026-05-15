"""Exposure check: we explicitly do NOT port-scan. Marks not_checked."""
from __future__ import annotations
from ..schemas import AgentCheckResult
from .mapping import get_mapping


def check_exposed_services(_: str) -> AgentCheckResult:
    m = get_mapping("exposed_services")
    return AgentCheckResult(
        id="exposed_services",
        name="Exposed services",
        status="not_checked",
        score=0, confidence=0, severity="medium",
        description="Active port scanning is intentionally out of scope.",
        evidence="No active port probing performed.",
        recommendation="Use an internal authorized scanner for attack-surface enumeration.",
        mappedDomains=m["domains"], mappedQuestionIds=m["questionIds"],
        reason="Intrusive port scanning disabled by policy.",
    )
