import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DashboardShell, useDashboard } from "@/components/layout/DashboardShell";
import {
  EmptyState,
  FilterSelect,
  PageHeader,
  SearchInput,
  StatusPill,
  TableWrap,
  Toolbar,
  WorkspaceCard,
} from "@/components/compliance/WorkspacePrimitives";
import {
  buildComplianceControlRows,
  buildEvidenceReferenceRows,
  type EvidenceReferenceRow,
} from "@/lib/compliance/workspace";
import { useComplianceWorkspaceData } from "@/lib/compliance/useWorkspaceData";

export const Route = createFileRoute("/evidence-references")({
  head: () => ({
    meta: [
      { title: "Evidence references - Averonix" },
      {
        name: "description",
        content: "Track evidence references without storing raw sensitive evidence.",
      },
    ],
  }),
  component: EvidenceReferencesPage,
});

function EvidenceReferencesPage() {
  return (
    <DashboardShell>
      <EvidenceReferencesInner />
    </DashboardShell>
  );
}

function EvidenceReferencesInner() {
  const { company } = useDashboard();
  const data = useComplianceWorkspaceData(company);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [domain, setDomain] = useState("All");
  const [framework, setFramework] = useState("All");
  const [owner, setOwner] = useState("All");
  const [confidence, setConfidence] = useState("All");
  const controls = buildComplianceControlRows({
    sector: company?.sector,
    responses: data.responses,
    result: data.result,
  });
  const rows = buildEvidenceReferenceRows({ controls, agent: data.agent });

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const haystack = `${row.reference} ${row.linkedControl} ${row.domainId} ${row.owner}`;
        const matchesSearch = !search || haystack.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = status === "All" || row.status === status;
        const matchesDomain = domain === "All" || row.domainId === domain;
        const matchesFramework = framework === "All" || row.framework === framework;
        const matchesOwner = owner === "All" || row.owner === owner;
        const matchesConfidence =
          confidence === "All" ||
          (confidence === "0%" && row.confidence === 0) ||
          (confidence === "1-59%" && row.confidence > 0 && row.confidence < 60) ||
          (confidence === "60-99%" && row.confidence >= 60 && row.confidence < 100) ||
          (confidence === "100%" && row.confidence === 100);
        return (
          matchesSearch &&
          matchesStatus &&
          matchesDomain &&
          matchesFramework &&
          matchesOwner &&
          matchesConfidence
        );
      }),
    [confidence, domain, framework, owner, rows, search, status],
  );

  const owners = Array.from(new Set(rows.map((row) => row.owner))).sort();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Compliance"
        title="Evidence references"
        description="Track references to evidence without implying raw sensitive file storage. No raw sensitive data is required."
        actions={
          <button
            type="button"
            disabled
            className="inline-flex min-h-10 cursor-not-allowed items-center justify-center rounded-md border border-[#D1D5DB] bg-white px-4 text-sm font-semibold text-[#9CA3AF]"
          >
            Track reference
          </button>
        }
      />

      {data.sourceNotice ? (
        <section className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#5B6472]">
          {data.sourceNotice}
        </section>
      ) : null}

      <WorkspaceCard>
        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search evidence references"
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              "All",
              "Missing",
              "Needs reference",
              "Referenced",
              "Strong reference",
              "Agent signal only",
              "Not applicable",
            ]}
          />
          <FilterSelect
            label="Domain"
            value={domain}
            onChange={setDomain}
            options={["All", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9"]}
          />
          <FilterSelect
            label="Framework"
            value={framework}
            onChange={setFramework}
            options={["All", "ISO/IEC 27001:2022"]}
          />
          <FilterSelect
            label="Owner"
            value={owner}
            onChange={setOwner}
            options={["All", ...owners]}
          />
          <FilterSelect
            label="Confidence"
            value={confidence}
            onChange={setConfidence}
            options={["All", "0%", "1-59%", "60-99%", "100%"]}
          />
        </Toolbar>
        {rows.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No evidence references tracked yet."
              description="Complete Manual Assessment or run Agent Evidence Scan to create the first reference view."
              actionLabel="Start assessment"
              to="/assessment"
            />
          </div>
        ) : (
          <EvidenceTable rows={filtered} />
        )}
      </WorkspaceCard>
    </div>
  );
}

function EvidenceTable({ rows }: { rows: EvidenceReferenceRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="p-6 text-sm text-[#6B7280]">No evidence references match the filters.</div>
    );
  }

  return (
    <TableWrap>
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-[#E5E7EB] bg-[#F8F8FA] text-xs uppercase tracking-[0.08em] text-[#6B7280]">
          <tr>
            <th className="px-4 py-3 font-semibold">Evidence reference</th>
            <th className="px-4 py-3 font-semibold">Linked control</th>
            <th className="px-4 py-3 font-semibold">Framework</th>
            <th className="px-4 py-3 font-semibold">Domain</th>
            <th className="px-4 py-3 font-semibold">Owner</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Confidence</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E7EB]">
          {rows.map((row) => (
            <tr key={row.id} className="align-top">
              <td className="min-w-[260px] px-4 py-4 font-medium text-[#111827]">
                {row.reference}
              </td>
              <td className="px-4 py-4 text-[#5B6472]">{row.linkedControl}</td>
              <td className="px-4 py-4 text-[#5B6472]">{row.framework}</td>
              <td className="px-4 py-4 text-[#5B6472]">{row.domainId}</td>
              <td className="px-4 py-4 text-[#5B6472]">{row.owner}</td>
              <td className="px-4 py-4">
                <StatusPill tone={evidenceTone(row.status)}>{row.status}</StatusPill>
              </td>
              <td className="px-4 py-4 font-medium text-[#111827]">{row.confidence}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

function evidenceTone(status: string): "green" | "amber" | "red" | "purple" | "gray" | "blue" {
  if (status === "Strong reference" || status === "Referenced") return "green";
  if (status === "Needs reference") return "amber";
  if (status === "Agent signal only") return "blue";
  if (status === "Missing") return "red";
  return "gray";
}
