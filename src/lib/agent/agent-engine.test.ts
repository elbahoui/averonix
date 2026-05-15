import { afterEach, describe, expect, it, vi } from "vitest";
import type { AgentScanResult } from "./types";

const apiMocks = vi.hoisted(() => ({
  isBackendConfigured: vi.fn(() => true),
  runBackendAgentScan: vi.fn(),
}));

vi.mock("@/lib/api", () => apiMocks);
vi.mock("./storage", () => ({ saveAgentScan: vi.fn() }));

import { runAgentScan } from "./agent-engine";

function backendResult(): AgentScanResult {
  return {
    id: "scan_1",
    createdAt: "2026-05-14T00:00:00.000Z",
    target: { domain: "example.com", sector: "saas", organizationId: "org_123" },
    summary: {
      verifiedSignalScore: 90,
      evidenceConfidence: 90,
      agentReadinessImpact: 81,
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
    checks: [],
    findings: [],
    mappedQuestions: [],
    domainCoverage: {},
    limitations: [],
  };
}

describe("runAgentScan", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    apiMocks.isBackendConfigured.mockReturnValue(true);
  });

  it("forwards organizationId to the backend scan client", async () => {
    apiMocks.runBackendAgentScan.mockResolvedValueOnce(backendResult());

    await runAgentScan({
      domain: "example.com",
      companyName: "Averonix Demo",
      sector: "saas",
      organizationId: "org_123",
    });

    expect(apiMocks.runBackendAgentScan).toHaveBeenCalledWith(
      expect.objectContaining({
        domain: "example.com",
        companyName: "Averonix Demo",
        sector: "saas",
        organizationId: "org_123",
      }),
    );
  });

  it("does not use browser fallback for workspace scans in production", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("PROD", true);
    apiMocks.runBackendAgentScan.mockResolvedValueOnce(null);

    const result = await runAgentScan({
      domain: "example.com",
      companyName: "Averonix Demo",
      sector: "saas",
      organizationId: "org_123",
    });

    expect(result.checks).toHaveLength(1);
    expect(result.checks[0]?.id).toBe("backend_validation");
    expect(result.checks[0]?.status).toBe("failed");
  });
});
