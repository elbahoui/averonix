import { describe, expect, it } from "vitest";
import type { AgentScanResult } from "@/lib/agent/types";
import {
  PLANNED_FRAMEWORKS,
  buildComplianceControlRows,
  buildEvidenceReferenceRows,
  summarizeControls,
} from "@/lib/compliance/workspace";

describe("compliance workspace derivation", () => {
  it("builds all active ISO readiness controls as not started without responses", () => {
    const rows = buildComplianceControlRows({ sector: "saas", responses: [] });
    expect(rows).toHaveLength(81);
    expect(rows[0]).toMatchObject({
      status: "Not started",
      maturityLabel: "Not started",
      evidenceStatus: "Missing",
      evidenceConfidence: 0,
      owner: "Unassigned",
    });
  });

  it("maps response maturity and confidence into table statuses", () => {
    const rows = buildComplianceControlRows({
      sector: "saas",
      responses: [
        {
          questionId: "D1-C01",
          domainId: "D1",
          maturityLevel: 3,
          evidenceConfidence: 1,
          evidenceNote: "Reference exists",
        },
        {
          questionId: "D1-C02",
          domainId: "D1",
          maturityLevel: 1,
          evidenceConfidence: 0.3,
        },
      ],
    });

    expect(rows.find((row) => row.id === "D1-C01")).toMatchObject({
      status: "Strong reference",
      maturityLabel: "Implemented and evidenced",
      evidenceStatus: "Strong reference",
      evidenceConfidence: 100,
    });
    expect(rows.find((row) => row.id === "D1-C02")).toMatchObject({
      status: "Needs evidence reference",
      maturityLabel: "Partially implemented",
      evidenceStatus: "Needs reference",
      evidenceConfidence: 30,
    });
  });

  it("keeps future frameworks planned only", () => {
    expect(PLANNED_FRAMEWORKS.map((framework) => framework.status)).toEqual([
      "Planned",
      "Planned",
      "Planned",
      "Planned",
    ]);
  });

  it("adds Agent rows as signal-only evidence references", () => {
    const controls = buildComplianceControlRows({ sector: "saas", responses: [] });
    const rows = buildEvidenceReferenceRows({ controls, agent: sampleAgentScan() });
    expect(rows[0]).toMatchObject({
      linkedControl: "D9-C05",
      status: "Agent signal only",
      source: "agent",
    });
  });

  it("summarizes strong and weak evidence references", () => {
    const controls = buildComplianceControlRows({
      sector: "saas",
      responses: [
        { questionId: "D1-C01", domainId: "D1", maturityLevel: 3, evidenceConfidence: 1 },
        { questionId: "D1-C02", domainId: "D1", maturityLevel: 1, evidenceConfidence: 0.3 },
      ],
    });
    expect(summarizeControls(controls)).toMatchObject({
      total: 81,
      answered: 2,
      strongReferences: 1,
    });
  });
});

function sampleAgentScan(): AgentScanResult {
  return {
    id: "scan-1",
    createdAt: "2026-05-15T10:00:00.000Z",
    target: { domain: "example.com", sector: "saas", organizationId: "org-1" },
    summary: {
      verifiedSignalScore: 90,
      evidenceConfidence: 80,
      agentReadinessImpact: 72,
      riskInterpretation: "low",
      agentScore: 90,
      riskLevel: "low",
      automatedQuestions: 12,
      totalModelQuestions: 270,
      coveragePercent: 4,
      passedChecks: 1,
      warningChecks: 0,
      failedChecks: 0,
      notChecked: 0,
      criticalFindings: 0,
    },
    checks: [
      {
        id: "https",
        name: "HTTPS enabled",
        status: "passed",
        score: 100,
        confidence: 100,
        severity: "high",
        description: "HTTPS is reachable",
        evidence: "HTTPS response observed",
        recommendation: "Keep TLS monitored.",
        mappedDomains: ["D9"],
        mappedQuestionIds: ["D9-C05"],
      },
    ],
    findings: [],
    mappedQuestions: [
      {
        domainId: "D9",
        questionId: "D9-C05",
        controlCode: "D9-C05",
        checkId: "https",
        status: "passed",
        score: 100,
        confidence: 100,
        evidence: "HTTPS response observed",
      },
    ],
    domainCoverage: {},
    limitations: [],
  };
}
