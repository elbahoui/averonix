import { fetchJSON } from "@/lib/api";
import type { AgentScanResult } from "@/lib/agent/types";

export async function getLatestPersistedAgentScan(
  organizationId: string | undefined,
): Promise<AgentScanResult | null> {
  if (!organizationId) return null;
  const payload = await fetchJSON<{ scan: AgentScanResult | null }>(
    `/api/agent/scans/latest?organizationId=${encodeURIComponent(organizationId)}`,
  );
  return payload?.scan ?? null;
}
