import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DashboardShell, useDashboard } from "@/components/layout/DashboardShell";
import {
  FilterSelect,
  Pagination,
  PageHeader,
  PrimaryLink,
  SearchInput,
  SecondaryLink,
  StatusPill,
  SummaryStrip,
  TableWrap,
  Toolbar,
  WorkspaceCard,
  usePagination,
} from "@/components/compliance/WorkspacePrimitives";
import {
  TOTAL_ASSESSMENT_QUESTIONS,
  buildComplianceControlRows,
  domainLabel,
  formatDateTime,
  summarizeControls,
  type ComplianceControlRow,
} from "@/lib/compliance/workspace";
import { useComplianceWorkspaceData } from "@/lib/compliance/useWorkspaceData";

export const Route = createFileRoute("/frameworks/iso27001")({
  head: () => ({
    meta: [
      { title: "ISO/IEC 27001:2022 - Averonix" },
      {
        name: "description",
        content: "ISO/IEC 27001:2022 readiness detail for Averonix.",
      },
    ],
  }),
  component: IsoFrameworkPage,
});

function IsoFrameworkPage() {
  return (
    <DashboardShell>
      <IsoFrameworkInner />
    </DashboardShell>
  );
}

function IsoFrameworkInner() {
  const { company } = useDashboard();
  const data = useComplianceWorkspaceData(company);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [domain, setDomain] = useState("All");
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

  const filtered = useMemo(
    () =>
      controls.filter((control) => {
        const matchesSearch =
          !search ||
          `${control.controlCode} ${control.question} ${control.domainName}`
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesStatus = status === "All" || control.status === status;
        const matchesDomain = domain === "All" || control.domainId === domain;
        return matchesSearch && matchesStatus && matchesDomain;
      }),
    [controls, domain, search, status],
  );

  const pag = usePagination(filtered.length);
  const pageRows = filtered.slice(pag.start, pag.end);

  const byDomain = pageRows.reduce<Record<string, ComplianceControlRow[]>>((acc, control) => {
    acc[control.domainId] = [...(acc[control.domainId] ?? []), control];
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Frameworks / ISO/IEC 27001:2022"
        title="ISO/IEC 27001:2022"
        description="Active readiness framework. Manual Assessment is the primary source; Agent Evidence is external signal only and partial."
        actions={
          <>
            <SecondaryLink to="/report">View readiness preview</SecondaryLink>
            <PrimaryLink to="/scan">Run Agent scan</PrimaryLink>
          </>
        }
      />

      {/* ── Compact summary strip ── */}
      <SummaryStrip
        items={[
          {
            label: "Readiness",
            value: data.result ? `${data.result.overallScore}%` : "Not evaluated",
            tone: data.result ? scoreTone(data.result.overallScore) : "gray",
          },
          {
            label: "Questions answered",
            value: `${answered} / ${total}`,
            tone: progress === 100 ? "green" : progress ? "amber" : "gray",
          },
          {
            label: "Evidence references",
            value: `${summary.strongReferences} strong`,
            tone: summary.needsReferences ? "amber" : "green",
          },
          {
            label: "Agent signal",
            value: data.agent ? `${data.agent.summary.verifiedSignalScore}/100` : "No scan",
            tone: data.agent ? "blue" : "gray",
          },
          {
            label: "Last evaluation",
            value: formatDateTime(data.result?.completedAt),
          },
        ]}
      />

      {/* ── Controls table ── */}
      <WorkspaceCard>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search controls" />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              "All",
              "Not started",
              "In progress",
              "Needs evidence reference",
              "Strong reference",
            ]}
          />
          <FilterSelect
            label="Domain"
            value={domain}
            onChange={(v) => {
              setDomain(v);
              pag.setPage(1);
            }}
            options={["All", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9"]}
          />
        </Toolbar>
        <div className="divide-y divide-[#E5E7EB]">
          {Object.keys(byDomain).length === 0 ? (
            <div className="p-6 text-sm text-[#6B7280]">No controls match the current filters.</div>
          ) : (
            Object.entries(byDomain).map(([domainId, rows]) => (
              <section key={domainId}>
                <div className="border-b border-[#E5E7EB] bg-[#F8F8FA] px-4 py-2.5">
                  <h2 className="text-sm font-semibold text-[#111827]">
                    {domainId} - {domainLabel(domainId)}
                  </h2>
                </div>
                <TableWrap>
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-[#E5E7EB] text-xs uppercase tracking-[0.08em] text-[#6B7280]">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">ID</th>
                        <th className="px-4 py-2.5 font-semibold">Control</th>
                        <th className="px-4 py-2.5 font-semibold">Evidence status</th>
                        <th className="px-4 py-2.5 font-semibold">Category</th>
                        <th className="px-4 py-2.5 font-semibold">Owner</th>
                        <th className="px-4 py-2.5 font-semibold">ISO reference</th>
                        <th className="px-4 py-2.5 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {rows.map((control) => (
                        <tr key={control.id} className="align-top">
                          <td className="px-4 py-3 text-xs font-semibold text-[#7C3AED] whitespace-nowrap">
                            {control.controlCode}
                          </td>
                          <td className="min-w-[240px] px-4 py-3">
                            <p className="font-medium text-[#111827] line-clamp-2">
                              {control.question}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill tone={evidenceTone(control.evidenceStatus)}>
                              {control.evidenceStatus}
                            </StatusPill>
                          </td>
                          <td className="px-4 py-3 text-[#5B6472]">{control.category}</td>
                          <td className="px-4 py-3 text-[#5B6472]">{control.owner}</td>
                          <td className="px-4 py-3 text-[#5B6472]">{control.isoReference}</td>
                          <td className="px-4 py-3">
                            <StatusPill tone={statusTone(control.status)}>
                              {control.status}
                            </StatusPill>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableWrap>
              </section>
            ))
          )}
        </div>
        <Pagination
          page={pag.page}
          pageSize={pag.pageSize}
          total={filtered.length}
          onPageChange={pag.setPage}
          onPageSizeChange={pag.setPageSize}
        />
      </WorkspaceCard>
    </div>
  );
}

function scoreTone(score: number): "green" | "amber" | "red" {
  if (score >= 75) return "green";
  if (score >= 50) return "amber";
  return "red";
}

function statusTone(status: string): "green" | "amber" | "red" | "purple" | "gray" | "blue" {
  if (status === "Strong reference") return "green";
  if (status === "Needs evidence reference") return "amber";
  if (status === "In progress") return "purple";
  return "gray";
}

function evidenceTone(status: string): "green" | "amber" | "red" | "purple" | "gray" | "blue" {
  if (status === "Strong reference" || status === "Referenced") return "green";
  if (status === "Needs reference") return "amber";
  if (status === "Agent signal only") return "blue";
  if (status === "Missing") return "red";
  return "gray";
}
