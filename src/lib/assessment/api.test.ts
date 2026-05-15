import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAssessmentSession,
  getLatestPersistedAssessmentResult,
  savePersistedAssessmentResponse,
} from "./api";

describe("assessment persistence API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does not call the backend without an organization", async () => {
    await expect(getAssessmentSession(undefined, "saas")).resolves.toBeNull();
    await expect(
      savePersistedAssessmentResponse(undefined, "session", {
        questionId: "D1-C01",
        domainId: "D1",
        maturityLevel: 3,
        evidenceConfidence: 1,
      }),
    ).resolves.toBe(false);
  });

  it("does not return stale persisted results as final", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:8000");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              result: {
                stale: true,
                overallScore: 80,
                riskLevel: "low",
                evidenceConfidence: 90,
                domainScores: {},
                criticalGaps: [],
                weakEvidence: [],
                recommendations: [],
              },
            }),
            { status: 200 },
          ),
      ),
    );

    await expect(getLatestPersistedAssessmentResult("org_1", "session_1")).resolves.toBeNull();
  });
});
