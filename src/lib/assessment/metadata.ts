import type { AssessmentResult } from "@/lib/api";
import { ASSESSMENT_MODEL_VERSION } from "@/lib/api";
import { sectorLabel } from "@/lib/sector";

export function formatAssessmentDate(completedAt?: string | null): string {
  if (!completedAt) return "Evaluation date unavailable";
  const date = new Date(completedAt);
  if (Number.isNaN(date.getTime())) return "Evaluation date unavailable";
  return `Evaluated on ${new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date)}`;
}

export function formatAssessmentModel(modelVersion?: string | null): string {
  if (modelVersion === ASSESSMENT_MODEL_VERSION) {
    return "Model: ISO/IEC 27001 MVP D1-D9 v1";
  }
  return `Model: ${modelVersion || "unknown"}`;
}

export function formatAssessmentSource(source?: AssessmentResult["source"]): string {
  return source === "backend" ? "Source: Backend evaluation" : "Source: Local fallback evaluation";
}

export function assessmentMetadataRows(result: AssessmentResult): Array<[string, string]> {
  return [
    ["Evaluated", formatAssessmentDate(result.completedAt).replace("Evaluated on ", "")],
    ["Model", formatAssessmentModel(result.modelVersion).replace("Model: ", "")],
    ["Sector", sectorLabel(result.sector)],
    ["Questions", `${result.answeredCount} / ${result.questionCount} answered`],
    ["Source", formatAssessmentSource(result.source).replace("Source: ", "")],
  ];
}
