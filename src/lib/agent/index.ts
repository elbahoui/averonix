export * from "./types";
export { normalizeDomain } from "./normalize-domain";
export { runAgentScan, LIMITATIONS } from "./agent-engine";
export type { AgentProgressCallback } from "./agent-engine";
export {
  saveAgentScan,
  getLastAgentScan,
  getAgentScanHistory,
  clearAgentScanHistory,
} from "./storage";
export { AGENT_CHECK_MAPPINGS, getMapping } from "./agent-mapping";
export { groupMappedEvidence } from "./grouped-evidence";
export type { GroupedAgentEvidence } from "./grouped-evidence";
export {
  calculateAgentScore,
  calculateEvidenceConfidence,
  riskLevelFromScore,
  buildCoverageSummary,
  AUTOMATED_QUESTIONS_TARGET,
} from "./scoring";
