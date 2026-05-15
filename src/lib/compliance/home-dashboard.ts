import type { AgentScanResult } from "@/lib/agent/types";
import type { AssessmentProgress } from "@/lib/assessment/storage";
import type { AssessmentResult } from "@/lib/api";
import type { WorkspaceDataSource } from "@/lib/compliance/useWorkspaceData";
import { TOTAL_ASSESSMENT_QUESTIONS, type ComplianceControlRow } from "@/lib/compliance/workspace";

export const HOME_FRAMEWORK_FILTERS = [
  "All",
  "Active",
  "Planned",
  "ISO/IEC 27001",
  "Evidence",
] as const;

export const HOME_PRIORITY_FILTERS = ["All", "High", "Medium", "Low"] as const;

export type HomeFrameworkFilter = (typeof HOME_FRAMEWORK_FILTERS)[number];
export type HomePriorityFilter = (typeof HOME_PRIORITY_FILTERS)[number];

export type HomeProgressCard = {
  id: "iso27001" | "agent" | "evidence" | "report" | "nist-csf" | "soc2";
  title: string;
  badge: string;
  value: string;
  progress: number | null;
  leftFooter: string;
  rightFooter: string;
  to?: "/frameworks/iso27001" | "/scan" | "/evidence-references" | "/report";
  disabled: boolean;
  group: "active" | "planned" | "evidence" | "iso";
};

export type HomePriorityAction = {
  id: string;
  title: string;
  detail: string;
  priority: "High" | "Medium" | "Low";
  section: "overdue" | "due-soon";
  to: "/assessment" | "/scan" | "/evidence-references" | "/report";
};

export function buildHomeProgressCards({
  controls,
  result,
  progress,
  agent,
}: {
  controls: ComplianceControlRow[];
  result: AssessmentResult | null;
  progress: AssessmentProgress | null;
  agent: AgentScanResult | null;
}): HomeProgressCard[] {
  const strongReferences = controls.filter(
    (control) => control.evidenceStatus === "Strong reference",
  ).length;
  const answeredFromControls = controls.filter((control) => control.maturityLevel !== null).length;
  const validResult = result && !result.stale ? result : null;
  const totalQuestions =
    validResult?.questionCount ?? progress?.totalQuestions ?? TOTAL_ASSESSMENT_QUESTIONS;
  const answeredQuestions =
    validResult?.answeredCount ?? progress?.answered ?? answeredFromControls;
  const assessmentProgress = percent(answeredQuestions, totalQuestions);
  const agentTotal = agent ? totalAgentChecks(agent) : 0;
  const agentChecked = agent ? agentTotal - agent.summary.notChecked : 0;
  const agentProgress = percent(agentChecked, agentTotal);
  const referenceProgress = percent(strongReferences, controls.length);

  return [
    {
      id: "iso27001",
      title: "ISO/IEC 27001:2022",
      badge: "Active",
      value: validResult
        ? `${validResult.overallScore}%`
        : answeredQuestions
          ? `${assessmentProgress}%`
          : "Not evaluated",
      progress: assessmentProgress,
      leftFooter: `${answeredQuestions} questions answered`,
      rightFooter: `${totalQuestions} total`,
      to: "/frameworks/iso27001",
      disabled: false,
      group: "iso",
    },
    {
      id: "agent",
      title: "Agent Evidence",
      badge: "External signals only",
      value: agent ? `${agent.summary.verifiedSignalScore}/100` : "No scan yet",
      progress: agent ? agentProgress : 0,
      leftFooter: agent
        ? `${agent.summary.passedChecks} external signal${agent.summary.passedChecks === 1 ? "" : "s"} passed`
        : "Run Agent Evidence scan",
      rightFooter: agent ? `${agentTotal} total` : "External signals only",
      to: "/scan",
      disabled: false,
      group: "evidence",
    },
    {
      id: "evidence",
      title: "Evidence References",
      badge: "Reference tracking",
      value: `${referenceProgress}%`,
      progress: referenceProgress,
      leftFooter: `${strongReferences} strong reference${strongReferences === 1 ? "" : "s"}`,
      rightFooter: `${controls.length} total`,
      to: "/evidence-references",
      disabled: false,
      group: "evidence",
    },
    {
      id: "report",
      title: "Readiness Report",
      badge: reportBadge(result, answeredQuestions),
      value: reportValue(result, answeredQuestions),
      progress: validResult ? 100 : answeredQuestions ? assessmentProgress : 0,
      leftFooter: result?.stale
        ? "Refresh assessment"
        : validResult
          ? "Open readiness preview"
          : "Complete assessment",
      rightFooter: "Preview only",
      to: "/report",
      disabled: false,
      group: "active",
    },
    {
      id: "nist-csf",
      title: "NIST CSF",
      badge: "Planned",
      value: "Planned",
      progress: null,
      leftFooter: "Future framework",
      rightFooter: "Not active",
      disabled: true,
      group: "planned",
    },
    {
      id: "soc2",
      title: "SOC 2",
      badge: "Planned",
      value: "Planned",
      progress: null,
      leftFooter: "Future framework",
      rightFooter: "Not active",
      disabled: true,
      group: "planned",
    },
  ];
}

export function filterHomeProgressCards(cards: HomeProgressCard[], filter: HomeFrameworkFilter) {
  if (filter === "All") return cards;
  if (filter === "Active") return cards.filter((card) => card.group !== "planned");
  if (filter === "Planned") return cards.filter((card) => card.group === "planned");
  if (filter === "ISO/IEC 27001") return cards.filter((card) => card.group === "iso");
  return cards.filter((card) => card.group === "evidence");
}

export function buildHomePriorityActions({
  answeredQuestions,
  totalQuestions,
  result,
  agent,
  weakReferences,
  source,
}: {
  answeredQuestions: number;
  totalQuestions: number;
  result: AssessmentResult | null;
  agent: AgentScanResult | null;
  weakReferences: number;
  source: WorkspaceDataSource;
}): HomePriorityAction[] {
  const actions: HomePriorityAction[] = [];
  const remaining = Math.max(totalQuestions - answeredQuestions, 0);

  if (remaining > 0) {
    actions.push({
      id: "complete-assessment",
      title: "Complete remaining assessment questions",
      detail: `${remaining} questions remain before readiness can be calculated.`,
      priority: "High",
      section: "overdue",
      to: "/assessment",
    });
  }
  if (result?.stale) {
    actions.push({
      id: "re-evaluate",
      title: "Re-evaluate assessment",
      detail: "Refresh the readiness preview after response changes.",
      priority: "High",
      section: "overdue",
      to: "/assessment",
    });
  }
  if ((agent?.summary.criticalFindings ?? 0) > 0) {
    actions.push({
      id: "review-agent-findings",
      title: "Review Agent findings",
      detail: `${agent?.summary.criticalFindings ?? 0} external technical finding${
        agent?.summary.criticalFindings === 1 ? "" : "s"
      } need review.`,
      priority: "Medium",
      section: "overdue",
      to: "/scan",
    });
  }
  if (weakReferences > 0) {
    actions.push({
      id: "track-references",
      title: "Track stronger evidence references",
      detail: `${weakReferences} readiness questions need stronger evidence references.`,
      priority: "Medium",
      section: "overdue",
      to: "/evidence-references",
    });
  }

  actions.push({
    id: agent ? "rerun-agent" : "run-agent",
    title: agent ? "Re-run Agent Evidence scan" : "Run Agent Evidence scan",
    detail: "Refresh external technical signals for the current workspace domain.",
    priority: "Low",
    section: "due-soon",
    to: "/scan",
  });

  actions.push({
    id: result && !result.stale ? "review-preview" : "prepare-preview",
    title: result && !result.stale ? "Review readiness preview" : "Prepare readiness preview",
    detail:
      result && !result.stale
        ? "Use the readiness preview to plan next steps."
        : "Complete Manual Assessment before using the readiness preview.",
    priority: "Low",
    section: "due-soon",
    to: result && !result.stale ? "/report" : "/assessment",
  });

  if (source === "local") {
    actions.push({
      id: "development-fallback",
      title: "Review workspace persistence",
      detail: "Development fallback is showing locally saved data only.",
      priority: "Low",
      section: "due-soon",
      to: "/assessment",
    });
  }

  return actions;
}

export function filterHomePriorityActions(
  actions: HomePriorityAction[],
  filter: HomePriorityFilter,
) {
  if (filter === "All") return actions;
  return actions.filter((action) => action.priority === filter);
}

export function deriveHomeAssessmentCounts({
  controls,
  result,
  progress,
}: {
  controls: ComplianceControlRow[];
  result: AssessmentResult | null;
  progress: AssessmentProgress | null;
}) {
  const validResult = result && !result.stale ? result : null;
  const answeredFromControls = controls.filter((control) => control.maturityLevel !== null).length;
  const totalQuestions =
    validResult?.questionCount ?? progress?.totalQuestions ?? TOTAL_ASSESSMENT_QUESTIONS;
  const answeredQuestions =
    validResult?.answeredCount ?? progress?.answered ?? answeredFromControls;
  return { answeredQuestions, totalQuestions };
}

function reportBadge(result: AssessmentResult | null, answeredQuestions: number): string {
  if (result?.stale) return "Re-evaluation required";
  if (result) return "Readiness preview";
  if (answeredQuestions > 0) return "Draft";
  return "Draft";
}

function reportValue(result: AssessmentResult | null, answeredQuestions: number): string {
  if (result?.stale) return "Re-evaluate";
  if (result) return "Preview available";
  if (answeredQuestions > 0) return "Draft";
  return "Draft";
}

function totalAgentChecks(agent: AgentScanResult): number {
  return (
    agent.summary.passedChecks +
    agent.summary.warningChecks +
    agent.summary.failedChecks +
    agent.summary.notChecked
  );
}

function percent(value: number, total: number): number {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}
