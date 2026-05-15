// localStorage module for the Manual Assessment.
import type { AssessmentResponse, AssessmentResult } from "@/lib/api";
import { ASSESSMENT_MODEL_VERSION } from "@/lib/api";

const RESPONSES_KEY = "averonix.assessment.responses";
const RESULTS_KEY = "averonix.assessment.results";
const PROGRESS_KEY = "averonix.assessment.progress";

export type AssessmentProgress = {
  sector: string;
  activeDomainId: string;
  totalQuestions: number;
  answered: number;
  updatedAt: string;
};

function isLSAvailable(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isLSAvailable()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (!isLSAvailable()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / blocked — ignore
  }
}

export function getAssessmentResponses(): AssessmentResponse[] {
  const raw = readJSON<AssessmentResponse[]>(RESPONSES_KEY, []);
  return Array.isArray(raw) ? raw : [];
}

export function saveAssessmentResponses(responses: AssessmentResponse[]): void {
  writeJSON(RESPONSES_KEY, responses);
}

export function saveAssessmentResponse(response: AssessmentResponse): void {
  const list = getAssessmentResponses();
  const idx = list.findIndex((r) => r.questionId === response.questionId);
  if (idx >= 0) list[idx] = response;
  else list.push(response);
  saveAssessmentResponses(list);
  clearAssessmentResults();
}

export function getAssessmentProgress(): AssessmentProgress | null {
  return readJSON<AssessmentProgress | null>(PROGRESS_KEY, null);
}

export function saveAssessmentProgress(progress: AssessmentProgress): void {
  writeJSON(PROGRESS_KEY, progress);
}

export function getAssessmentResults(): AssessmentResult | null {
  const result = readJSON<AssessmentResult | null>(RESULTS_KEY, null);
  if (!result) return null;
  if (
    result.schemaVersion !== 1 ||
    result.modelVersion !== ASSESSMENT_MODEL_VERSION ||
    !result.completedAt
  ) {
    return null;
  }
  return result;
}

export function saveAssessmentResults(result: AssessmentResult): void {
  writeJSON(RESULTS_KEY, result);
}

export function clearAssessmentResults(): void {
  if (!isLSAvailable()) return;
  try {
    window.localStorage.removeItem(RESULTS_KEY);
  } catch {
    // ignore
  }
}

export function clearAssessment(): void {
  if (!isLSAvailable()) return;
  try {
    window.localStorage.removeItem(RESPONSES_KEY);
    window.localStorage.removeItem(RESULTS_KEY);
    window.localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // ignore
  }
}
