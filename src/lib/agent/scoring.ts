import type {
  AgentCheckResult,
  AgentCheckStatus,
  AgentCoverageSummary,
  AgentRiskInterpretation,
  AgentRiskLevel,
  AgentSeverity,
} from "./types";
import { getAllQuestions } from "@/data/iso27001";

export function getStatusScore(status: AgentCheckStatus): number | null {
  switch (status) {
    case "passed":
      return 100;
    case "warning":
      return 60;
    case "failed":
      return 20;
    case "not_checked":
      return null;
  }
}

export function getSeverityWeight(severity: AgentSeverity): number {
  switch (severity) {
    case "critical":
      return 1.5;
    case "high":
      return 1.3;
    case "medium":
      return 1.0;
    case "low":
      return 0.7;
  }
}

/** Verified Signal Score: weighted avg over checks that actually ran. */
export function calculateVerifiedSignalScore(checks: AgentCheckResult[]): number {
  let totalW = 0,
    acc = 0;
  for (const c of checks) {
    const s = getStatusScore(c.status);
    if (s === null) continue;
    const w = getSeverityWeight(c.severity);
    totalW += w;
    acc += s * w;
  }
  if (totalW === 0) return 0;
  return Math.round(acc / totalW);
}

/** Evidence Confidence: verified weight / total weight (0..100). */
export function calculateEvidenceConfidence(checks: AgentCheckResult[]): number {
  if (!checks.length) return 0;
  const total = checks.reduce((a, c) => a + getSeverityWeight(c.severity), 0);
  const verified = checks
    .filter((c) => c.status !== "not_checked")
    .reduce((a, c) => a + getSeverityWeight(c.severity), 0);
  if (total === 0) return 0;
  return Math.round((verified / total) * 100);
}

export function agentReadinessImpact(signal: number, confidence: number): number {
  return Math.round(signal * (confidence / 100));
}

export function riskInterpretation(confidence: number, impact: number): AgentRiskInterpretation {
  if (confidence < 40) return "insufficient_evidence";
  if (impact < 40) return "critical";
  if (impact < 60) return "high";
  if (impact < 75) return "medium";
  if (impact < 90) return "low";
  return "minimal";
}

export function riskInterpretationToLevel(r: AgentRiskInterpretation): AgentRiskLevel {
  if (r === "insufficient_evidence") return "critical";
  return r;
}

/** Legacy alias kept so previously-stored history doesn't error. */
export const calculateAgentScore = calculateVerifiedSignalScore;
export function riskLevelFromScore(score: number): AgentRiskLevel {
  if (score < 40) return "critical";
  if (score < 60) return "high";
  if (score < 75) return "medium";
  if (score < 90) return "low";
  return "minimal";
}

export const AUTOMATED_QUESTIONS_TARGET = 12;

export function buildCoverageSummary(checks: AgentCheckResult[]): AgentCoverageSummary {
  const total = getAllQuestions().length || 270;
  const coveredDomains = Array.from(
    new Set(checks.filter((c) => c.status !== "not_checked").flatMap((c) => c.mappedDomains)),
  );
  const weakDomains = ["D1", "D2", "D3", "D4", "D5", "D6"].filter(
    (d) => !coveredDomains.includes(d),
  );
  return {
    automatedQuestions: AUTOMATED_QUESTIONS_TARGET,
    totalModelQuestions: total,
    coveragePercent: Math.round((AUTOMATED_QUESTIONS_TARGET / total) * 100),
    coveredDomains,
    weakDomains,
  };
}
