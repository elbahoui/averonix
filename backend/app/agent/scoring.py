"""Agent scoring: separates Verified Signal, Confidence, and Risk Interpretation."""
from __future__ import annotations
from typing import Iterable

from ..schemas import AgentCheckResult, RiskInterpretation


SEVERITY_WEIGHT = {"critical": 1.5, "high": 1.3, "medium": 1.0, "low": 0.7}
STATUS_SCORE = {"passed": 100, "warning": 60, "failed": 20}

AUTOMATED_QUESTIONS_TARGET = 12
TOTAL_MODEL_QUESTIONS_DEFAULT = 270


def _w(c: AgentCheckResult) -> float:
    return SEVERITY_WEIGHT.get(c.severity, 1.0)


def verified_signal_score(checks: Iterable[AgentCheckResult]) -> int:
    """Weighted avg over checks that actually ran. Excludes not_checked."""
    total_w = 0.0
    acc = 0.0
    for c in checks:
        if c.status == "not_checked":
            continue
        s = STATUS_SCORE.get(c.status)
        if s is None:
            continue
        w = _w(c)
        total_w += w
        acc += s * w
    if total_w == 0:
        return 0
    return round(acc / total_w)


def evidence_confidence(checks: list[AgentCheckResult]) -> int:
    """Share of verified weight vs total possible weight. Honest 0..100."""
    if not checks:
        return 0
    total_w = sum(_w(c) for c in checks)
    verified_w = sum(_w(c) for c in checks if c.status != "not_checked")
    if total_w == 0:
        return 0
    return round((verified_w / total_w) * 100)


def agent_readiness_impact(signal: int, confidence: int) -> int:
    return round(signal * (confidence / 100))


def risk_interpretation(confidence: int, impact: int) -> RiskInterpretation:
    if confidence < 40:
        return "insufficient_evidence"
    if impact < 40:
        return "critical"
    if impact < 60:
        return "high"
    if impact < 75:
        return "medium"
    if impact < 90:
        return "low"
    return "minimal"


def coverage_summary() -> dict[str, int]:
    return {
        "automatedQuestions": AUTOMATED_QUESTIONS_TARGET,
        "totalModelQuestions": TOTAL_MODEL_QUESTIONS_DEFAULT,
        "coveragePercent": round(
            AUTOMATED_QUESTIONS_TARGET / TOTAL_MODEL_QUESTIONS_DEFAULT * 100
        ),
    }
