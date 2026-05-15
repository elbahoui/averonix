import { ALL_CHECKS } from "./agent-checks";
import { toDomainCoverage, toFindings, toMappedQuestions } from "./evidence";
import { normalizeDomain } from "./normalize-domain";
import {
  AUTOMATED_QUESTIONS_TARGET,
  agentReadinessImpact,
  buildCoverageSummary,
  calculateEvidenceConfidence,
  calculateVerifiedSignalScore,
  riskInterpretation,
  riskInterpretationToLevel,
} from "./scoring";
import { saveAgentScan } from "./storage";
import { runBackendAgentScan, isBackendConfigured } from "@/lib/api";
import { isStrictProductionRuntime } from "@/lib/runtime";
import type {
  AgentCheckResult,
  AgentProgressStatus,
  AgentProgressStep,
  AgentScanInput,
  AgentScanResult,
} from "./types";

export const LIMITATIONS: string[] = [
  "Agent Evidence is partial and externally observable only.",
  "Agent cannot verify leadership commitment.",
  "Agent cannot verify ISMS scope.",
  "Agent cannot verify risk treatment decisions.",
  "Agent cannot verify internal documentation.",
  "Agent cannot verify training or awareness.",
  "Agent cannot verify management review.",
  "Full readiness requires guided assessment and future integrations.",
];

export type AgentProgressCallback = (step: AgentProgressStep, status: AgentProgressStatus) => void;

function newId(): string {
  return `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function runAgentScan(
  input: AgentScanInput,
  onProgress?: AgentProgressCallback,
): Promise<AgentScanResult> {
  const createdAt = new Date().toISOString();
  const requiresWorkspaceBackend = isStrictProductionRuntime() && !!input.organizationId;

  // 1. Validate domain client-side regardless of backend.
  let domain = "";
  onProgress?.("normalize", "running");
  try {
    domain = normalizeDomain(input.domain).domain;
    onProgress?.("normalize", "done");
  } catch (e) {
    onProgress?.("normalize", "failed");
    const message = e instanceof Error ? e.message : "Invalid domain.";
    return assemble({
      input,
      domain: input.domain,
      createdAt,
      checks: [
        {
          id: "normalize",
          name: "Domain normalization",
          status: "failed",
          score: 0,
          confidence: 0,
          severity: "high",
          description: "Domain validation failed.",
          evidence: message,
          recommendation: "Enter a valid public domain (e.g. example.com).",
          mappedDomains: [],
          mappedQuestionIds: [],
        },
      ],
    });
  }

  // 2. Backend agent (preferred — real DNS/TLS/SPF/DMARC/headers).
  if (isBackendConfigured()) {
    onProgress?.("https", "running");
    onProgress?.("headers", "running");
    onProgress?.("dns", "running");
    let r: AgentScanResult | null = null;
    try {
      r = await runBackendAgentScan({
        domain,
        companyName: input.companyName,
        sector: input.sector,
        organizationId: input.organizationId,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Backend Agent validation failed.";
      onProgress?.("https", "failed");
      onProgress?.("headers", "failed");
      onProgress?.("dns", "failed");
      return assemble({
        input,
        domain,
        createdAt,
        checks: [
          {
            id: "backend_validation",
            name: "Backend scan validation",
            status: "failed",
            score: 0,
            confidence: 0,
            severity: "high",
            description: "The backend rejected this scan target or request.",
            evidence: message,
            recommendation: "Enter a valid public domain and retry.",
            mappedDomains: [],
            mappedQuestionIds: [],
          },
        ],
      });
    }
    onProgress?.("https", "done");
    onProgress?.("headers", "done");
    onProgress?.("dns", "done");
    onProgress?.("map", "done");
    onProgress?.("findings", "done");
    if (r) {
      // Backfill legacy fields for components/storage.
      r.summary.agentScore = r.summary.verifiedSignalScore;
      r.summary.riskLevel = riskInterpretationToLevel(r.summary.riskInterpretation);
      try {
        saveAgentScan(r);
      } catch {
        /* ignore */
      }
      return r;
    }
    if (requiresWorkspaceBackend) {
      onProgress?.("https", "failed");
      onProgress?.("headers", "failed");
      onProgress?.("dns", "failed");
      return assemble({
        input,
        domain,
        createdAt,
        checks: [
          {
            id: "backend_validation",
            name: "Backend scan validation",
            status: "failed",
            score: 0,
            confidence: 0,
            severity: "high",
            description: "The backend scan could not be completed.",
            evidence: "Persisted backend scan is required in production.",
            recommendation: "Retry when the backend workspace service is available.",
            mappedDomains: [],
            mappedQuestionIds: [],
          },
        ],
      });
    }
  } else if (requiresWorkspaceBackend) {
    onProgress?.("https", "failed");
    onProgress?.("headers", "failed");
    onProgress?.("dns", "failed");
    return assemble({
      input,
      domain,
      createdAt,
      checks: [
        {
          id: "backend_validation",
          name: "Backend scan validation",
          status: "failed",
          score: 0,
          confidence: 0,
          severity: "high",
          description: "Backend Agent is required for workspace scans in production.",
          evidence: "Backend API URL is not configured.",
          recommendation: "Configure the production backend before running Agent scans.",
          mappedDomains: [],
          mappedQuestionIds: [],
        },
      ],
    });
  }

  // 3. Fallback: limited frontend checks. Many checks return not_checked.
  const checks: AgentCheckResult[] = [];

  onProgress?.("https", "running");
  for (const fn of ALL_CHECKS.slice(0, 3)) {
    try {
      checks.push(await fn(domain));
    } catch {
      /* ignore */
    }
  }
  onProgress?.("https", "done");

  onProgress?.("headers", "running");
  for (const fn of ALL_CHECKS.slice(3, 11)) {
    try {
      checks.push(await fn(domain));
    } catch {
      /* ignore */
    }
  }
  onProgress?.("headers", "done");

  onProgress?.("dns", "running");
  for (const fn of ALL_CHECKS.slice(11)) {
    try {
      checks.push(await fn(domain));
    } catch {
      /* ignore */
    }
  }
  onProgress?.("dns", "done");

  onProgress?.("map", "done");
  onProgress?.("findings", "running");
  const result = assemble({ input, domain, checks, createdAt });
  onProgress?.("findings", "done");

  try {
    saveAgentScan(result);
  } catch {
    /* ignore */
  }
  return result;
}

function assemble(args: {
  input: AgentScanInput;
  domain: string;
  checks: AgentCheckResult[];
  createdAt: string;
}): AgentScanResult {
  const { input, domain, checks, createdAt } = args;
  const verifiedSignalScore = calculateVerifiedSignalScore(checks);
  const confidence = calculateEvidenceConfidence(checks);
  const impact = agentReadinessImpact(verifiedSignalScore, confidence);
  const interp = riskInterpretation(confidence, impact);
  const coverage = buildCoverageSummary(checks);
  const findings = toFindings(checks);
  const mappedQuestions = toMappedQuestions(checks);
  const domainCoverage = toDomainCoverage(checks);

  const passedChecks = checks.filter((c) => c.status === "passed").length;
  const warningChecks = checks.filter((c) => c.status === "warning").length;
  const failedChecks = checks.filter((c) => c.status === "failed").length;
  const notChecked = checks.filter((c) => c.status === "not_checked").length;
  const criticalFindings = findings.filter(
    (f) => f.severity === "critical" || f.severity === "high",
  ).length;

  return {
    id: newId(),
    createdAt,
    target: {
      domain,
      companyName: input.companyName,
      sector: input.sector,
      organizationId: input.organizationId,
    },
    summary: {
      verifiedSignalScore,
      evidenceConfidence: confidence,
      agentReadinessImpact: impact,
      riskInterpretation: interp,
      agentScore: verifiedSignalScore,
      riskLevel: riskInterpretationToLevel(interp),
      automatedQuestions: AUTOMATED_QUESTIONS_TARGET,
      totalModelQuestions: coverage.totalModelQuestions,
      coveragePercent: coverage.coveragePercent,
      passedChecks,
      warningChecks,
      failedChecks,
      notChecked,
      criticalFindings,
    },
    checks,
    findings,
    mappedQuestions,
    domainCoverage,
    limitations: LIMITATIONS,
  };
}
