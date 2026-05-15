import { AUTOMATED_QUESTIONS_TARGET } from "@/lib/agent";
import { getAllQuestions } from "@/data/iso27001";

export function AgentCoverageCard() {
  const total = getAllQuestions().length || 270;
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="font-display text-base font-bold text-foreground">
        What the Agent can verify
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The Agent checks external observable signals such as HTTPS, TLS, DNS, email security,
        security headers, and public exposure. It does not replace the guided assessment or
        certification audit.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-soft px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-wider text-primary">
          Agent coverage
        </span>
        <span className="font-display text-base font-bold text-foreground">
          {AUTOMATED_QUESTIONS_TARGET} / {total} questions automated
        </span>
        <span className="text-xs text-muted-foreground">
          Full readiness still requires integrations and guided assessment.
        </span>
      </div>
    </section>
  );
}
