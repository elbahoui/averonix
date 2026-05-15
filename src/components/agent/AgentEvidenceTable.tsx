import { Fragment, useMemo, useState } from "react";
import type { AgentCheckResult, AgentMappedQuestion } from "@/lib/agent";
import { groupMappedEvidence } from "@/lib/agent/grouped-evidence";

export function AgentEvidenceTable({
  mappedQuestions,
  checks,
}: {
  mappedQuestions: AgentMappedQuestion[];
  checks: AgentCheckResult[];
}) {
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const grouped = useMemo(
    () => groupMappedEvidence(mappedQuestions, checks),
    [mappedQuestions, checks],
  );

  if (mappedQuestions.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="font-display text-base font-bold text-foreground">
        Evidence mapped to ISO/IEC 27001 readiness questions
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Agent Evidence is grouped by readiness question. Each row remains partial external signal
        evidence, not a complete domain assessment.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pr-3 font-mono">Domain</th>
              <th className="py-2 pr-3 font-mono">Control</th>
              <th className="py-2 pr-3 font-mono">Question</th>
              <th className="py-2 pr-3 font-mono">Overall status</th>
              <th className="py-2 pr-3 font-mono">External signal score</th>
              <th className="py-2 pr-3 font-mono">Signal confidence</th>
              <th className="py-2 pr-3 font-mono">Checks</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((group) => {
              const isOpen = openQuestionId === group.questionId;
              return (
                <Fragment key={group.questionId}>
                  <tr className="border-b border-border/60 align-top">
                    <td className="py-3 pr-3 font-mono text-xs text-primary">{group.domainId}</td>
                    <td className="py-3 pr-3 font-mono text-xs text-foreground">
                      {group.controlCode ?? group.questionId}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      <button
                        type="button"
                        onClick={() => setOpenQuestionId(isOpen ? null : group.questionId)}
                        className="text-left transition hover:text-primary"
                      >
                        {group.question}
                      </button>
                    </td>
                    <td className="py-3 pr-3 capitalize text-foreground">
                      {group.status.replace("_", " ")}
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs text-foreground">{group.score}%</td>
                    <td className="py-3 pr-3 font-mono text-xs text-muted-foreground">
                      {group.confidence}%
                    </td>
                    <td className="py-3 pr-3">
                      <button
                        type="button"
                        onClick={() => setOpenQuestionId(isOpen ? null : group.questionId)}
                        className="rounded-lg border border-border px-2 py-1 font-mono text-xs text-primary transition hover:border-primary"
                      >
                        {group.supportingChecks.length}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-border/60 bg-surface-soft/60">
                      <td colSpan={7} className="px-3 py-3">
                        <ul className="space-y-2">
                          {group.supportingChecks.map((support) => (
                            <li
                              key={`${group.questionId}-${support.checkId}`}
                              className="rounded-lg border border-border bg-card p-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-display text-sm font-semibold text-foreground">
                                  {support.check?.name ?? support.checkId}
                                </span>
                                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                                  {support.status.replace("_", " ")} -{" "}
                                  {support.check?.severity ?? "medium"}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {support.evidence}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
