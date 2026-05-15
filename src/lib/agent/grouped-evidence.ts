import { findQuestion } from "@/data/iso27001";
import type { AgentCheckResult, AgentCheckStatus, AgentMappedQuestion } from "@/lib/agent/types";

export type GroupedAgentEvidence = {
  domainId: string;
  questionId: string;
  controlCode?: string;
  question: string;
  status: AgentCheckStatus | "partial";
  score: number;
  confidence: number;
  supportingChecks: Array<AgentMappedQuestion & { check?: AgentCheckResult }>;
};

function groupStatus(
  supportingChecks: Array<AgentMappedQuestion & { check?: AgentCheckResult }>,
): GroupedAgentEvidence["status"] {
  if (supportingChecks.every((m) => m.status === "not_checked")) {
    return "not_checked";
  }

  const failedHighOrCritical = supportingChecks.some(
    (m) =>
      m.status === "failed" && (m.check?.severity === "high" || m.check?.severity === "critical"),
  );
  if (failedHighOrCritical) return "failed";

  const allCheckedPassed =
    supportingChecks.every((m) => m.status === "passed") &&
    supportingChecks.every((m) => m.check?.status !== "warning");
  if (allCheckedPassed) return "passed";

  return "partial";
}

export function groupMappedEvidence(
  mappedQuestions: AgentMappedQuestion[],
  checks: AgentCheckResult[],
): GroupedAgentEvidence[] {
  const checkById = new Map(checks.map((check) => [check.id, check]));
  const groups = new Map<string, Array<AgentMappedQuestion & { check?: AgentCheckResult }>>();

  for (const mapped of mappedQuestions) {
    const items = groups.get(mapped.questionId) ?? [];
    items.push({ ...mapped, check: checkById.get(mapped.checkId) });
    groups.set(mapped.questionId, items);
  }

  return Array.from(groups.entries()).map(([questionId, supportingChecks]) => {
    const first = supportingChecks[0];
    const q = findQuestion(questionId);
    const checkedSignals = supportingChecks.filter((m) => m.status !== "not_checked");
    const scoreBase = checkedSignals.length ? checkedSignals : supportingChecks;
    return {
      domainId: first.domainId,
      questionId,
      controlCode: first.controlCode ?? q?.controlCode,
      question: q?.question ?? "Question not found in model.",
      status: groupStatus(supportingChecks),
      score: Math.round(
        scoreBase.reduce((sum, m) => sum + m.score, 0) / Math.max(scoreBase.length, 1),
      ),
      confidence: Math.round(
        scoreBase.reduce((sum, m) => sum + m.confidence, 0) / Math.max(scoreBase.length, 1),
      ),
      supportingChecks,
    };
  });
}
