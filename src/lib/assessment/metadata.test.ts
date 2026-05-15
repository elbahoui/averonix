import { describe, expect, it } from "vitest";
import type { AssessmentResult } from "@/lib/api";
import {
  assessmentMetadataRows,
  formatAssessmentDate,
  formatAssessmentModel,
  formatAssessmentSource,
} from "./metadata";

const result: AssessmentResult = {
  schemaVersion: 1,
  modelVersion: "iso27001-mvp-d1-d9-v1",
  sector: "saas",
  questionCount: 81,
  answeredCount: 81,
  completedAt: "2026-05-12T12:00:00.000Z",
  source: "backend",
  overallScore: 88,
  riskLevel: "low",
  evidenceConfidence: 90,
  domainScores: {},
  criticalGaps: [],
  weakEvidence: [],
  recommendations: [],
};

describe("assessment metadata labels", () => {
  it("formats freshness, model, question count, sector, and source", () => {
    expect(formatAssessmentDate(result.completedAt)).toBe("Evaluated on May 12, 2026");
    expect(formatAssessmentModel(result.modelVersion)).toBe("Model: ISO/IEC 27001 MVP D1-D9 v1");
    expect(formatAssessmentSource(result.source)).toBe("Source: Backend evaluation");
    expect(assessmentMetadataRows(result)).toContainEqual(["Questions", "81 / 81 answered"]);
    expect(assessmentMetadataRows(result)).toContainEqual(["Sector", "SaaS / Software"]);
  });
});
