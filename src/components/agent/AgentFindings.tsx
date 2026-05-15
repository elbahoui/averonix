import type { AgentCheckResult } from "@/lib/agent";

function StatusBadge({ status }: { status: AgentCheckResult["status"] }) {
  const map = {
    passed: {
      bg: "#ECFDF5",
      fg: "#065F46",
      border: "#A7F3D0",
      label: "External signal passed",
    },
    warning: { bg: "#FFFBEB", fg: "#92400E", border: "#FDE68A", label: "Warning" },
    failed: { bg: "#FEF2F2", fg: "#991B1B", border: "#FECACA", label: "Failed" },
    not_checked: { bg: "#F6F0FF", fg: "#5B5675", border: "#E9DDF7", label: "Not checked" },
  } as const;
  const t = map[status];
  return (
    <span
      className="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium"
      style={{ background: t.bg, color: t.fg, borderColor: t.border }}
    >
      {t.label}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: AgentCheckResult["severity"] }) {
  return (
    <span className="rounded-full border border-border bg-surface-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      {severity}
    </span>
  );
}

export function AgentFindings({ checks }: { checks: AgentCheckResult[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="font-display text-base font-bold text-foreground">Checks &amp; findings</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        All checks performed in this scan. Items marked as Not checked require a backend or edge
        function in a future release.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-3 font-mono">Check</th>
              <th className="py-2 pr-3 font-mono">Status</th>
              <th className="py-2 pr-3 font-mono">Severity</th>
              <th className="py-2 pr-3 font-mono">Evidence</th>
              <th className="py-2 pr-3 font-mono">Recommendation</th>
              <th className="py-2 pr-3 font-mono">Domains</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((c) => (
              <tr key={c.id} className="border-b border-border/60 align-top">
                <td className="py-3 pr-3 font-medium text-foreground">{c.name}</td>
                <td className="py-3 pr-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="py-3 pr-3">
                  <SeverityBadge severity={c.severity} />
                </td>
                <td className="py-3 pr-3 text-muted-foreground">{c.evidence}</td>
                <td className="py-3 pr-3 text-muted-foreground">{c.recommendation}</td>
                <td className="py-3 pr-3">
                  <div className="flex flex-wrap gap-1">
                    {c.mappedDomains.length === 0 && <span className="text-xs text-border">-</span>}
                    {c.mappedDomains.map((d) => (
                      <span
                        key={d}
                        className="rounded-full border border-border bg-surface-soft px-2 py-0.5 font-mono text-[10px] text-primary"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
