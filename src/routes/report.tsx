import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, useDashboard } from "@/components/layout/DashboardShell";
import {
  EmptyState,
  MetricCard,
  PageHeader,
  PrimaryLink,
  StatusPill,
  TableWrap,
  WorkspaceCard,
} from "@/components/compliance/WorkspacePrimitives";
import { ALL_DOMAINS, findQuestion } from "@/data/iso27001";
import { formatAssessmentModel } from "@/lib/assessment/metadata";
import { buildComplianceControlRows, formatDateTime } from "@/lib/compliance/workspace";
import { useComplianceWorkspaceData } from "@/lib/compliance/useWorkspaceData";
import type { AssessmentResult } from "@/lib/api";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Readiness report - Averonix" },
      {
        name: "description",
        content: "ISO/IEC 27001 readiness preview based on Manual Assessment results.",
      },
    ],
  }),
  component: () => (
    <DashboardShell>
      <ReportPage />
    </DashboardShell>
  ),
});

const DISCLAIMER =
  "This report is a readiness preview. Averonix does not provide formal assurance, legal advice, accreditation, or official approval. Qualified auditors and accredited bodies are required for formal assurance activities.";

function ReportPage() {
  const { company } = useDashboard();
  const data = useComplianceWorkspaceData(company);
  const controls = buildComplianceControlRows({
    sector: company?.sector,
    responses: data.responses,
    result: data.result,
  });
  const hasResponses = data.responses.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Readiness"
        title="Readiness report"
        description="A readiness preview based on the latest Manual Assessment result. It is not a formal assurance document."
        actions={
          <button
            type="button"
            disabled
            className="inline-flex min-h-10 cursor-not-allowed items-center justify-center rounded-md border border-[#D1D5DB] bg-white px-4 text-sm font-semibold text-[#9CA3AF]"
          >
            Export coming soon
          </button>
        }
      />

      {data.sourceNotice ? (
        <section className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#5B6472]">
          {data.sourceNotice}
        </section>
      ) : null}

      {data.loaded && !data.result ? (
        <EmptyState
          title={hasResponses ? "Re-evaluation required." : "No readiness report is available yet."}
          description={
            hasResponses
              ? "Submit the Manual Assessment again to refresh the readiness preview."
              : "Manual Assessment has not been completed yet."
          }
          actionLabel={hasResponses ? "Re-evaluate assessment" : "Complete assessment"}
          to="/assessment"
        />
      ) : null}

      {data.result ? <ReportBody result={data.result} controlCount={controls.length} /> : null}

      <WorkspaceCard className="border-amber-200 bg-amber-50 p-4">
        <h2 className="text-sm font-semibold text-amber-900">Readiness preview notice</h2>
        <p className="mt-2 text-sm text-amber-800">{DISCLAIMER}</p>
      </WorkspaceCard>
    </div>
  );
}

function ReportBody({ result, controlCount }: { result: AssessmentResult; controlCount: number }) {
  const weakEvidenceRows = result.weakEvidence.map((weak) => {
    const question = findQuestion(weak.questionId);
    return {
      id: weak.questionId,
      domainId: question?.domainId ?? weak.questionId.split("-")[0],
      controlCode: question?.controlCode ?? weak.questionId,
      question: question?.question ?? weak.questionId,
      confidence: Math.round(weak.evidenceConfidence * 100),
    };
  });

  return (
    <>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Overall readiness score"
          value={`${result.overallScore}%`}
          tone={scoreTone(result.overallScore)}
          progress={result.overallScore}
        />
        <MetricCard
          label="Risk level"
          value={titleCase(result.riskLevel)}
          tone={riskTone(result.riskLevel)}
        />
        <MetricCard
          label="Evidence confidence"
          value={`${result.evidenceConfidence}%`}
          tone={scoreTone(result.evidenceConfidence)}
          progress={result.evidenceConfidence}
        />
        <MetricCard
          label="Assessment status"
          value={result.stale ? "Re-evaluation required" : "Evaluated"}
          subtext={`${result.answeredCount}/${result.questionCount} questions`}
          tone={result.stale ? "amber" : "green"}
        />
        <MetricCard
          label="Last evaluation"
          value={formatDateTime(result.completedAt)}
          subtext={formatAssessmentModel(result.modelVersion)}
          tone="gray"
        />
      </section>

      <WorkspaceCard>
        <div className="border-b border-[#E5E7EB] p-4">
          <h2 className="text-lg font-semibold text-[#111827]">Domain breakdown</h2>
        </div>
        <TableWrap>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#E5E7EB] bg-[#F8F8FA] text-xs uppercase tracking-[0.08em] text-[#6B7280]">
              <tr>
                <th className="px-4 py-3 font-semibold">Domain</th>
                <th className="px-4 py-3 font-semibold">Score</th>
                <th className="px-4 py-3 font-semibold">Evidence confidence</th>
                <th className="px-4 py-3 font-semibold">Critical gaps</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {ALL_DOMAINS.map((domain) => {
                const score = result.domainScores[domain.domain.id];
                const gaps = result.criticalGaps.filter(
                  (gap) => gap.domainId === domain.domain.id,
                ).length;
                return (
                  <tr key={domain.domain.id}>
                    <td className="min-w-[260px] px-4 py-4 font-medium text-[#111827]">
                      {domain.domain.id} - {domain.domain.shortName ?? domain.domain.name}
                    </td>
                    <td className="px-4 py-4 text-[#5B6472]">
                      {score ? `${score.score}%` : "Not evaluated"}
                    </td>
                    <td className="px-4 py-4 text-[#5B6472]">
                      {score ? `${score.evidenceConfidence}%` : "0%"}
                    </td>
                    <td className="px-4 py-4 text-[#5B6472]">{gaps}</td>
                    <td className="px-4 py-4">
                      <StatusPill tone={domainTone(score?.score ?? 0, gaps)}>
                        {score ? domainStatus(score.score, gaps) : "Not started"}
                      </StatusPill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </WorkspaceCard>

      <WorkspaceCard>
        <div className="border-b border-[#E5E7EB] p-4">
          <h2 className="text-lg font-semibold text-[#111827]">Critical gaps</h2>
        </div>
        {result.criticalGaps.length === 0 ? (
          <div className="p-4 text-sm text-[#6B7280]">
            No critical or high-severity gaps were detected from the current Manual Assessment.
          </div>
        ) : (
          <TableWrap>
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#E5E7EB] bg-[#F8F8FA] text-xs uppercase tracking-[0.08em] text-[#6B7280]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Gap</th>
                  <th className="px-4 py-3 font-semibold">Domain</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Recommended action</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {result.criticalGaps.map((gap) => {
                  const question = findQuestion(gap.questionId);
                  return (
                    <tr key={gap.questionId} className="align-top">
                      <td className="min-w-[360px] px-4 py-4 font-medium text-[#111827]">
                        {gap.question ?? question?.question ?? gap.questionId}
                      </td>
                      <td className="px-4 py-4 text-[#5B6472]">{gap.domainId}</td>
                      <td className="px-4 py-4">
                        <StatusPill tone="red">{gap.severity}</StatusPill>
                      </td>
                      <td className="min-w-[260px] px-4 py-4 text-[#5B6472]">
                        Track stronger evidence references or improve implementation maturity.
                      </td>
                      <td className="px-4 py-4 text-[#5B6472]">Manual Assessment</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </WorkspaceCard>

      <WorkspaceCard>
        <div className="border-b border-[#E5E7EB] p-4">
          <h2 className="text-lg font-semibold text-[#111827]">Recommendations</h2>
        </div>
        {result.recommendations.length === 0 ? (
          <div className="p-4 text-sm text-[#6B7280]">
            No recommendations are available for the current readiness preview.
          </div>
        ) : (
          <TableWrap>
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#E5E7EB] bg-[#F8F8FA] text-xs uppercase tracking-[0.08em] text-[#6B7280]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Recommendation</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {result.recommendations.map((recommendation, index) => (
                  <tr key={recommendation}>
                    <td className="px-4 py-4 text-[#111827]">{recommendation}</td>
                    <td className="px-4 py-4 text-[#5B6472]">{index === 0 ? "High" : "Medium"}</td>
                    <td className="px-4 py-4 text-[#5B6472]">Manual Assessment</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </WorkspaceCard>

      <WorkspaceCard>
        <div className="border-b border-[#E5E7EB] p-4">
          <h2 className="text-lg font-semibold text-[#111827]">Evidence confidence issues</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Controls below need stronger evidence references to improve trust in the score.
          </p>
        </div>
        {weakEvidenceRows.length === 0 ? (
          <div className="p-4 text-sm text-[#6B7280]">
            No weak evidence reference issues are listed in this result.
          </div>
        ) : (
          <TableWrap>
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#E5E7EB] bg-[#F8F8FA] text-xs uppercase tracking-[0.08em] text-[#6B7280]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Control</th>
                  <th className="px-4 py-3 font-semibold">Domain</th>
                  <th className="px-4 py-3 font-semibold">Confidence</th>
                  <th className="px-4 py-3 font-semibold">Recommended action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {weakEvidenceRows.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="min-w-[360px] px-4 py-4">
                      <p className="text-xs font-semibold text-[#7C3AED]">{row.controlCode}</p>
                      <p className="mt-1 font-medium text-[#111827]">{row.question}</p>
                    </td>
                    <td className="px-4 py-4 text-[#5B6472]">{row.domainId}</td>
                    <td className="px-4 py-4 text-[#5B6472]">{row.confidence}%</td>
                    <td className="min-w-[260px] px-4 py-4 text-[#5B6472]">
                      Track stronger evidence references to raise confidence above 60%.
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </WorkspaceCard>

      <p className="text-xs text-[#6B7280]">
        Reference model covers {controlCount} readiness questions across D1-D9.
      </p>
    </>
  );
}

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function scoreTone(score: number): "green" | "amber" | "red" {
  if (score >= 75) return "green";
  if (score >= 50) return "amber";
  return "red";
}

function riskTone(risk: AssessmentResult["riskLevel"]): "green" | "amber" | "red" {
  if (risk === "minimal" || risk === "low") return "green";
  if (risk === "medium") return "amber";
  return "red";
}

function domainTone(score: number, gaps: number): "green" | "amber" | "red" | "gray" {
  if (gaps > 0) return "red";
  if (score >= 75) return "green";
  if (score > 0) return "amber";
  return "gray";
}

function domainStatus(score: number, gaps: number) {
  if (gaps > 0) return "Needs review";
  if (score >= 75) return "Referenced";
  if (score > 0) return "In progress";
  return "Not started";
}
