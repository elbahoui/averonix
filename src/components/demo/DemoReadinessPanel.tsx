import { useEffect, useState } from "react";
import { getLastAgentScan } from "@/lib/agent";
import {
  getAssessmentProgress,
  getAssessmentResponses,
  getAssessmentResults,
} from "@/lib/assessment/storage";
import { getBackendStatus, type BackendStatusDetails } from "@/lib/backend-status";
import { localAssessmentQuestions } from "@/lib/api";
import { clearDemoData } from "@/lib/demo/reset";
import { normalizeSector, sectorLabel } from "@/lib/sector";
import type { StoredCompany } from "@/lib/storage";

type DemoReadinessPanelProps = {
  company?: Partial<StoredCompany> | null;
};

export function DemoReadinessPanel({ company }: DemoReadinessPanelProps) {
  if (!import.meta.env.DEV) return null;
  return <DemoReadinessPanelInner company={company} />;
}

function DemoReadinessPanelInner({ company }: DemoReadinessPanelProps) {
  const [backend, setBackend] = useState<BackendStatusDetails | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getBackendStatus().then((status) => {
      if (!cancelled) setBackend(status);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const agent = getLastAgentScan();
  const responses = getAssessmentResponses();
  const result = getAssessmentResults();
  const progress = getAssessmentProgress();
  const sector = normalizeSector(company?.sector ?? result?.sector ?? progress?.sector);
  const questionCount =
    result?.questionCount ??
    progress?.totalQuestions ??
    Object.values(localAssessmentQuestions(sector).domains).reduce(
      (sum, domain) => sum + domain.questions.length,
      0,
    );
  const localDataAge = formatLocalDataAge([
    agent?.createdAt,
    result?.completedAt,
    progress?.updatedAt,
  ]);

  function handleReset() {
    const confirmed = window.confirm(
      "Reset local demo Agent and Assessment data? This will not clear Supabase auth or the company profile.",
    );
    if (!confirmed) return;
    clearDemoData();
    setRefreshKey((value) => value + 1);
  }

  const rows: Array<[string, string]> = [
    ["Backend API configured", yesNo(backend?.apiConfigured)],
    ["Backend health reachable", yesNo(backend?.healthReachable)],
    ["Agent last scan exists", yesNo(!!agent)],
    ["Assessment responses exist", yesNo(responses.length > 0)],
    ["Assessment result exists", yesNo(!!result)],
    ["Report ready", yesNo(!!result)],
    ["Local demo data age", localDataAge],
    ["Current sector", sectorLabel(sector)],
    ["Question count", String(questionCount)],
  ];

  return (
    <section className="mt-6 rounded-2xl border border-dashed border-[#C4B5FD] bg-surface-soft/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-primary">
            Dev-only demo readiness
          </p>
          <h2 className="mt-1 font-display text-lg font-bold text-foreground">
            Controlled demo checklist
          </h2>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-primary transition hover:border-primary"
        >
          Reset local demo data
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-card px-3 py-2">
            <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {label}
            </dt>
            <dd className="mt-1 text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function yesNo(value?: boolean): string {
  return value ? "Yes" : "No";
}

function formatLocalDataAge(values: Array<string | undefined>): string {
  const dates = values
    .filter(Boolean)
    .map((value) => new Date(value as string))
    .filter((date) => !Number.isNaN(date.getTime()));
  if (!dates.length) return "No local demo data";

  const latest = Math.max(...dates.map((date) => date.getTime()));
  const diffMs = Math.max(Date.now() - latest, 0);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
