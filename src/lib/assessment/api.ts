import {
  ASSESSMENT_MODEL_VERSION,
  fetchJSON,
  type AssessmentResponse,
  type AssessmentResult,
} from "@/lib/api";
import { normalizeSector, type CompanySector } from "@/lib/sector";

export type AssessmentSession = {
  id: string;
  organizationId: string;
  sector: CompanySector;
  status: "draft" | "completed" | "stale";
  questionCount: number;
  answeredCount: number;
  completedAt?: string | null;
  updatedAt?: string | null;
};

type SessionRow = {
  id: string;
  organization_id: string;
  sector: string;
  status: AssessmentSession["status"];
  question_count: number;
  answered_count: number;
  completed_at?: string | null;
  updated_at?: string | null;
};

function mapSession(row: SessionRow): AssessmentSession {
  return {
    id: row.id,
    organizationId: row.organization_id,
    sector: normalizeSector(row.sector),
    status: row.status,
    questionCount: row.question_count,
    answeredCount: row.answered_count,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

function hydrateResult(raw: Partial<AssessmentResult> | null): AssessmentResult | null {
  if (!raw || raw.stale) return null;
  if (raw.overallScore === undefined || !raw.riskLevel) return null;
  return {
    schemaVersion: 1,
    modelVersion: (raw.modelVersion as typeof ASSESSMENT_MODEL_VERSION) ?? ASSESSMENT_MODEL_VERSION,
    sector: normalizeSector(raw.sector),
    questionCount: raw.questionCount ?? 81,
    answeredCount: raw.answeredCount ?? 0,
    completedAt: raw.completedAt ?? new Date().toISOString(),
    source: "backend",
    overallScore: raw.overallScore,
    riskLevel: raw.riskLevel,
    evidenceConfidence: raw.evidenceConfidence ?? 0,
    domainScores: raw.domainScores ?? {},
    criticalGaps: raw.criticalGaps ?? [],
    weakEvidence: raw.weakEvidence ?? [],
    recommendations: raw.recommendations ?? [],
    id: raw.id,
    sessionId: raw.sessionId,
    organizationId: raw.organizationId,
    frameworkId: raw.frameworkId,
    responseHash: raw.responseHash,
    stale: raw.stale,
  };
}

export async function getAssessmentSession(
  organizationId: string | undefined,
  sectorInput: string,
): Promise<AssessmentSession | null> {
  if (!organizationId) return null;
  const sector = normalizeSector(sectorInput);
  const row = await fetchJSON<SessionRow>(
    `/api/assessment/session?organizationId=${encodeURIComponent(
      organizationId,
    )}&sector=${encodeURIComponent(sector)}`,
  );
  return row ? mapSession(row) : null;
}

export async function getPersistedAssessmentResponses(
  organizationId: string | undefined,
  sessionId: string | undefined,
): Promise<AssessmentResponse[] | null> {
  if (!organizationId || !sessionId) return null;
  const payload = await fetchJSON<{ responses: AssessmentResponse[] }>(
    `/api/assessment/session/${encodeURIComponent(
      sessionId,
    )}/responses?organizationId=${encodeURIComponent(organizationId)}`,
  );
  return payload?.responses ?? null;
}

export async function savePersistedAssessmentResponse(
  organizationId: string | undefined,
  sessionId: string | undefined,
  response: AssessmentResponse,
): Promise<boolean> {
  if (!organizationId || !sessionId) return false;
  const saved = await fetchJSON(
    `/api/assessment/session/${encodeURIComponent(sessionId)}/responses/${encodeURIComponent(
      response.questionId,
    )}`,
    {
      method: "PUT",
      body: JSON.stringify({ organizationId, response }),
    },
  );
  return !!saved;
}

export async function evaluatePersistedAssessment(
  organizationId: string | undefined,
  sessionId: string | undefined,
  sectorInput: string,
): Promise<AssessmentResult | null> {
  if (!organizationId || !sessionId) return null;
  const sector = normalizeSector(sectorInput);
  const result = await fetchJSON<Partial<AssessmentResult>>(
    "/api/assessment/evaluate",
    {
      method: "POST",
      body: JSON.stringify({
        organizationId,
        sessionId,
        sector,
        final: true,
        responses: [],
      }),
    },
    { throwOnError: true },
  );
  return hydrateResult(result);
}

export async function getLatestPersistedAssessmentResult(
  organizationId: string | undefined,
  sessionId?: string,
): Promise<AssessmentResult | null> {
  if (!organizationId) return null;
  const query = new URLSearchParams({ organizationId });
  if (sessionId) query.set("sessionId", sessionId);
  const payload = await fetchJSON<{ result: Partial<AssessmentResult> | null }>(
    `/api/assessment/results/latest?${query.toString()}`,
  );
  return hydrateResult(payload?.result ?? null);
}
