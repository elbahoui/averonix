import { findQuestion } from "@/data/iso27001";
import type { AgentCheckResult, AgentFinding, AgentMappedQuestion, AgentScanResult } from "./types";

export function toFindings(checks: AgentCheckResult[]): AgentFinding[] {
  return checks
    .filter((c) => c.status === "failed" || c.status === "warning")
    .map((c) => ({
      id: `finding-${c.id}`,
      title: c.name,
      severity: c.severity,
      status: c.status,
      domainIds: c.mappedDomains,
      checkId: c.id,
      evidence: c.evidence,
      recommendation: c.recommendation,
    }));
}

export function toMappedQuestions(checks: AgentCheckResult[]): AgentMappedQuestion[] {
  const out: AgentMappedQuestion[] = [];
  for (const c of checks) {
    for (const qid of c.mappedQuestionIds) {
      const q = findQuestion(qid);
      out.push({
        domainId: q?.domainId ?? qid.split("-")[0] ?? "",
        questionId: qid,
        controlCode: q?.controlCode,
        checkId: c.id,
        status: c.status,
        score: c.score,
        confidence: c.confidence,
        evidence: c.evidence,
      });
    }
  }
  return out;
}

export function toDomainCoverage(checks: AgentCheckResult[]): AgentScanResult["domainCoverage"] {
  const domains = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9"];
  const out: AgentScanResult["domainCoverage"] = {};
  for (const d of domains) {
    const relevant = checks.filter((c) => c.mappedDomains.includes(d));
    const completed = relevant.filter((c) => c.status !== "not_checked");
    if (completed.length === 0) {
      out[d] = {
        score: null,
        confidence: 0,
        coveredQuestions: 0,
        notes: ["D1", "D2", "D3", "D4", "D5", "D6"].includes(d)
          ? "Requires guided assessment or integration."
          : "No automated checks completed yet.",
      };
      continue;
    }
    const score = Math.round(completed.reduce((a, c) => a + c.score, 0) / completed.length);
    const confidence = Math.round(
      completed.reduce((a, c) => a + c.confidence, 0) / completed.length,
    );
    const coveredQuestions = new Set(
      completed.flatMap((c) => c.mappedQuestionIds.filter((qid) => qid.startsWith(d))),
    ).size;
    out[d] = {
      score,
      confidence,
      coveredQuestions,
      notes: "Partial — externally observable signals only.",
    };
  }
  return out;
}
