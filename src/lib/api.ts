// Frontend backend client. Falls back gracefully when VITE_API_BASE_URL is missing.
import { ALL_DOMAINS } from "@/data/iso27001";
import type { AgentScanInput, AgentScanResult } from "@/lib/agent/types";
import { normalizeSector, type CompanySector } from "@/lib/sector";
import { supabase } from "@/integrations/supabase/client";
import { isDevTestWorkspaceEnabled } from "@/lib/dev-workspace";

export const ASSESSMENT_MODEL_VERSION = "iso27001-mvp-d1-d9-v1";

export function getApiBase(): string | null {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!raw) return null;
  if (import.meta.env.DEV && /^https?:\/\/(127\.0\.0\.1|localhost):8000\/?$/i.test(raw)) {
    return "";
  }
  return raw.replace(/\/+$/, "");
}

export function isBackendConfigured(): boolean {
  return getApiBase() !== null;
}

type FetchOptions = {
  throwOnError?: boolean;
  auth?: boolean;
};

class ApiHttpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiHttpError";
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  if (isDevTestWorkspaceEnabled()) return {};
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function fetchJSON<T>(
  path: string,
  init?: RequestInit,
  options: FetchOptions = {},
): Promise<T | null> {
  const base = getApiBase();
  if (base === null) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 25000);
    const auth = options.auth === false ? {} : await authHeaders();
    const res = await fetch(`${base}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", ...auth, ...(init?.headers || {}) },
    });
    clearTimeout(t);
    if (!res.ok) {
      if (options.throwOnError) {
        let message = `Request failed with status ${res.status}.`;
        try {
          const payload = await res.json();
          message = payload?.error?.message ?? payload?.detail ?? message;
        } catch {
          // keep generic message
        }
        throw new ApiHttpError(message);
      }
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    if (options.throwOnError && e instanceof ApiHttpError) throw e;
    return null;
  }
}

export async function pingBackend(): Promise<boolean> {
  const r = await fetchJSON<{ status: string }>("/api/health", undefined, { auth: false });
  return r?.status === "ok";
}

export async function runBackendAgentScan(input: AgentScanInput): Promise<AgentScanResult | null> {
  return fetchJSON<AgentScanResult>(
    "/api/agent/scan",
    {
      method: "POST",
      body: JSON.stringify({ ...input, sector: normalizeSector(input.sector) }),
    },
    { throwOnError: true },
  );
}

// ---- Assessment ----
export type AssessmentResponse = {
  questionId: string;
  domainId: string;
  maturityLevel: number;
  evidenceConfidence: number;
  evidenceNote?: string;
};

export type DomainScore = {
  score: number;
  answered: number;
  total: number;
  evidenceConfidence: number;
};

export type AssessmentResultSource = "backend" | "local";

export type AssessmentResultMetadata = {
  schemaVersion: 1;
  modelVersion: typeof ASSESSMENT_MODEL_VERSION;
  sector: CompanySector;
  questionCount: number;
  answeredCount: number;
  completedAt: string;
  source: AssessmentResultSource;
};

export type AssessmentResult = AssessmentResultMetadata & {
  id?: string;
  sessionId?: string;
  organizationId?: string;
  frameworkId?: string;
  responseHash?: string;
  stale?: boolean;
  overallScore: number;
  riskLevel: "critical" | "high" | "medium" | "low" | "minimal";
  evidenceConfidence: number;
  domainScores: Record<string, DomainScore>;
  criticalGaps: Array<{
    questionId: string;
    domainId: string;
    severity: string;
    controlCode?: string;
    question?: string;
  }>;
  weakEvidence: Array<{ questionId: string; evidenceConfidence: number }>;
  recommendations: string[];
};

export type AssessmentQuestion = {
  id: string;
  domainId: string;
  domainName?: string;
  controlCode?: string;
  question: string;
  helpText?: string;
  expectedEvidence?: string[];
  severity?: string;
  weight?: number;
};

export type AssessmentDomainBundle = {
  domain: { id: string; name: string; shortName?: string; description?: string };
  questions: AssessmentQuestion[];
};

export type AssessmentQuestionsResponse = {
  sector: CompanySector;
  domains: Record<string, AssessmentDomainBundle>;
};

function withResultMetadata(
  result: Omit<AssessmentResult, keyof AssessmentResultMetadata>,
  sector: CompanySector,
  questionCount: number,
  answeredCount: number,
  source: AssessmentResultSource,
): AssessmentResult {
  return {
    ...result,
    schemaVersion: 1,
    modelVersion: ASSESSMENT_MODEL_VERSION,
    sector,
    questionCount,
    answeredCount,
    completedAt: new Date().toISOString(),
    source,
  };
}

function selectedQuestions(sectorInput: string): AssessmentQuestion[] {
  return Object.values(localAssessmentQuestions(sectorInput).domains).flatMap((d) => d.questions);
}

function dedupeResponses(responses: AssessmentResponse[]): AssessmentResponse[] {
  const byId = new Map<string, AssessmentResponse>();
  for (const r of responses) byId.set(r.questionId, r);
  return Array.from(byId.values());
}

function appliesToSector(appliesTo: unknown, sector: CompanySector): boolean {
  if (!Array.isArray(appliesTo)) return false;
  return appliesTo.map((s) => normalizeSector(String(s))).includes(sector);
}

function validateCompleteAssessment(
  sectorInput: string,
  responses: AssessmentResponse[],
): {
  sector: CompanySector;
  expected: AssessmentQuestion[];
  deduped: AssessmentResponse[];
} {
  const sector = normalizeSector(sectorInput);
  const expected = selectedQuestions(sector);
  const expectedIds = new Set(expected.map((q) => q.id));
  const deduped = dedupeResponses(responses).filter((r) => expectedIds.has(r.questionId));
  if (deduped.length !== expected.length) {
    throw new Error(`Final evaluation requires ${expected.length} answered questions.`);
  }
  return { sector, expected, deduped };
}

export function localAssessmentQuestions(sectorInput: string): AssessmentQuestionsResponse {
  const sector = normalizeSector(sectorInput);
  const out: Record<string, AssessmentDomainBundle> = {};
  for (const d of ALL_DOMAINS) {
    const core = (d.coreQuestions ?? []) as AssessmentQuestion[];
    const sectorQs = (
      (d.sectorQuestions ?? []) as Array<AssessmentQuestion & { appliesTo?: string[] }>
    )
      .filter((q) => appliesToSector(q.appliesTo, sector))
      .slice(0, 3);
    out[d.domain.id] = {
      domain: d.domain,
      questions: [...core, ...sectorQs],
    };
  }
  return { sector, domains: out };
}

export async function getAssessmentQuestions(
  sectorInput: string,
): Promise<AssessmentQuestionsResponse> {
  const sector = normalizeSector(sectorInput);
  const r = await fetchJSON<AssessmentQuestionsResponse>(
    `/api/assessment/questions?sector=${encodeURIComponent(sector)}`,
    undefined,
    { auth: false },
  );
  return r ?? localAssessmentQuestions(sector);
}

function riskFromScore(score: number): AssessmentResult["riskLevel"] {
  if (score < 40) return "critical";
  if (score < 60) return "high";
  if (score < 75) return "medium";
  if (score < 90) return "low";
  return "minimal";
}

export function localEvaluateAssessment(
  sectorInput: string,
  responses: AssessmentResponse[],
): AssessmentResult {
  const { sector, expected, deduped } = validateCompleteAssessment(sectorInput, responses);
  const expectedTotals: Record<string, number> = {};
  for (const [d, v] of Object.entries(localAssessmentQuestions(sector).domains)) {
    expectedTotals[d] = v.questions.length;
  }
  const byDomain = new Map<string, { score: number; weight: number; confidence: number }[]>();
  const criticalGaps: AssessmentResult["criticalGaps"] = [];
  const weakEvidence: AssessmentResult["weakEvidence"] = [];

  for (const r of deduped) {
    const q = expected.find((qq) => qq.id === r.questionId);
    if (!q) continue;
    const severity = (q.severity ?? "medium").toLowerCase();
    const weight = q.weight ?? 1.0;
    const controlScore = (r.maturityLevel / 3) * 100 * r.evidenceConfidence;
    if (!byDomain.has(r.domainId)) byDomain.set(r.domainId, []);
    byDomain.get(r.domainId)!.push({
      score: controlScore,
      weight,
      confidence: r.evidenceConfidence * 100,
    });
    if (
      (severity === "critical" || severity === "high") &&
      (r.maturityLevel === 0 || r.evidenceConfidence <= 0.3)
    ) {
      criticalGaps.push({
        questionId: r.questionId,
        domainId: r.domainId,
        severity,
        controlCode: q.controlCode,
        question: q.question,
      });
    }
    if (r.evidenceConfidence <= 0.3) {
      weakEvidence.push({ questionId: r.questionId, evidenceConfidence: r.evidenceConfidence });
    }
  }

  const domainScores: Record<string, DomainScore> = {};
  let overallAcc = 0;
  let overallW = 0;
  let confAcc = 0;
  let confN = 0;
  for (const [did, items] of byDomain.entries()) {
    const w = items.reduce((a, i) => a + i.weight, 0) || 1;
    const s = items.reduce((a, i) => a + i.score * i.weight, 0) / w;
    const c = items.reduce((a, i) => a + i.confidence, 0) / items.length;
    domainScores[did] = {
      score: Math.round(s),
      answered: items.length,
      total: expectedTotals[did] ?? items.length,
      evidenceConfidence: Math.round(c),
    };
    overallAcc += s * w;
    overallW += w;
    confAcc += c * items.length;
    confN += items.length;
  }
  const overall = overallW ? Math.round(overallAcc / overallW) : 0;
  const avgConf = confN ? Math.round(confAcc / confN) : 0;
  const recs: string[] = [];
  if (criticalGaps.length) recs.push(`Address ${criticalGaps.length} critical/high gap(s) first.`);
  if (avgConf < 60) recs.push("Track stronger evidence references to raise confidence above 60%.");
  if (overall < 60) recs.push("Focus on ISMS scope, risk treatment, and documentation maturity.");

  return withResultMetadata(
    {
      overallScore: overall,
      riskLevel: riskFromScore(overall),
      evidenceConfidence: avgConf,
      domainScores,
      criticalGaps,
      weakEvidence,
      recommendations: recs,
    },
    sector,
    expected.length,
    deduped.length,
    "local",
  );
}

export async function evaluateAssessment(
  sectorInput: string,
  responses: AssessmentResponse[],
): Promise<AssessmentResult> {
  const { sector, expected, deduped } = validateCompleteAssessment(sectorInput, responses);
  const r = await fetchJSON<Omit<AssessmentResult, keyof AssessmentResultMetadata>>(
    "/api/assessment/evaluate",
    {
      method: "POST",
      body: JSON.stringify({ sector, final: true, responses: deduped }),
    },
    { throwOnError: true },
  );
  if (r) {
    return withResultMetadata(r, sector, expected.length, deduped.length, "backend");
  }
  return localEvaluateAssessment(sector, deduped);
}
