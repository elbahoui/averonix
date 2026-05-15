import type { AgentScanResult } from "@/lib/agent";

const DOMAIN_NAMES: Record<string, string> = {
  D1: "Organization Context & ISMS Scope",
  D2: "Leadership, Policy & Responsibilities",
  D3: "Risk Assessment & Risk Treatment",
  D4: "Security Objectives & Planning",
  D5: "Resources, Competence & Awareness",
  D6: "Documented Information & Operational Control",
  D7: "Organizational & Supplier Controls",
  D8: "People, Physical & Access Controls",
  D9: "Technological Controls & Monitoring",
};

export function AgentDomainCoverage({
  domainCoverage,
}: {
  domainCoverage: AgentScanResult["domainCoverage"];
}) {
  const ids = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9"];
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="font-display text-base font-bold text-foreground">Domain coverage</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        D7, D8, and D9 are partially supported by the Agent. D1-D6 require guided assessment or
        future integrations.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ids.map((id) => {
          const c = domainCoverage[id];
          const partial =
            ["D7", "D8", "D9"].includes(id) && c?.score !== null && c?.score !== undefined;
          return (
            <div key={id} className="rounded-xl border border-border bg-surface-soft p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[11px] uppercase tracking-wider text-primary">{id}</p>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                    partial ? "bg-[#ECFDF5] text-[#065F46]" : "bg-[#FEF3C7] text-[#92400E]"
                  }`}
                >
                  {partial ? "Partial (Agent)" : "Assessment / Integration"}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">{DOMAIN_NAMES[id]}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c?.notes ?? "No data."}</p>
              {c?.score !== null && c?.score !== undefined && (
                <p className="mt-2 font-mono text-[11px] text-foreground">
                  Score {c.score} - Confidence {c.confidence}%
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
