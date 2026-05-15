"""Pydantic schemas for API contracts."""
from __future__ import annotations
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field

CheckStatus = Literal["passed", "warning", "failed", "not_checked"]
Severity = Literal["low", "medium", "high", "critical"]
RiskInterpretation = Literal[
    "insufficient_evidence", "critical", "high", "medium", "low", "minimal"
]
RiskLevel = Literal["critical", "high", "medium", "low", "minimal"]


# ---------- Agent ----------
class AgentScanInput(BaseModel):
    domain: str
    companyName: Optional[str] = None
    sector: Optional[str] = None
    organizationId: Optional[str] = None


class AgentCheckResult(BaseModel):
    id: str
    name: str
    status: CheckStatus
    score: int
    confidence: int
    severity: Severity
    description: str
    evidence: str
    recommendation: str
    mappedDomains: list[str] = Field(default_factory=list)
    mappedQuestionIds: list[str] = Field(default_factory=list)
    reason: Optional[str] = None


class AgentFinding(BaseModel):
    id: str
    title: str
    severity: Severity
    status: CheckStatus
    domainIds: list[str]
    checkId: str
    evidence: str
    recommendation: str


class AgentMappedQuestion(BaseModel):
    domainId: str
    questionId: str
    controlCode: Optional[str] = None
    checkId: str
    status: CheckStatus
    score: int
    confidence: int
    evidence: str


class AgentSummary(BaseModel):
    verifiedSignalScore: int
    riskInterpretation: RiskInterpretation
    evidenceConfidence: int
    agentReadinessImpact: int
    automatedQuestions: int = 12
    totalModelQuestions: int = 270
    coveragePercent: int = 4
    passedChecks: int = 0
    warningChecks: int = 0
    failedChecks: int = 0
    notChecked: int = 0
    criticalFindings: int = 0


class DomainCoverageEntry(BaseModel):
    score: Optional[int] = None
    confidence: int = 0
    coveredQuestions: int = 0
    notes: str = ""


class AgentScanResult(BaseModel):
    id: str
    createdAt: str
    target: dict[str, Any]
    summary: AgentSummary
    checks: list[AgentCheckResult]
    findings: list[AgentFinding]
    mappedQuestions: list[AgentMappedQuestion]
    domainCoverage: dict[str, DomainCoverageEntry]
    limitations: list[str]


# ---------- Assessment ----------
class AssessmentResponseIn(BaseModel):
    questionId: str
    domainId: str
    maturityLevel: int
    evidenceConfidence: float
    evidenceNote: Optional[str] = ""


class AssessmentEvaluateIn(BaseModel):
    companyId: Optional[str] = None
    organizationId: Optional[str] = None
    sessionId: Optional[str] = None
    sector: str
    final: bool = True
    responses: list[AssessmentResponseIn]


class DomainScore(BaseModel):
    score: int
    answered: int
    total: int
    evidenceConfidence: int


class AssessmentResult(BaseModel):
    id: Optional[str] = None
    sessionId: Optional[str] = None
    organizationId: Optional[str] = None
    frameworkId: Optional[str] = None
    modelVersion: Optional[str] = None
    sector: Optional[str] = None
    questionCount: Optional[int] = None
    answeredCount: Optional[int] = None
    completedAt: Optional[str] = None
    source: Optional[str] = None
    responseHash: Optional[str] = None
    stale: Optional[bool] = None
    overallScore: int
    riskLevel: RiskLevel
    evidenceConfidence: int
    domainScores: dict[str, DomainScore]
    criticalGaps: list[dict[str, Any]]
    weakEvidence: list[dict[str, Any]]
    recommendations: list[str]


class OrganizationIn(BaseModel):
    name: str
    sector: str
    size: Optional[str] = None
    domain: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "Morocco"
    profileCompleted: Optional[bool] = None


class AssessmentSessionResponseIn(BaseModel):
    organizationId: str
    response: AssessmentResponseIn
