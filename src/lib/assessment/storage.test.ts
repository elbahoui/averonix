// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import type { AssessmentResult } from "@/lib/api";
import {
  clearAssessment,
  getAssessmentResults,
  saveAssessmentResponse,
  saveAssessmentResults,
} from "./storage";

const result: AssessmentResult = {
  schemaVersion: 1,
  modelVersion: "iso27001-mvp-d1-d9-v1",
  sector: "saas",
  questionCount: 81,
  answeredCount: 81,
  completedAt: "2026-05-12T00:00:00.000Z",
  source: "local",
  overallScore: 100,
  riskLevel: "minimal",
  evidenceConfidence: 100,
  domainScores: {},
  criticalGaps: [],
  weakEvidence: [],
  recommendations: [],
};

describe("assessment storage", () => {
  beforeEach(() => {
    clearAssessment();
  });

  it("clears prior assessment result when a response changes", () => {
    saveAssessmentResults(result);
    expect(getAssessmentResults()).not.toBeNull();

    saveAssessmentResponse({
      questionId: "D1-C01",
      domainId: "D1",
      maturityLevel: 1,
      evidenceConfidence: 0.6,
    });

    expect(getAssessmentResults()).toBeNull();
  });
});
