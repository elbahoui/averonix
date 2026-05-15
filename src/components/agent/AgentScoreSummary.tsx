import type { AgentScanResult } from "@/lib/agent";

const INTERP_TONE: Record<string, { bg: string; fg: string; border: string; label: string }> = {
  insufficient_evidence: {
    bg: "#FFFBEB",
    fg: "#92400E",
    border: "#FDE68A",
    label: "Insufficient evidence",
  },
  critical: { bg: "#FEF2F2", fg: "#991B1B", border: "#FECACA", label: "Critical" },
  high: { bg: "#FEF3C7", fg: "#92400E", border: "#FDE68A", label: "High" },
  medium: { bg: "#FFFBEB", fg: "#B45309", border: "#FDE68A", label: "Medium" },
  low: { bg: "#ECFDF5", fg: "#065F46", border: "#A7F3D0", label: "Low" },
  minimal: { bg: "#EEF2FF", fg: "#3730A3", border: "#C7D2FE", label: "Minimal" },
};

export function AgentScoreSummary({ result }: { result: AgentScanResult }) {
  const { summary } = result;
  const interp = INTERP_TONE[summary.riskInterpretation] ?? INTERP_TONE.insufficient_evidence;
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Stat
        title="Verified signal score"
        value={`${summary.verifiedSignalScore}/100`}
        meta="Excludes unchecked items"
      />
      <Stat
        title="Evidence confidence"
        value={`${summary.evidenceConfidence}%`}
        meta={
          summary.evidenceConfidence < 40
            ? "Too low to interpret risk"
            : "Verified coverage of checks"
        }
      />
      <Stat
        title="Agent readiness impact"
        value={`${summary.agentReadinessImpact}/100`}
        meta="Signal x confidence"
      />
      <div
        className="rounded-2xl border p-4 shadow-soft"
        style={{ background: interp.bg, borderColor: interp.border }}
      >
        <p className="font-mono text-[11px] uppercase tracking-wider" style={{ color: interp.fg }}>
          Risk interpretation
        </p>
        <p className="mt-2 font-display text-xl font-extrabold" style={{ color: interp.fg }}>
          {interp.label}
        </p>
        <p className="mt-1 text-[11px]" style={{ color: interp.fg }}>
          Coverage {summary.automatedQuestions}/{summary.totalModelQuestions}
        </p>
      </div>
      <Stat
        title="Critical findings"
        value={`${summary.criticalFindings}`}
        meta={`${summary.passedChecks} external signal passed - ${summary.failedChecks} failed - ${summary.notChecked} not checked`}
      />
    </section>
  );
}

function Stat({ title, value, meta }: { title: string; value: string; meta?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <p className="mt-2 font-display text-2xl font-extrabold text-foreground">{value}</p>
      {meta && <p className="mt-1 text-[11px] text-muted-foreground">{meta}</p>}
    </div>
  );
}
