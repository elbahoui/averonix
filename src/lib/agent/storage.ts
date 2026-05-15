import type { AgentScanResult, AgentRiskInterpretation } from "./types";

const LAST_KEY = "averonix.agent.lastScan";
const HIST_KEY = "averonix.agent.scanHistory";
const MAX_HISTORY = 10;

/** Backfill new summary fields on legacy localStorage results. */
function migrate(r: AgentScanResult): AgentScanResult {
  const s = r.summary as Partial<AgentScanResult["summary"]> & {
    agentScore?: number;
    riskLevel?: string;
  };
  if (s.verifiedSignalScore === undefined) s.verifiedSignalScore = s.agentScore ?? 0;
  if (s.evidenceConfidence === undefined) s.evidenceConfidence = 0;
  if (s.agentReadinessImpact === undefined) {
    s.agentReadinessImpact = Math.round(
      (s.verifiedSignalScore ?? 0) * ((s.evidenceConfidence ?? 0) / 100),
    );
  }
  if (s.riskInterpretation === undefined) {
    s.riskInterpretation =
      (s.evidenceConfidence ?? 0) < 40
        ? "insufficient_evidence"
        : ((s.riskLevel ?? "critical") as AgentRiskInterpretation);
  }
  return r;
}

function safeGet(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveAgentScan(result: AgentScanResult): void {
  const ls = safeGet();
  if (!ls) return;
  try {
    ls.setItem(LAST_KEY, JSON.stringify(result));
    const hist = getAgentScanHistory();
    const next = [result, ...hist.filter((r) => r.id !== result.id)].slice(0, MAX_HISTORY);
    ls.setItem(HIST_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getLastAgentScan(): AgentScanResult | null {
  const ls = safeGet();
  if (!ls) return null;
  try {
    const raw = ls.getItem(LAST_KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw) as AgentScanResult);
  } catch {
    return null;
  }
}

export function getAgentScanHistory(): AgentScanResult[] {
  const ls = safeGet();
  if (!ls) return [];
  try {
    const raw = ls.getItem(HIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AgentScanResult[]).map(migrate) : [];
  } catch {
    return [];
  }
}

export function clearAgentScanHistory(): void {
  const ls = safeGet();
  if (!ls) return;
  try {
    ls.removeItem(LAST_KEY);
    ls.removeItem(HIST_KEY);
  } catch {
    /* ignore */
  }
}
