import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardShell, useDashboard } from "@/components/layout/DashboardShell";
import {
  evaluateAssessment,
  getAssessmentQuestions,
  type AssessmentDomainBundle,
  type AssessmentQuestion,
  type AssessmentQuestionsResponse,
  type AssessmentResponse,
} from "@/lib/api";
import {
  clearAssessmentResults,
  getAssessmentProgress,
  getAssessmentResponses,
  saveAssessmentProgress,
  saveAssessmentResponse,
  saveAssessmentResults,
} from "@/lib/assessment/storage";
import {
  evaluatePersistedAssessment,
  getAssessmentSession,
  getPersistedAssessmentResponses,
  savePersistedAssessmentResponse,
  type AssessmentSession,
} from "@/lib/assessment/api";
import {
  assessmentBackendStatusLabel,
  getBackendStatus,
  initialBackendStatus,
  type BackendConnectionStatus,
} from "@/lib/backend-status";
import { canUseDevelopmentFallback, canUseLocalFinalResultFallback } from "@/lib/runtime";
import { normalizeSector } from "@/lib/sector";

export const Route = createFileRoute("/assessment")({
  head: () => ({
    meta: [
      { title: "Manual Assessment - Averonix" },
      {
        name: "description",
        content:
          "Manual ISO/IEC 27001 readiness assessment across the nine Averonix domains (D1-D9).",
      },
    ],
  }),
  component: () => (
    <DashboardShell>
      <AssessmentPage />
    </DashboardShell>
  ),
});

const MATURITY = [
  { v: 0, label: "Not implemented" },
  { v: 1, label: "Partially implemented" },
  { v: 2, label: "Implemented but not documented" },
  { v: 3, label: "Implemented and evidenced" },
] as const;

const CONFIDENCE = [
  { v: 0.0, label: "No evidence" },
  { v: 0.3, label: "Weak evidence" },
  { v: 0.6, label: "Partial evidence" },
  { v: 1.0, label: "Strong evidence" },
] as const;

const SEV_PILL: Record<string, string> = {
  critical: "bg-[#FEF2F2] text-[#B91C1C] border-[#FCA5A5]",
  high: "bg-[#FFF7ED] text-[#C2410C] border-[#FDBA74]",
  medium: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
  low: "bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]",
};

const STATUS_PILL: Record<string, string> = {
  "Not started": "bg-[#F3F4F6] text-[#6B7280]",
  Answered: "bg-[#F0FDF4] text-[#15803D]",
  "Needs evidence": "bg-[#FFFBEB] text-[#B45309]",
  "Critical unanswered": "bg-[#FEF2F2] text-[#B91C1C]",
  "Strong evidence": "bg-[#EFF6FF] text-[#1D4ED8]",
};

const ROWS_PER_PAGE = 15;

function getShortTitle(q: AssessmentQuestion): string {
  const t = q.question;
  if (t.length <= 65) return t;
  const cut = t.slice(0, 62).replace(/\s+\S*$/, "");
  return cut + "...";
}

function getQuestionStatus(q: AssessmentQuestion, r: AssessmentResponse | undefined): string {
  if (!r) {
    const sev = (q.severity ?? "medium").toLowerCase();
    return sev === "critical" || sev === "high" ? "Critical unanswered" : "Not started";
  }
  if (r.evidenceConfidence >= 1.0 && r.maturityLevel >= 2) return "Strong evidence";
  if (r.evidenceConfidence <= 0.3 && r.maturityLevel > 0) return "Needs evidence";
  return "Answered";
}

function getEvidencePct(r: AssessmentResponse | undefined): string {
  if (!r) return "-";
  return `${Math.round(r.evidenceConfidence * 100)}%`;
}

function getMaturityLabel(r: AssessmentResponse | undefined): string {
  if (!r) return "-";
  const m = MATURITY.find((x) => x.v === r.maturityLevel);
  return m ? `L${m.v}` : "-";
}

function AssessmentPage() {
  const { company } = useDashboard();
  const navigate = useNavigate();
  const sector = normalizeSector(company?.sector);

  // â”€â”€ Existing state (preserved) â”€â”€
  const [bundle, setBundle] = useState<AssessmentQuestionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, AssessmentResponse>>({});
  const [activeDomain, setActiveDomain] = useState<string>("D1");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveMode, setSaveMode] = useState<"workspace" | "local" | "unavailable">("local");
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendConnectionStatus>(initialBackendStatus);

  // â”€â”€ New UI state â”€â”€
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [evidenceFilter, setEvidenceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // â”€â”€ Initial load (preserved verbatim) â”€â”€
  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setLoadError(null);
    getAssessmentQuestions(sector)
      .then(async (data) => {
        if (cancel) return;
        setBundle(data);
        const firstDomain = Object.keys(data.domains)[0] ?? "D1";
        const progress = getAssessmentProgress();
        setActiveDomain(progress?.activeDomainId ?? firstDomain);
        const persistedSession = await getAssessmentSession(company?.organizationId, sector);
        if (cancel) return;
        setSession(persistedSession);
        const persistedResponses = persistedSession
          ? await getPersistedAssessmentResponses(
              persistedSession.organizationId,
              persistedSession.id,
            )
          : null;
        if (cancel) return;
        let stored: AssessmentResponse[] = [];
        if (persistedSession) {
          stored = persistedResponses ?? [];
          setSaveMode("workspace");
        } else if (canUseDevelopmentFallback()) {
          stored = getAssessmentResponses();
          setSaveMode("local");
        } else if (company?.organizationId) {
          setSaveMode("unavailable");
          setLoadError("Workspace assessment session is unavailable. Please try again later.");
          return;
        }
        const map: Record<string, AssessmentResponse> = {};
        for (const r of stored) map[r.questionId] = r;
        setResponses(map);
      })
      .catch((e) => {
        if (cancel) return;
        setLoadError(e?.message || "Failed to load questions.");
      })
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [sector, company?.organizationId]);

  useEffect(() => {
    let cancel = false;
    getBackendStatus().then((status) => {
      if (!cancel) setBackendStatus(status.status);
    });
    return () => {
      cancel = true;
    };
  }, []);

  // â”€â”€ Derived data (preserved) â”€â”€
  const allQuestions = useMemo<AssessmentQuestion[]>(() => {
    if (!bundle) return [];
    return Object.values(bundle.domains).flatMap((d) => d.questions);
  }, [bundle]);
  const totalQuestions = allQuestions.length;
  const answeredCount = useMemo(
    () => allQuestions.filter((q) => responses[q.id]).length,
    [allQuestions, responses],
  );
  const isComplete = totalQuestions > 0 && answeredCount === totalQuestions;
  const overallPct = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // â”€â”€ Progress save (preserved verbatim) â”€â”€
  const progressSaveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!bundle) return;
    if (progressSaveTimer.current) window.clearTimeout(progressSaveTimer.current);
    progressSaveTimer.current = window.setTimeout(() => {
      saveAssessmentProgress({
        sector,
        activeDomainId: activeDomain,
        totalQuestions,
        answered: answeredCount,
        updatedAt: new Date().toISOString(),
      });
    }, 200);
  }, [bundle, sector, activeDomain, totalQuestions, answeredCount]);

  // â”€â”€ updateResponse (preserved verbatim) â”€â”€
  function updateResponse(q: AssessmentQuestion, patch: Partial<AssessmentResponse>) {
    setResponses((prev) => {
      const existing = prev[q.id] ?? {
        questionId: q.id,
        domainId: q.domainId,
        maturityLevel: 0,
        evidenceConfidence: 0,
        evidenceNote: "",
      };
      const next: AssessmentResponse = { ...existing, ...patch };
      saveAssessmentResponse(next);
      clearAssessmentResults();
      setSavedAt(Date.now());
      if (company?.organizationId && session?.id) {
        savePersistedAssessmentResponse(company.organizationId, session.id, next)
          .then((ok) => setSaveMode(ok ? "workspace" : "unavailable"))
          .catch(() => setSaveMode("unavailable"));
      } else {
        setSaveMode("local");
      }
      return { ...prev, [q.id]: next };
    });
  }

  // â”€â”€ handleSubmit (preserved verbatim) â”€â”€
  async function handleSubmit() {
    if (!isComplete) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (company?.organizationId && session?.id) {
        const saveResults = await Promise.all(
          Object.values(responses).map((response) =>
            savePersistedAssessmentResponse(company.organizationId, session.id, response),
          ),
        );
        if (saveResults.some((saved) => !saved) && !canUseLocalFinalResultFallback()) {
          throw new Error("Workspace save failed. Please try again later.");
        }
      }
      const persisted = await evaluatePersistedAssessment(
        company?.organizationId,
        session?.id,
        sector,
      );
      if (persisted) {
        saveAssessmentResults(persisted);
        navigate({ to: "/dashboard" });
        return;
      }
      if (company?.organizationId && !canUseLocalFinalResultFallback()) {
        throw new Error("Workspace evaluation failed. Please try again later.");
      }
      const result = await evaluateAssessment(sector, Object.values(responses));
      saveAssessmentResults(result);
      navigate({ to: "/dashboard" });
    } catch (e) {
      setSubmitError((e as Error)?.message || "Evaluation failed.");
    } finally {
      setSubmitting(false);
    }
  }

  // â”€â”€ Filtered + paginated questions â”€â”€
  const domainQuestions = useMemo(() => {
    if (!bundle) return [];
    return bundle.domains[activeDomain]?.questions ?? [];
  }, [bundle, activeDomain]);

  const filteredQuestions = useMemo(() => {
    let qs = domainQuestions;
    if (searchQuery.trim()) {
      const lc = searchQuery.toLowerCase();
      qs = qs.filter(
        (q) =>
          q.question.toLowerCase().includes(lc) ||
          (q.controlCode ?? "").toLowerCase().includes(lc) ||
          q.domainId.toLowerCase().includes(lc),
      );
    }
    if (statusFilter !== "all") {
      qs = qs.filter((q) => getQuestionStatus(q, responses[q.id]) === statusFilter);
    }
    if (priorityFilter !== "all") {
      qs = qs.filter((q) => (q.severity ?? "medium").toLowerCase() === priorityFilter);
    }
    if (evidenceFilter !== "all") {
      const ev = parseFloat(evidenceFilter);
      qs = qs.filter((q) => {
        const r = responses[q.id];
        if (!r) return ev === 0;
        return r.evidenceConfidence === ev;
      });
    }
    return qs;
  }, [domainQuestions, searchQuery, statusFilter, priorityFilter, evidenceFilter, responses]);

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedQuestions = filteredQuestions.slice(
    (safePage - 1) * ROWS_PER_PAGE,
    safePage * ROWS_PER_PAGE,
  );

  const selectedQuestion = useMemo(
    () => allQuestions.find((q) => q.id === selectedQuestionId) ?? null,
    [allQuestions, selectedQuestionId],
  );

  // Auto-select first question when domain changes
  useEffect(() => {
    if (domainQuestions.length > 0 && !domainQuestions.find((q) => q.id === selectedQuestionId)) {
      setSelectedQuestionId(domainQuestions[0].id);
    }
  }, [domainQuestions, selectedQuestionId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, priorityFilter, evidenceFilter, activeDomain]);

  // â”€â”€ Navigation helpers â”€â”€
  const navigateToQuestion = useCallback(
    (qId: string) => {
      const q = allQuestions.find((x) => x.id === qId);
      if (!q) return;
      if (q.domainId !== activeDomain) setActiveDomain(q.domainId);
      setSelectedQuestionId(qId);
      // Calculate page for the question within its domain
      if (bundle) {
        const domQs = bundle.domains[q.domainId]?.questions ?? [];
        const idx = domQs.findIndex((x) => x.id === qId);
        if (idx >= 0) setCurrentPage(Math.floor(idx / ROWS_PER_PAGE) + 1);
      }
    },
    [allQuestions, activeDomain, bundle],
  );

  const findUnanswered = useCallback(
    (direction: 1 | -1) => {
      if (!allQuestions.length) return null;
      const curIdx = selectedQuestionId
        ? allQuestions.findIndex((q) => q.id === selectedQuestionId)
        : -1;
      const len = allQuestions.length;
      for (let i = 1; i <= len; i++) {
        const idx = (curIdx + i * direction + len) % len;
        if (!responses[allQuestions[idx].id]) return allQuestions[idx].id;
      }
      return null;
    },
    [allQuestions, selectedQuestionId, responses],
  );

  const goNextUnanswered = useCallback(() => {
    const id = findUnanswered(1);
    if (id) navigateToQuestion(id);
  }, [findUnanswered, navigateToQuestion]);

  const goPrevUnanswered = useCallback(() => {
    const id = findUnanswered(-1);
    if (id) navigateToQuestion(id);
  }, [findUnanswered, navigateToQuestion]);

  // â”€â”€ Loading / error states (preserved) â”€â”€
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Loading</p>
        <p className="mt-2 text-sm text-foreground">Loading ISO/IEC 27001 readiness questions...</p>
      </div>
    );
  }
  if (loadError || !bundle) {
    return (
      <div className="rounded-2xl border border-[#FCA5A5] bg-[#FEF2F2] p-6">
        <p className="font-display text-base font-bold text-[#B91C1C]">
          Could not load assessment workspace
        </p>
        <p className="mt-1 text-sm text-[#7F1D1D]">{loadError ?? "Unknown error."}</p>
      </div>
    );
  }

  const domainList = Object.values(bundle.domains);
  const current: AssessmentDomainBundle = bundle.domains[activeDomain] ?? domainList[0];
  const selQ = selectedQuestion;
  const selR = selQ ? responses[selQ.id] : undefined;

  return (
    <>
      {/* â”€â”€ Compact header â”€â”€ */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-extrabold text-[#111827]">
              Manual Assessment
            </h1>
            <span className="font-mono text-xs text-[#6B7280]">
              {answeredCount}/{totalQuestions} answered
            </span>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[#F3F4F6]">
              <div
                className="h-full rounded-full bg-[#7C3AED] transition-all"
                style={{ width: `${overallPct}%` }}
              />
            </div>
            {savedAt && (
              <span className="font-mono text-[11px] text-[#059669]">
                {saveMode === "workspace"
                  ? "Saved"
                  : saveMode === "unavailable"
                    ? "Local draft"
                    : "Saved locally"}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[#6B7280]">
            ISO/IEC 27001 readiness assessment across {domainList.length} domains
          </p>
        </div>
        <button
          disabled={!isComplete || submitting}
          onClick={handleSubmit}
          className="shrink-0 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-50"
          title={isComplete ? "Evaluate readiness" : "Complete all questions to evaluate"}
        >
          {submitting ? "Evaluating..." : "Submit & evaluate"}
        </button>
      </div>

      {/* â”€â”€ Compact warnings â”€â”€ */}
      <div className="mt-2 flex flex-wrap gap-2">
        {backendStatus !== "connected" && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-2.5 py-1 font-mono text-[11px] text-[#92400E]">
            {assessmentBackendStatusLabel(backendStatus)}
          </span>
        )}
        {!isComplete && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-2.5 py-1 font-mono text-[11px] text-[#92400E]">
            In progress {"\u2014"} {totalQuestions - answeredCount} remaining
          </span>
        )}
        {submitError && (
          <span className="inline-flex items-center rounded-md border border-[#FCA5A5] bg-[#FEF2F2] px-2.5 py-1 text-[11px] text-[#B91C1C]">
            {submitError}
          </span>
        )}
      </div>

      {/* â”€â”€ Domain tabs â”€â”€ */}
      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
        {domainList.map((d) => {
          const ans = d.questions.filter((q) => responses[q.id]).length;
          const active = d.domain.id === activeDomain;
          return (
            <button
              key={d.domain.id}
              onClick={() => setActiveDomain(d.domain.id)}
              className={`shrink-0 rounded-md px-3 py-1.5 font-mono text-xs transition ${
                active
                  ? "bg-[#7C3AED] text-white"
                  : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]"
              }`}
            >
              {d.domain.id} {"\u00B7"} {ans}/{d.questions.length}
            </button>
          );
        })}
      </div>

      {/* â”€â”€ Toolbar â”€â”€ */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full rounded-md border border-[#E5E7EB] bg-white py-1.5 pl-8 pr-3 text-sm text-[#111827] placeholder-[#9CA3AF] transition focus:border-[#7C3AED] focus:outline-none"
          />
          <svg
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-[#E5E7EB] bg-white px-2 py-1.5 text-xs text-[#374151]"
        >
          <option value="all">All status</option>
          <option value="Not started">Not started</option>
          <option value="Answered">Answered</option>
          <option value="Needs evidence">Needs evidence</option>
          <option value="Critical unanswered">Critical unanswered</option>
          <option value="Strong evidence">Strong evidence</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-md border border-[#E5E7EB] bg-white px-2 py-1.5 text-xs text-[#374151]"
        >
          <option value="all">All priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={evidenceFilter}
          onChange={(e) => setEvidenceFilter(e.target.value)}
          className="rounded-md border border-[#E5E7EB] bg-white px-2 py-1.5 text-xs text-[#374151]"
        >
          <option value="all">All evidence</option>
          <option value="0">No evidence</option>
          <option value="0.3">Weak</option>
          <option value="0.6">Partial</option>
          <option value="1">Strong</option>
        </select>
      </div>

      {/* â”€â”€ Main content: table + panel â”€â”€ */}
      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        {/* â”€â”€ Questions table â”€â”€ */}
        <div className="min-w-0 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white">
          {filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-[#6B7280]">No questions match these filters.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setEvidenceFilter("all");
                }}
                className="mt-2 text-xs font-medium text-[#7C3AED] hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                      <th className="whitespace-nowrap px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        ID
                      </th>
                      <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Question
                      </th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Priority
                      </th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Maturity
                      </th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Evidence
                      </th>
                      <th className="whitespace-nowrap px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedQuestions.map((q) => {
                      const r = responses[q.id];
                      const status = getQuestionStatus(q, r);
                      const sev = (q.severity ?? "medium").toLowerCase();
                      const isSelected = q.id === selectedQuestionId;
                      return (
                        <tr
                          key={q.id}
                          onClick={() => {
                            setSelectedQuestionId(q.id);
                            if (window.innerWidth < 1024) setMobileDrawerOpen(true);
                          }}
                          className={`cursor-pointer border-b border-[#F3F4F6] transition ${
                            isSelected ? "bg-[#F3E8FF]" : "hover:bg-[#F9FAFB]"
                          }`}
                        >
                          <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-[#6B7280]">
                            {q.controlCode ?? q.id}
                          </td>
                          <td className="max-w-[280px] px-3 py-3">
                            <span className="line-clamp-2 text-sm text-[#111827]">
                              {getShortTitle(q)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <span
                              className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${SEV_PILL[sev] ?? SEV_PILL.low}`}
                            >
                              {sev}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-[#374151]">
                            {getMaturityLabel(r)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-[#374151]">
                            {getEvidencePct(r)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_PILL[status] ?? STATUS_PILL["Not started"]}`}
                            >
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#E5E7EB] px-3 py-2">
                  <span className="text-xs text-[#6B7280]">
                    {filteredQuestions.length} question{filteredQuestions.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage(safePage - 1)}
                      className="rounded px-2 py-1 text-xs text-[#374151] hover:bg-[#F3F4F6] disabled:opacity-40"
                    >
                      â† Prev
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`rounded px-2 py-1 text-xs ${
                          safePage === i + 1
                            ? "bg-[#7C3AED] text-white"
                            : "text-[#374151] hover:bg-[#F3F4F6]"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage(safePage + 1)}
                      className="rounded px-2 py-1 text-xs text-[#374151] hover:bg-[#F3F4F6] disabled:opacity-40"
                    >
                      Next â†’
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* â”€â”€ Answer panel (desktop) â”€â”€ */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
            {selQ ? (
              <AnswerPanelContent
                q={selQ}
                r={selR}
                domainName={current.domain.shortName ?? current.domain.name}
                onUpdate={(patch) => updateResponse(selQ, patch)}
                onPrevUnanswered={goPrevUnanswered}
                onNextUnanswered={goNextUnanswered}
                savedAt={savedAt}
                saveMode={saveMode}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm text-[#6B7280]">Select a question to begin</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* â”€â”€ Mobile drawer â”€â”€ */}
      {mobileDrawerOpen && selQ && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-[#111827]/40"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 top-8 overflow-y-auto rounded-t-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3">
              <span className="font-mono text-xs font-semibold text-[#7C3AED]">
                {selQ.controlCode ?? selQ.id}
              </span>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-md border border-[#E5E7EB] p-1.5 text-[#6B7280] hover:text-[#111827]"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AnswerPanelContent
              q={selQ}
              r={selR}
              domainName={current.domain.shortName ?? current.domain.name}
              onUpdate={(patch) => updateResponse(selQ, patch)}
              onPrevUnanswered={goPrevUnanswered}
              onNextUnanswered={goNextUnanswered}
              savedAt={savedAt}
              saveMode={saveMode}
            />
          </div>
        </div>
      )}
    </>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   Answer Panel Content (shared desktop+mobile)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function AnswerPanelContent({
  q,
  r,
  domainName,
  onUpdate,
  onPrevUnanswered,
  onNextUnanswered,
  savedAt,
  saveMode,
}: {
  q: AssessmentQuestion;
  r: AssessmentResponse | undefined;
  domainName: string;
  onUpdate: (patch: Partial<AssessmentResponse>) => void;
  onPrevUnanswered: () => void;
  onNextUnanswered: () => void;
  savedAt: number | null;
  saveMode: string;
}) {
  const sev = (q.severity ?? "medium").toLowerCase();
  return (
    <div className="space-y-5 p-5">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-bold text-[#7C3AED]">
            {q.controlCode ?? q.id}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${SEV_PILL[sev] ?? SEV_PILL.low}`}
          >
            {sev}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#6B7280]">
          {q.domainId} {"\u00B7"} {domainName}
        </p>
      </div>

      {/* Full question */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[#9CA3AF]">Question</p>
        <p className="mt-1 text-sm leading-relaxed text-[#111827]">{q.question}</p>
      </div>

      {/* Description */}
      {q.helpText && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#9CA3AF]">
            Description
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#6B7280]">{q.helpText}</p>
        </div>
      )}

      {/* Expected evidence */}
      {q.expectedEvidence && q.expectedEvidence.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#9CA3AF]">
            Expected evidence
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-[#374151]">
            {q.expectedEvidence.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Maturity selector */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[#9CA3AF]">Maturity</p>
        <div className="mt-2 grid grid-cols-1 gap-1.5">
          {MATURITY.map((m) => {
            const sel = r?.maturityLevel === m.v;
            return (
              <button
                key={m.v}
                onClick={() => onUpdate({ maturityLevel: m.v as 0 | 1 | 2 | 3 })}
                className={`rounded-md border px-3 py-2 text-left text-xs transition ${
                  sel
                    ? "border-[#7C3AED] bg-[#F5F3FF] text-[#7C3AED] font-semibold"
                    : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#C4B5FD]"
                }`}
              >
                <span className="font-mono text-[11px]">L{m.v}</span>
                <span className="ml-2">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Evidence confidence */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-[#9CA3AF]">
          Evidence confidence
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {CONFIDENCE.map((c) => {
            const sel = r?.evidenceConfidence === c.v;
            return (
              <button
                key={c.v}
                onClick={() => onUpdate({ evidenceConfidence: c.v as 0 | 0.3 | 0.6 | 1 })}
                className={`rounded-md border px-3 py-2 text-left text-xs transition ${
                  sel
                    ? "border-[#7C3AED] bg-[#F5F3FF] text-[#7C3AED] font-semibold"
                    : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#C4B5FD]"
                }`}
              >
                <div className="font-mono text-[11px]">{c.v.toFixed(2)}</div>
                <div className="mt-0.5">{c.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Evidence note */}
      <div>
        <label className="font-mono text-[10px] uppercase tracking-wider text-[#9CA3AF]">
          Evidence note
        </label>
        <textarea
          rows={3}
          value={r?.evidenceNote ?? ""}
          onChange={(e) => onUpdate({ evidenceNote: e.target.value })}
          placeholder="Reference document, system, owner, or note..."
          className="mt-1 w-full rounded-md border border-[#E5E7EB] bg-white p-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] transition focus:border-[#7C3AED] focus:outline-none"
        />
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E7EB] pt-4">
        {savedAt && (
          <span className="font-mono text-[11px] text-[#059669]">
            {saveMode === "workspace" ? "Saved" : "Saved locally"}
          </span>
        )}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={onPrevUnanswered}
            className="rounded-md border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#374151] transition hover:border-[#7C3AED] hover:text-[#7C3AED]"
          >
            â† Prev
          </button>
          <button
            onClick={onNextUnanswered}
            className="rounded-md bg-[#7C3AED] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#6D28D9]"
          >
            Next â†’
          </button>
        </div>
      </div>
    </div>
  );
}
