import type { AgentProgressStatus, AgentProgressStep } from "@/lib/agent";

const STEPS: { id: AgentProgressStep; label: string }[] = [
  { id: "normalize", label: "Normalize domain" },
  { id: "https", label: "Check HTTPS" },
  { id: "headers", label: "Check security headers" },
  { id: "dns", label: "Check DNS and email security" },
  { id: "map", label: "Map evidence to ISO/IEC 27001 readiness" },
  { id: "findings", label: "Generate findings" },
];

export function AgentScanProgress({
  state,
}: {
  state: Record<AgentProgressStep, AgentProgressStatus>;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="font-display text-base font-bold text-foreground">Scan progress</h2>
      <ul className="mt-3 space-y-2">
        {STEPS.map((s) => {
          const st = state[s.id] ?? "pending";
          return (
            <li key={s.id} className="flex items-center gap-3 text-sm">
              <Dot status={st} />
              <span
                className={
                  st === "done"
                    ? "text-foreground"
                    : st === "running"
                      ? "text-primary"
                      : st === "failed"
                        ? "text-[color:var(--danger)]"
                        : "text-muted-foreground"
                }
              >
                {s.label}
              </span>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {st}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Dot({ status }: { status: AgentProgressStatus }) {
  const c =
    status === "done"
      ? "var(--success)"
      : status === "running"
        ? "var(--primary)"
        : status === "failed"
          ? "var(--danger)"
          : "var(--border)";
  return (
    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c }} aria-hidden />
  );
}
