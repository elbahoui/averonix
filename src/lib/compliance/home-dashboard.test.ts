import { describe, expect, it } from "vitest";
import type { AgentScanResult } from "@/lib/agent/types";
import type { AssessmentResult } from "@/lib/api";
import {
  buildHomePriorityActions,
  buildHomeProgressCards,
  deriveHomeAssessmentCounts,
  filterHomePriorityActions,
  filterHomeProgressCards,
} from "@/lib/compliance/home-dashboard";
import { buildComplianceControlRows } from "@/lib/compliance/workspace";

describe("home dashboard derivation", () => {
  it("builds the selected MVP six card set", () => {
    const cards = buildHomeProgressCards({
      controls: buildComplianceControlRows({ sector: "saas", responses: [] }),
      result: null,
      progress: null,
      agent: null,
    });

    expect(cards.map((card) => card.id)).toEqual([
      "iso27001",
      "agent",
      "evidence",
      "report",
      "nist-csf",
      "soc2",
    ]);
  });

  it("keeps planned framework cards disabled without fake progress", () => {
    const cards = buildHomeProgressCards({
      controls: buildComplianceControlRows({ sector: "saas", responses: [] }),
      result: null,
      progress: null,
      agent: null,
    });
    const plannedCards = cards.filter((card) => card.group === "planned");

    expect(plannedCards).toHaveLength(2);
    expect(plannedCards.every((card) => card.disabled)).toBe(true);
    expect(plannedCards.every((card) => card.value === "Planned")).toBe(true);
    expect(plannedCards.every((card) => card.progress === null)).toBe(true);
    expect(plannedCards.every((card) => card.rightFooter === "Not active")).toBe(true);
  });

  it("uses valid ISO result first, then progress, then not evaluated", () => {
    const controls = buildComplianceControlRows({
      sector: "saas",
      responses: [
        { questionId: "D1-C01", domainId: "D1", maturityLevel: 1, evidenceConfidence: 0.3 },
      ],
    });

    expect(
      buildHomeProgressCards({
        controls,
        result: sampleResult(),
        progress: null,
        agent: null,
      }).find((card) => card.id === "iso27001"),
    ).toMatchObject({ value: "68%", progress: 100 });

    expect(
      buildHomeProgressCards({
        controls,
        result: null,
        progress: {
          sector: "saas",
          activeDomainId: "D1",
          totalQuestions: 81,
          answered: 1,
          updatedAt: "2026-05-15T10:00:00.000Z",
        },
        agent: null,
      }).find((card) => card.id === "iso27001"),
    ).toMatchObject({ value: "1%", progress: 1 });

    expect(
      buildHomeProgressCards({
        controls: buildComplianceControlRows({ sector: "saas", responses: [] }),
        result: null,
        progress: null,
        agent: null,
      }).find((card) => card.id === "iso27001"),
    ).toMatchObject({ value: "Not evaluated", progress: 0 });
  });

  it("uses external signal wording for Agent card footer", () => {
    const agentCard = buildHomeProgressCards({
      controls: buildComplianceControlRows({ sector: "saas", responses: [] }),
      result: null,
      progress: null,
      agent: sampleAgentScan(),
    }).find((card) => card.id === "agent");

    expect(agentCard).toMatchObject({
      value: "51/100",
      leftFooter: "3 external signals passed",
      rightFooter: "18 total",
    });
  });

  it("keeps empty evidence and report cards compact without fake progress", () => {
    const cards = buildHomeProgressCards({
      controls: buildComplianceControlRows({ sector: "saas", responses: [] }),
      result: null,
      progress: null,
      agent: null,
    });

    expect(cards.find((card) => card.id === "evidence")).toMatchObject({
      value: "0%",
      leftFooter: "0 strong references",
      progress: 0,
    });
    expect(cards.find((card) => card.id === "report")).toMatchObject({
      badge: "Draft",
      value: "Draft",
      leftFooter: "Complete assessment",
      rightFooter: "Preview only",
    });
  });

  it("filters cards by active, planned, ISO, and evidence groups", () => {
    const cards = buildHomeProgressCards({
      controls: buildComplianceControlRows({ sector: "saas", responses: [] }),
      result: null,
      progress: null,
      agent: null,
    });

    expect(filterHomeProgressCards(cards, "Active").map((card) => card.id)).toEqual([
      "iso27001",
      "agent",
      "evidence",
      "report",
    ]);
    expect(filterHomeProgressCards(cards, "Planned").map((card) => card.id)).toEqual([
      "nist-csf",
      "soc2",
    ]);
    expect(filterHomeProgressCards(cards, "ISO/IEC 27001").map((card) => card.id)).toEqual([
      "iso27001",
    ]);
    expect(filterHomeProgressCards(cards, "Evidence").map((card) => card.id)).toEqual([
      "agent",
      "evidence",
    ]);
  });

  it("builds and filters priority actions", () => {
    const actions = buildHomePriorityActions({
      answeredQuestions: 10,
      totalQuestions: 81,
      result: null,
      agent: sampleAgentScan(),
      weakReferences: 4,
      source: "workspace",
    });

    expect(
      actions.some((action) => action.title === "Complete remaining assessment questions"),
    ).toBe(true);
    expect(actions.some((action) => action.title === "Track stronger evidence references")).toBe(
      true,
    );
    expect(
      filterHomePriorityActions(actions, "High").every((action) => action.priority === "High"),
    ).toBe(true);
    expect(
      filterHomePriorityActions(actions, "Low").every((action) => action.priority === "Low"),
    ).toBe(true);
  });

  it("derives counts from a non-stale result before local progress", () => {
    expect(
      deriveHomeAssessmentCounts({
        controls: buildComplianceControlRows({ sector: "saas", responses: [] }),
        result: sampleResult(),
        progress: {
          sector: "saas",
          activeDomainId: "D1",
          totalQuestions: 81,
          answered: 2,
          updatedAt: "2026-05-15T10:00:00.000Z",
        },
      }),
    ).toEqual({ answeredQuestions: 81, totalQuestions: 81 });
  });

  it("does not emit restricted product wording in card or action labels", () => {
    const cards = buildHomeProgressCards({
      controls: buildComplianceControlRows({ sector: "saas", responses: [] }),
      result: sampleResult(),
      progress: null,
      agent: sampleAgentScan(),
    });
    const actions = buildHomePriorityActions({
      answeredQuestions: 20,
      totalQuestions: 81,
      result: sampleResult(),
      agent: sampleAgentScan(),
      weakReferences: 3,
      source: "workspace",
    });
    const text = [
      ...cards.flatMap((card) => [
        card.title,
        card.badge,
        card.value,
        card.leftFooter,
        card.rightFooter,
      ]),
      ...actions.flatMap((action) => [action.title, action.detail]),
    ].join(" ");

    expect(text).not.toMatch(
      /compliant|certified|audit-ready|control passed|audit report|evidence upload/i,
    );
  });
});

function sampleResult(): AssessmentResult {
  return {
    id: "result-1",
    schemaVersion: 1,
    modelVersion: "iso27001-mvp-d1-d9-v1",
    sector: "saas",
    questionCount: 81,
    answeredCount: 81,
    completedAt: "2026-05-15T10:00:00.000Z",
    source: "backend",
    overallScore: 68,
    riskLevel: "medium",
    evidenceConfidence: 62,
    domainScores: {},
    criticalGaps: [],
    weakEvidence: [],
    recommendations: [],
  };
}

function sampleAgentScan(): AgentScanResult {
  return {
    id: "scan-1",
    createdAt: "2026-05-15T10:00:00.000Z",
    target: { domain: "example.com", sector: "saas", organizationId: "org-1" },
    summary: {
      verifiedSignalScore: 51,
      evidenceConfidence: 46,
      agentReadinessImpact: 23,
      riskInterpretation: "critical",
      agentScore: 51,
      riskLevel: "critical",
      automatedQuestions: 12,
      totalModelQuestions: 270,
      coveragePercent: 4,
      passedChecks: 3,
      warningChecks: 0,
      failedChecks: 4,
      notChecked: 11,
      criticalFindings: 4,
    },
    checks: [],
    findings: [],
    mappedQuestions: [],
    domainCoverage: {},
    limitations: [],
  };
}
