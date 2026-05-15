import { afterEach, describe, expect, it, vi } from "vitest";
import { localAssessmentQuestions, runBackendAgentScan } from "./api";

describe("localAssessmentQuestions", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it.each(["SaaS / Software", "E-commerce", "Healthtech"])(
    "loads 81 questions for %s",
    (sector) => {
      const bundle = localAssessmentQuestions(sector);
      const total = Object.values(bundle.domains).reduce(
        (sum, domain) => sum + domain.questions.length,
        0,
      );
      expect(total).toBe(81);
    },
  );

  it("sends organizationId in backend Agent scan requests", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:8000");
    const fetchMock = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) =>
        new Response(
          JSON.stringify({
            id: "scan_1",
            createdAt: "2026-05-14T00:00:00.000Z",
            target: { domain: "example.com", organizationId: "org_123" },
            summary: {
              verifiedSignalScore: 90,
              evidenceConfidence: 90,
              agentReadinessImpact: 81,
              riskInterpretation: "low",
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
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await runBackendAgentScan({
      domain: "example.com",
      companyName: "Averonix Demo",
      sector: "saas",
      organizationId: "org_123",
    });

    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body).toMatchObject({
      domain: "example.com",
      companyName: "Averonix Demo",
      sector: "saas",
      organizationId: "org_123",
    });
  });
});
