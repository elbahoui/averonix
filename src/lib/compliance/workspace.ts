import { ALL_DOMAINS } from "@/data/iso27001";
import { groupMappedEvidence } from "@/lib/agent/grouped-evidence";
import type { AgentScanResult } from "@/lib/agent/types";
import {
  localAssessmentQuestions,
  type AssessmentResponse,
  type AssessmentResult,
} from "@/lib/api";
import { normalizeSector, type CompanySector } from "@/lib/sector";

export type ControlStatus =
  | "Not started"
  | "In progress"
  | "Needs evidence reference"
  | "Strong reference"
  | "Not applicable";

export type EvidenceReferenceStatus =
  | "Missing"
  | "Needs reference"
  | "Referenced"
  | "Strong reference"
  | "Agent signal only"
  | "Not applicable";

export type ComplianceControlRow = {
  id: string;
  domainId: string;
  domainName: string;
  controlCode: string;
  question: string;
  category: string;
  owner: string;
  isoReference: string;
  status: ControlStatus;
  maturityLabel: string;
  maturityLevel: number | null;
  evidenceStatus: EvidenceReferenceStatus;
  evidenceConfidence: number;
  expectedEvidence: string[];
  priority: string;
  lastUpdate: string;
};

export type EvidenceReferenceRow = {
  id: string;
  reference: string;
  linkedControl: string;
  framework: string;
  domainId: string;
  owner: string;
  status: EvidenceReferenceStatus;
  confidence: number;
  source: "assessment" | "agent";
};

export type PlannedFramework = {
  id: string;
  name: string;
  status: "Planned";
};

export const TOTAL_ASSESSMENT_QUESTIONS = 81;

export const PLANNED_FRAMEWORKS: PlannedFramework[] = [
  { id: "nist-csf", name: "NIST CSF", status: "Planned" },
  { id: "soc2", name: "SOC 2", status: "Planned" },
  { id: "gdpr", name: "GDPR", status: "Planned" },
  { id: "hipaa", name: "HIPAA", status: "Planned" },
];

const MATURITY_LABELS: Record<number, string> = {
  0: "Not implemented",
  1: "Partially implemented",
  2: "Implemented but not documented",
  3: "Implemented and evidenced",
};

const DOMAIN_CATEGORY: Record<string, string> = {
  D1: "Governance",
  D2: "Governance",
  D3: "Risk",
  D4: "Planning",
  D5: "People",
  D6: "Operations",
  D7: "Organization",
  D8: "Access",
  D9: "Technology",
};

const DOMAIN_REFERENCE: Record<string, string> = {
  D1: "Clause 4 readiness",
  D2: "Clause 5 readiness",
  D3: "Clause 6.1 readiness",
  D4: "Clause 6.2 readiness",
  D5: "Clause 7 readiness",
  D6: "Clause 8 readiness",
  D7: "Annex A organizational readiness",
  D8: "Annex A people and access readiness",
  D9: "Annex A technology readiness",
};

export function buildComplianceControlRows({
  sector,
  responses,
  result,
}: {
  sector: string | undefined;
  responses: AssessmentResponse[];
  result?: AssessmentResult | null;
}): ComplianceControlRow[] {
  const normalizedSector = normalizeSector(sector);
  const questions = localAssessmentQuestions(normalizedSector);
  const responseById = new Map(responses.map((response) => [response.questionId, response]));

  return Object.values(questions.domains).flatMap((domainBundle) =>
    domainBundle.questions.map((question) => {
      const response = responseById.get(question.id);
      const evidenceConfidence = response ? Math.round(response.evidenceConfidence * 100) : 0;
      return {
        id: question.id,
        domainId: question.domainId,
        domainName: domainBundle.domain.shortName ?? domainBundle.domain.name,
        controlCode: question.controlCode ?? question.id,
        question: question.question,
        category: DOMAIN_CATEGORY[question.domainId] ?? "Readiness",
        owner: "Unassigned",
        isoReference: DOMAIN_REFERENCE[question.domainId] ?? "ISO/IEC 27001 readiness",
        status: getControlStatus(response),
        maturityLabel:
          response?.maturityLevel === undefined
            ? "Not started"
            : (MATURITY_LABELS[response.maturityLevel] ?? "Not started"),
        maturityLevel: response?.maturityLevel ?? null,
        evidenceStatus: getEvidenceStatus(response),
        evidenceConfidence,
        expectedEvidence: question.expectedEvidence ?? [],
        priority: question.severity ?? "medium",
        lastUpdate: result?.completedAt ?? "Not evaluated",
      };
    }),
  );
}

export function buildEvidenceReferenceRows({
  controls,
  agent,
}: {
  controls: ComplianceControlRow[];
  agent?: AgentScanResult | null;
}): EvidenceReferenceRow[] {
  const assessmentRows = controls.map((control) => ({
    id: `assessment-${control.id}`,
    reference: control.expectedEvidence[0] ?? `Evidence reference for ${control.controlCode}`,
    linkedControl: control.controlCode,
    framework: "ISO/IEC 27001:2022",
    domainId: control.domainId,
    owner: control.owner,
    status: control.evidenceStatus,
    confidence: control.evidenceConfidence,
    source: "assessment" as const,
  }));

  const agentRows =
    agent && agent.mappedQuestions.length > 0
      ? groupMappedEvidence(agent.mappedQuestions, agent.checks).map((group) => ({
          id: `agent-${group.questionId}`,
          reference: `${group.controlCode ?? group.questionId} external signal`,
          linkedControl: group.controlCode ?? group.questionId,
          framework: "ISO/IEC 27001:2022",
          domainId: group.domainId,
          owner: "Agent Evidence",
          status: "Agent signal only" as const,
          confidence: group.confidence,
          source: "agent" as const,
        }))
      : [];

  return [...agentRows, ...assessmentRows];
}

export function summarizeControls(controls: ComplianceControlRow[]) {
  return {
    total: controls.length,
    answered: controls.filter((control) => control.maturityLevel !== null).length,
    strongReferences: controls.filter((control) => control.evidenceStatus === "Strong reference")
      .length,
    needsReferences: controls.filter(
      (control) =>
        control.evidenceStatus === "Missing" || control.evidenceStatus === "Needs reference",
    ).length,
  };
}

export function domainLabel(domainId: string): string {
  const domain = ALL_DOMAINS.find((item) => item.domain.id === domainId)?.domain;
  return domain?.shortName ?? domain?.name ?? domainId;
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatSector(value?: string | null): CompanySector {
  return normalizeSector(value);
}

function getControlStatus(response?: AssessmentResponse): ControlStatus {
  if (!response) return "Not started";
  if (response.maturityLevel <= 0) return "Not started";
  if (response.evidenceConfidence >= 1 && response.maturityLevel >= 3) return "Strong reference";
  if (response.evidenceConfidence < 0.6) return "Needs evidence reference";
  return "In progress";
}

function getEvidenceStatus(response?: AssessmentResponse): EvidenceReferenceStatus {
  if (!response || response.evidenceConfidence <= 0) return "Missing";
  if (response.evidenceConfidence < 0.6) return "Needs reference";
  if (response.evidenceConfidence < 1) return "Referenced";
  return "Strong reference";
}
