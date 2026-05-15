import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, useDashboard } from "@/components/layout/DashboardShell";
import { PageHeader, StatusPill, WorkspaceCard } from "@/components/compliance/WorkspacePrimitives";
import {
  PLANNED_FRAMEWORKS,
  TOTAL_ASSESSMENT_QUESTIONS,
  buildComplianceControlRows,
  formatDateTime,
  summarizeControls,
} from "@/lib/compliance/workspace";
import { useComplianceWorkspaceData } from "@/lib/compliance/useWorkspaceData";

export const Route = createFileRoute("/frameworks")({
  head: () => ({
    meta: [
      { title: "Frameworks - Averonix" },
      {
        name: "description",
        content: "Active and planned readiness frameworks in the Averonix workspace.",
      },
    ],
  }),
  component: FrameworksPage,
});

function FrameworksPage() {
  return (
    <DashboardShell>
      <FrameworksInner />
    </DashboardShell>
  );
}

function FrameworksInner() {
  const { company } = useDashboard();
  const data = useComplianceWorkspaceData(company);
  const controls = buildComplianceControlRows({
    sector: company?.sector,
    responses: data.responses,
    result: data.result,
  });
  const summary = summarizeControls(controls);
  const answered = data.result?.answeredCount ?? data.progress?.answered ?? summary.answered;
  const total =
    data.result?.questionCount ?? data.progress?.totalQuestions ?? TOTAL_ASSESSMENT_QUESTIONS;
  const progress = total ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compliance"
        title="Frameworks"
        description="ISO/IEC 27001:2022 is the active readiness framework. Future frameworks are planned only and do not show active progress in this demo."
      />

      {data.sourceNotice ? (
        <section className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#5B6472]">
          {data.sourceNotice}
        </section>
      ) : null}

      <WorkspaceCard>
        <div className="border-b border-[#E5E7EB] p-4">
          <h2 className="text-sm font-semibold text-[#111827]">Framework inventory</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#E5E7EB] bg-[#F8F8FA] text-xs uppercase tracking-[0.08em] text-[#6B7280]">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Framework</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5 font-semibold">Readiness</th>
                <th className="px-4 py-2.5 font-semibold">Assessment progress</th>
                <th className="px-4 py-2.5 font-semibold">Evidence confidence</th>
                <th className="px-4 py-2.5 font-semibold">Critical gaps</th>
                <th className="px-4 py-2.5 font-semibold">Last evaluation</th>
                <th className="px-4 py-2.5 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {/* ISO 27001 — Active */}
              <tr className="bg-white">
                <td className="px-4 py-3 font-medium text-[#111827]">ISO/IEC 27001:2022</td>
                <td className="px-4 py-3">
                  <StatusPill tone="purple">Active</StatusPill>
                </td>
                <td className="px-4 py-3 font-medium text-[#111827]">
                  {data.result ? `${data.result.overallScore}%` : "Not evaluated"}
                </td>
                <td className="px-4 py-3 text-[#5B6472]">
                  {answered}/{total} answered
                </td>
                <td className="px-4 py-3 text-[#5B6472]">
                  {data.result ? `${data.result.evidenceConfidence}%` : "No result"}
                </td>
                <td className="px-4 py-3 text-[#5B6472]">
                  {data.result?.criticalGaps.length ?? 0}
                </td>
                <td className="px-4 py-3 text-[#5B6472]">
                  {formatDateTime(data.result?.completedAt)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    to="/frameworks/iso27001"
                    className="text-xs font-semibold text-[#7C3AED] hover:underline"
                  >
                    Open framework
                  </Link>
                </td>
              </tr>

              {/* Planned frameworks */}
              {PLANNED_FRAMEWORKS.map((fw) => (
                <tr key={fw.id}>
                  <td className="px-4 py-3 font-medium text-[#111827]">{fw.name}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone="gray">Planned</StatusPill>
                  </td>
                  <td className="px-4 py-3 text-[#9CA3AF]">—</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">—</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">—</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">—</td>
                  <td className="px-4 py-3 text-[#9CA3AF]">—</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-[#9CA3AF]">Coming soon</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WorkspaceCard>
    </div>
  );
}
