import type { CompanySector } from "@/lib/sector";

export type { CompanySector };

export type AgentCheckStatus = "passed" | "warning" | "failed" | "not_checked";

export type AgentRiskLevel = "critical" | "high" | "medium" | "low" | "minimal";

export type AgentSeverity = "low" | "medium" | "high" | "critical";

export type AgentEvidenceSource = "agent";

export type AgentScanInput = {
  domain: string;
  companyName?: string;
  sector?: CompanySector;
  organizationId?: string;
};

export type NormalizedTarget = {
  domain: string;
  originalInput: string;
};

export type AgentCheckResult = {
  id: string;
  name: string;
  status: AgentCheckStatus;
  score: number;
  confidence: number;
  severity: AgentSeverity;
  description: string;
  evidence: string;
  recommendation: string;
  mappedDomains: string[];
  mappedQuestionIds: string[];
  reason?: string;
  raw?: unknown;
};

export type AgentFinding = {
  id: string;
  title: string;
  severity: AgentSeverity;
  status: AgentCheckStatus;
  domainIds: string[];
  checkId: string;
  evidence: string;
  recommendation: string;
};

export type AgentMappedQuestion = {
  domainId: string;
  questionId: string;
  controlCode?: string;
  checkId: string;
  status: AgentCheckStatus;
  score: number;
  confidence: number;
  evidence: string;
};

export type AgentCoverageSummary = {
  automatedQuestions: number;
  totalModelQuestions: number;
  coveragePercent: number;
  coveredDomains: string[];
  weakDomains: string[];
};

export type AgentRiskInterpretation =
  | "insufficient_evidence"
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "minimal";

export type AgentScanSummary = {
  // New honest fields
  verifiedSignalScore: number;
  evidenceConfidence: number;
  agentReadinessImpact: number;
  riskInterpretation: AgentRiskInterpretation;
  // Legacy aliases kept for backward compat with stored history
  agentScore: number;
  riskLevel: AgentRiskLevel;
  automatedQuestions: number;
  totalModelQuestions: number;
  coveragePercent: number;
  passedChecks: number;
  warningChecks: number;
  failedChecks: number;
  notChecked: number;
  criticalFindings: number;
};

export type AgentScanResult = {
  id: string;
  createdAt: string;
  target: {
    domain: string;
    companyName?: string;
    sector?: CompanySector;
    organizationId?: string;
  };
  summary: AgentScanSummary;
  checks: AgentCheckResult[];
  findings: AgentFinding[];
  mappedQuestions: AgentMappedQuestion[];
  domainCoverage: Record<
    string,
    {
      score: number | null;
      confidence: number;
      coveredQuestions: number;
      notes: string;
    }
  >;
  limitations: string[];
};

export type AgentProgressStep = "normalize" | "https" | "headers" | "dns" | "map" | "findings";

export type AgentProgressStatus = "pending" | "running" | "done" | "failed";
