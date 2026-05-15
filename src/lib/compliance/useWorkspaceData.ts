import { useEffect, useState } from "react";
import { getLatestPersistedAgentScan } from "@/lib/agent/api";
import { getAgentScanHistory, getLastAgentScan, type AgentScanResult } from "@/lib/agent";
import {
  getAssessmentSession,
  getLatestPersistedAssessmentResult,
  getPersistedAssessmentResponses,
  type AssessmentSession,
} from "@/lib/assessment/api";
import {
  getAssessmentProgress,
  getAssessmentResponses,
  getAssessmentResults,
  type AssessmentProgress,
} from "@/lib/assessment/storage";
import type { AssessmentResponse, AssessmentResult } from "@/lib/api";
import {
  canUseDevelopmentFallback,
  DEVELOPMENT_FALLBACK_NOTICE,
  WORKSPACE_UNAVAILABLE_NOTICE,
} from "@/lib/runtime";
import { normalizeSector } from "@/lib/sector";
import type { StoredCompany } from "@/lib/storage";

export type WorkspaceDataSource = "workspace" | "local" | "unavailable" | "empty";

export type ComplianceWorkspaceData = {
  loaded: boolean;
  source: WorkspaceDataSource;
  sourceNotice: string | null;
  agent: AgentScanResult | null;
  agentHistory: AgentScanResult[];
  responses: AssessmentResponse[];
  result: AssessmentResult | null;
  progress: AssessmentProgress | null;
  session: AssessmentSession | null;
};

const INITIAL_DATA: ComplianceWorkspaceData = {
  loaded: false,
  source: "empty",
  sourceNotice: null,
  agent: null,
  agentHistory: [],
  responses: [],
  result: null,
  progress: null,
  session: null,
};

export function useComplianceWorkspaceData(company: Partial<StoredCompany> | null) {
  const [data, setData] = useState<ComplianceWorkspaceData>(INITIAL_DATA);

  useEffect(() => {
    let cancelled = false;

    function loadLocalFallback() {
      return {
        loaded: true,
        source: "local" as const,
        sourceNotice: DEVELOPMENT_FALLBACK_NOTICE,
        agent: getLastAgentScan(),
        agentHistory: getAgentScanHistory(),
        responses: getAssessmentResponses(),
        result: getAssessmentResults(),
        progress: getAssessmentProgress(),
        session: null,
      };
    }

    async function load() {
      setData(INITIAL_DATA);
      const organizationId = company?.organizationId;
      const sector = normalizeSector(company?.sector);

      if (!organizationId) {
        setData(canUseDevelopmentFallback() ? loadLocalFallback() : unavailableData());
        return;
      }

      try {
        const [agent, session] = await Promise.all([
          getLatestPersistedAgentScan(organizationId),
          getAssessmentSession(organizationId, sector),
        ]);
        if (cancelled) return;

        let responses: AssessmentResponse[] = [];
        let result: AssessmentResult | null = null;
        let progress: AssessmentProgress | null = null;

        if (session) {
          const [persistedResponses, persistedResult] = await Promise.all([
            getPersistedAssessmentResponses(organizationId, session.id),
            getLatestPersistedAssessmentResult(organizationId, session.id),
          ]);
          if (cancelled) return;
          responses = persistedResponses ?? [];
          result = persistedResult;
          progress = {
            sector: session.sector,
            activeDomainId: "D1",
            totalQuestions: session.questionCount,
            answered: session.answeredCount,
            updatedAt: session.updatedAt ?? new Date().toISOString(),
          };
        }

        if (!session && !agent && canUseDevelopmentFallback()) {
          setData(loadLocalFallback());
          return;
        }

        setData({
          loaded: true,
          source: session || agent ? "workspace" : "empty",
          sourceNotice: session || agent ? "Saved to workspace" : null,
          agent,
          agentHistory: [],
          responses,
          result,
          progress,
          session,
        });
      } catch {
        if (cancelled) return;
        setData(canUseDevelopmentFallback() ? loadLocalFallback() : unavailableData());
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [company?.organizationId, company?.sector]);

  return data;
}

function unavailableData(): ComplianceWorkspaceData {
  return {
    ...INITIAL_DATA,
    loaded: true,
    source: "unavailable",
    sourceNotice: WORKSPACE_UNAVAILABLE_NOTICE,
  };
}
