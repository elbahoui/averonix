"""Agent scan orchestrator."""
from __future__ import annotations
import uuid
from datetime import datetime, timezone

from ..schemas import (
    AgentCheckResult, AgentFinding, AgentMappedQuestion,
    AgentScanInput, AgentScanResult, AgentSummary, DomainCoverageEntry,
)
from ..assessment.questions_loader import find_question
from ..sector import normalize_sector
from .checks import run_all_checks
from .scoring import (
    agent_readiness_impact, coverage_summary, evidence_confidence,
    risk_interpretation, verified_signal_score,
)
from .normalize_domain import normalize_domain
from ..security import validate_resolved_public_ips


LIMITATIONS = [
    "Agent Evidence is partial and externally observable only.",
    "Agent cannot verify leadership commitment.",
    "Agent cannot verify ISMS scope.",
    "Agent cannot verify risk treatment decisions.",
    "Agent cannot verify internal documentation.",
    "Agent cannot verify training or awareness.",
    "Agent cannot verify management review.",
    "Full readiness requires guided assessment and future integrations.",
]


def _findings(checks: list[AgentCheckResult]) -> list[AgentFinding]:
    return [
        AgentFinding(
            id=f"finding-{c.id}", title=c.name, severity=c.severity, status=c.status,
            domainIds=c.mappedDomains, checkId=c.id,
            evidence=c.evidence, recommendation=c.recommendation,
        )
        for c in checks if c.status in ("failed", "warning")
    ]


def _mapped(checks: list[AgentCheckResult]) -> list[AgentMappedQuestion]:
    out: list[AgentMappedQuestion] = []
    for c in checks:
        for qid in c.mappedQuestionIds:
            q = find_question(qid)
            out.append(AgentMappedQuestion(
                domainId=q.get("domainId") if q else qid.split("-")[0],
                questionId=qid,
                controlCode=(q or {}).get("controlCode"),
                checkId=c.id, status=c.status, score=c.score,
                confidence=c.confidence, evidence=c.evidence,
            ))
    return out


def _domain_coverage(checks: list[AgentCheckResult]) -> dict[str, DomainCoverageEntry]:
    out: dict[str, DomainCoverageEntry] = {}
    for d in [f"D{i}" for i in range(1, 10)]:
        relevant = [c for c in checks if d in c.mappedDomains]
        completed = [c for c in relevant if c.status != "not_checked"]
        if not completed:
            out[d] = DomainCoverageEntry(
                score=None, confidence=0, coveredQuestions=0,
                notes=("Requires guided assessment or integration."
                       if d in {"D1", "D2", "D3", "D4", "D5", "D6"}
                       else "No automated checks completed yet."),
            )
            continue
        avg_score = round(sum(c.score for c in completed) / len(completed))
        avg_conf = round(sum(c.confidence for c in completed) / len(completed))
        qs = {qid for c in completed for qid in c.mappedQuestionIds if qid.startswith(d)}
        out[d] = DomainCoverageEntry(
            score=avg_score, confidence=avg_conf, coveredQuestions=len(qs),
            notes="Partial — externally observable signals only.",
        )
    return out


async def run_agent_scan(payload: AgentScanInput) -> AgentScanResult:
    created_at = datetime.now(timezone.utc).isoformat()
    domain = normalize_domain(payload.domain)
    validate_resolved_public_ips(domain)
    checks = await run_all_checks(domain)
    return _assemble(payload, domain, checks, created_at)


def _assemble(payload: AgentScanInput, domain: str,
              checks: list[AgentCheckResult], created_at: str) -> AgentScanResult:
    signal = verified_signal_score(checks)
    confidence = evidence_confidence(checks)
    impact = agent_readiness_impact(signal, confidence)
    interp = risk_interpretation(confidence, impact)
    cov = coverage_summary()
    findings = _findings(checks)

    summary = AgentSummary(
        verifiedSignalScore=signal,
        riskInterpretation=interp,
        evidenceConfidence=confidence,
        agentReadinessImpact=impact,
        automatedQuestions=cov["automatedQuestions"],
        totalModelQuestions=cov["totalModelQuestions"],
        coveragePercent=cov["coveragePercent"],
        passedChecks=sum(1 for c in checks if c.status == "passed"),
        warningChecks=sum(1 for c in checks if c.status == "warning"),
        failedChecks=sum(1 for c in checks if c.status == "failed"),
        notChecked=sum(1 for c in checks if c.status == "not_checked"),
        criticalFindings=sum(1 for f in findings if f.severity in ("critical", "high")),
    )

    return AgentScanResult(
        id=f"scan_{uuid.uuid4().hex[:10]}",
        createdAt=created_at,
        target={
            "domain": domain,
            "companyName": payload.companyName,
            "sector": normalize_sector(payload.sector) if payload.sector else None,
        },
        summary=summary,
        checks=checks,
        findings=findings,
        mappedQuestions=_mapped(checks),
        domainCoverage=_domain_coverage(checks),
        limitations=LIMITATIONS,
    )
