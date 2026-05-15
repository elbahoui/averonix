from app.schemas import AgentCheckResult
from app.agent.scoring import (
    verified_signal_score, evidence_confidence,
    agent_readiness_impact, risk_interpretation,
)


def _c(status: str, severity: str = "medium") -> AgentCheckResult:
    return AgentCheckResult(
        id="x", name="x", status=status,  # type: ignore[arg-type]
        score=0, confidence=0, severity=severity,  # type: ignore[arg-type]
        description="", evidence="", recommendation="",
    )


def test_insufficient_evidence_when_mostly_not_checked():
    # 2 passed + 16 not_checked → confidence should be very low
    checks = [_c("passed", "high")] * 2 + [_c("not_checked", "medium")] * 16
    sig = verified_signal_score(checks)
    conf = evidence_confidence(checks)
    impact = agent_readiness_impact(sig, conf)
    interp = risk_interpretation(conf, impact)
    assert sig == 100
    assert conf < 40
    assert interp == "insufficient_evidence"


def test_high_confidence_path():
    checks = [_c("passed", "high")] * 10 + [_c("failed", "high")] * 2
    sig = verified_signal_score(checks)
    conf = evidence_confidence(checks)
    impact = agent_readiness_impact(sig, conf)
    interp = risk_interpretation(conf, impact)
    assert conf == 100
    assert sig > 60
    assert interp in {"medium", "low", "minimal", "high", "critical"}
    assert interp != "insufficient_evidence"
