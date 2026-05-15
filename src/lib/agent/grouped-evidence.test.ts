import { describe, expect, it } from "vitest";
import type { AgentCheckResult, AgentMappedQuestion } from "@/lib/agent";
import { groupMappedEvidence } from "./grouped-evidence";

function check(
  id: string,
  status: AgentCheckResult["status"],
  severity: AgentCheckResult["severity"],
): AgentCheckResult {
  return {
    id,
    name: id,
    status,
    severity,
    score: status === "passed" ? 100 : 0,
    confidence: status === "not_checked" ? 0 : 90,
    description: "",
    evidence: `${id} evidence`,
    recommendation: "",
    mappedDomains: ["D9"],
    mappedQuestionIds: ["D9-C05"],
  };
}

function mapped(checkId: string, status: AgentMappedQuestion["status"]): AgentMappedQuestion {
  return {
    domainId: "D9",
    questionId: "D9-C05",
    controlCode: "D9-C05",
    checkId,
    status,
    score: status === "passed" ? 100 : 0,
    confidence: status === "not_checked" ? 0 : 90,
    evidence: `${checkId} evidence`,
  };
}

describe("groupMappedEvidence", () => {
  it("produces one grouped row for repeated D9-C05 evidence", () => {
    const grouped = groupMappedEvidence(
      [mapped("https", "passed"), mapped("headers", "failed"), mapped("dns", "not_checked")],
      [
        check("https", "passed", "high"),
        check("headers", "failed", "critical"),
        check("dns", "not_checked", "medium"),
      ],
    );

    expect(grouped).toHaveLength(1);
    expect(grouped[0].questionId).toBe("D9-C05");
    expect(grouped[0].supportingChecks).toHaveLength(3);
    expect(grouped[0].status).toBe("failed");
  });
});
