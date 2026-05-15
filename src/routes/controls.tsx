import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DashboardShell, useDashboard } from "@/components/layout/DashboardShell";
import {
  FilterSelect,
  Pagination,
  PageHeader,
  SearchInput,
  SidePanel,
  StatusPill,
  TableWrap,
  Toolbar,
  WorkspaceCard,
  usePagination,
} from "@/components/compliance/WorkspacePrimitives";
import {
  buildComplianceControlRows,
  domainLabel,
  type ComplianceControlRow,
} from "@/lib/compliance/workspace";
import { useComplianceWorkspaceData } from "@/lib/compliance/useWorkspaceData";

export const Route = createFileRoute("/controls")({
  head: () => ({
    meta: [
      { title: "Controls - Averonix" },
      {
        name: "description",
        content: "Table-first ISO/IEC 27001 readiness controls and evidence reference status.",
      },
    ],
  }),
  component: ControlsPage,
});

function ControlsPage() {
  return (
    <DashboardShell>
      <ControlsInner />
    </DashboardShell>
  );
}

function ControlsInner() {
  const { company } = useDashboard();
  const data = useComplianceWorkspaceData(company);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("All");
  const [status, setStatus] = useState("All");
  const [confidence, setConfidence] = useState("All");
  const [priority, setPriority] = useState("All");
  const [selected, setSelected] = useState<ComplianceControlRow | null>(null);
  const controls = buildComplianceControlRows({
    sector: company?.sector,
    responses: data.responses,
    result: data.result,
  });

  const filtered = useMemo(
    () =>
      controls.filter((control) => {
        const haystack = `${control.controlCode} ${control.question} ${control.domainName} ${control.isoReference}`;
        const matchesSearch = !search || haystack.toLowerCase().includes(search.toLowerCase());
        const matchesDomain = domain === "All" || control.domainId === domain;
        const matchesStatus = status === "All" || control.status === status;
        const matchesPriority = priority === "All" || control.priority === priority;
        const matchesConfidence =
          confidence === "All" ||
          (confidence === "0%" && control.evidenceConfidence === 0) ||
          (confidence === "1-59%" &&
            control.evidenceConfidence > 0 &&
            control.evidenceConfidence < 60) ||
          (confidence === "60-99%" &&
            control.evidenceConfidence >= 60 &&
            control.evidenceConfidence < 100) ||
          (confidence === "100%" && control.evidenceConfidence === 100);
        return (
          matchesSearch && matchesDomain && matchesStatus && matchesPriority && matchesConfidence
        );
      }),
    [confidence, controls, domain, priority, search, status],
  );

  const pag = usePagination(filtered.length);
  const pageRows = filtered.slice(pag.start, pag.end);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compliance"
        title="Controls"
        description="A table-first view of ISO/IEC 27001 readiness questions, maturity, and evidence reference confidence."
      />

      {data.sourceNotice ? (
        <section className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#5B6472]">
          {data.sourceNotice}
        </section>
      ) : null}

      <div
        className={`grid grid-cols-1 gap-6 ${selected ? "lg:grid-cols-[minmax(0,1fr)_380px]" : ""}`}
      >
        <WorkspaceCard>
          <Toolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search controls" />
            <FilterSelect
              label="Domain"
              value={domain}
              onChange={setDomain}
              options={["All", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9"]}
            />
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
                "Not applicable",
              ]}
            />
            <FilterSelect
              label="Evidence confidence"
              value={confidence}
              onChange={setConfidence}
              options={["All", "0%", "1-59%", "60-99%", "100%"]}
            />
            <FilterSelect
              label="Priority"
              value={priority}
              onChange={setPriority}
              options={["All", "critical", "high", "medium", "low"]}
            />
          </Toolbar>
          <TableWrap>
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#E5E7EB] bg-[#F8F8FA] text-xs uppercase tracking-[0.08em] text-[#6B7280]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">ID</th>
                  <th className="px-4 py-2.5 font-semibold">Control</th>
                  <th className="px-4 py-2.5 font-semibold">Domain</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">Maturity</th>
                  <th className="px-4 py-2.5 font-semibold">Evidence</th>
                  <th className="px-4 py-2.5 font-semibold">Owner</th>
                  <th className="px-4 py-2.5 font-semibold">ISO reference</th>
                  <th className="px-4 py-2.5 font-semibold">Last update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {pageRows.map((control) => (
                  <tr
                    key={control.id}
                    className={`cursor-pointer align-top transition hover:bg-[#FAFAFB] ${
                      selected?.id === control.id ? "bg-[#F6F0FF]" : ""
                    }`}
                    onClick={() => setSelected(control)}
                  >
                    <td className="px-4 py-3 text-xs font-semibold text-[#7C3AED] whitespace-nowrap">
                      {control.controlCode}
                    </td>
                    <td className="min-w-[200px] max-w-[320px] px-4 py-3">
                      <p className="font-medium text-[#111827] line-clamp-2">{control.question}</p>
                    </td>
                    <td className="px-4 py-3 text-[#5B6472] whitespace-nowrap">
                      {control.domainId} - {domainLabel(control.domainId)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={statusTone(control.status)}>{control.status}</StatusPill>
                    </td>
                    <td className="px-4 py-3 text-[#5B6472] text-xs">{control.maturityLabel}</td>
                    <td className="px-4 py-3 font-medium text-[#111827] text-xs">
                      {control.evidenceConfidence}%
                    </td>
                    <td className="px-4 py-3 text-[#5B6472] text-xs">{control.owner}</td>
                    <td className="px-4 py-3 text-[#5B6472] text-xs">{control.isoReference}</td>
                    <td className="px-4 py-3 text-[#5B6472] text-xs">{control.lastUpdate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          {filtered.length === 0 ? (
            <div className="border-t border-[#E5E7EB] p-6 text-sm text-[#6B7280]">
              No controls match the current filters.
            </div>
          ) : null}
          <Pagination
            page={pag.page}
            pageSize={pag.pageSize}
            total={filtered.length}
            onPageChange={pag.setPage}
            onPageSizeChange={pag.setPageSize}
          />
        </WorkspaceCard>

        {/* ── Detail Side Panel ── */}
        <SidePanel
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected?.question ?? ""}
          subtitle={selected ? `Frameworks / ISO 27001 / ${selected.controlCode}` : undefined}
          badges={
            selected ? (
              <>
                <StatusPill tone="purple">
                  {selected.domainId} {selected.category}
                </StatusPill>
                <StatusPill tone="blue">ISO/IEC 27001:2022</StatusPill>
                <StatusPill
                  tone={
                    selected.priority === "critical" || selected.priority === "high"
                      ? "red"
                      : "gray"
                  }
                >
                  {selected.priority} priority
                </StatusPill>
              </>
            ) : undefined
          }
        >
          {selected ? (
            <>
              <WorkspaceCard className="p-4">
                <h3 className="text-sm font-semibold text-[#111827]">Overview</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <PanelRow label="Owner" value={selected.owner} />
                  <PanelRow label="Status" value={selected.status} />
                  <PanelRow label="Maturity" value={selected.maturityLabel} />
                  <PanelRow label="Evidence confidence" value={`${selected.evidenceConfidence}%`} />
                  <PanelRow label="ISO reference" value={selected.isoReference} />
                </dl>
              </WorkspaceCard>

              <WorkspaceCard className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[#111827]">Evidence references</h3>
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-md border border-[#D1D5DB] px-3 py-1.5 text-xs font-semibold text-[#9CA3AF]"
                  >
                    Track reference
                  </button>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-[#E5E7EB] text-xs uppercase tracking-[0.08em] text-[#6B7280]">
                      <tr>
                        <th className="py-2 pr-4 font-semibold">Evidence reference</th>
                        <th className="py-2 pr-4 font-semibold">Description</th>
                        <th className="py-2 pr-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.expectedEvidence.length
                        ? selected.expectedEvidence
                        : [`Evidence reference for ${selected.controlCode}`]
                      ).map((reference) => (
                        <tr key={reference} className="border-b border-[#E5E7EB]">
                          <td className="py-2.5 pr-4 font-medium text-[#111827] text-xs">
                            {reference}
                          </td>
                          <td className="py-2.5 pr-4 text-[#5B6472] text-xs">
                            Reference tracking only
                          </td>
                          <td className="py-2.5 pr-4">
                            <StatusPill tone={evidenceTone(selected.evidenceStatus)}>
                              {selected.evidenceStatus}
                            </StatusPill>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </WorkspaceCard>

              <WorkspaceCard className="p-4">
                <h3 className="text-sm font-semibold text-[#111827]">Recommended actions</h3>
                <p className="mt-2 text-sm text-[#5B6472]">
                  Track stronger evidence references to raise confidence above 60%.
                </p>
              </WorkspaceCard>

              <WorkspaceCard className="p-4">
                <h3 className="text-sm font-semibold text-[#111827]">History</h3>
                <p className="mt-2 text-sm text-[#5B6472]">
                  Last update: {selected.lastUpdate}. Detailed history is planned for a later
                  release.
                </p>
              </WorkspaceCard>
            </>
          ) : null}
        </SidePanel>
      </div>
    </div>
  );
}

function PanelRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[#6B7280]">{label}</dt>
      <dd className="text-right font-medium text-[#111827]">{value}</dd>
    </div>
  );
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
