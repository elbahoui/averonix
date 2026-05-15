import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AgentScanForm } from "@/components/agent/AgentScanForm";
import { AgentScanProgress } from "@/components/agent/AgentScanProgress";
import {
  EmptyState,
  FilterSelect,
  MetricCard,
  PageHeader,
  SearchInput,
  StatusPill,
  TableWrap,
  Toolbar,
  WorkspaceCard,
} from "@/components/compliance/WorkspacePrimitives";
import { DashboardShell, useDashboard } from "@/components/layout/DashboardShell";
import { groupMappedEvidence } from "@/lib/agent/grouped-evidence";
import {
  getAgentScanHistory,
  getLastAgentScan,
  runAgentScan,
  type AgentCheckResult,
  type AgentProgressStatus,
  type AgentProgressStep,
  type AgentScanInput,
  type AgentScanResult,
} from "@/lib/agent";
import { getLatestPersistedAgentScan } from "@/lib/agent/api";
import {
  getBackendStatus,
  initialBackendStatus,
  scanBackendModeLabel,
  scanBackendStatusLabel,
  type BackendConnectionStatus,
} from "@/lib/backend-status";
import {
  canUseDevelopmentFallback,
  DEVELOPMENT_FALLBACK_NOTICE,
  WORKSPACE_UNAVAILABLE_NOTICE,
} from "@/lib/runtime";
import { normalizeSector } from "@/lib/sector";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Agent Evidence - Averonix" },
      {
        name: "description",
        content:
          "Run safe external checks to collect observable security signals for ISO/IEC 27001 readiness.",
      },
    ],
  }),
  component: () => (
    <DashboardShell>
      <ScanPage />
    </DashboardShell>
  ),
});

const INITIAL_PROGRESS: Record<AgentProgressStep, AgentProgressStatus> = {
  normalize: "pending",
  https: "pending",
  headers: "pending",
  dns: "pending",
  map: "pending",
  findings: "pending",
};

function ScanPage() {
  const { company } = useDashboard();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(INITIAL_PROGRESS);
  const [result, setResult] = useState<AgentScanResult | null>(null);
  const [history, setHistory] = useState<AgentScanResult[]>([]);
  const [backendStatus, setBackendStatus] = useState<BackendConnectionStatus>(initialBackendStatus);
  const [scanError, setScanError] = useState<string | null>(null);
  const [sourceNotice, setSourceNotice] = useState<string | null>(null);

  useEffect(() => {
    const canUseLocalFallback = canUseDevelopmentFallback();
    setResult(canUseLocalFallback ? getLastAgentScan() : null);
    setHistory(canUseLocalFallback ? getAgentScanHistory() : []);
    setSourceNotice(
      company?.organizationId
        ? null
        : canUseLocalFallback
          ? DEVELOPMENT_FALLBACK_NOTICE
          : WORKSPACE_UNAVAILABLE_NOTICE,
    );
    getBackendStatus().then((status) => setBackendStatus(status.status));
    if (company?.organizationId) {
      getLatestPersistedAgentScan(company.organizationId).then((scan) => {
        if (scan) {
          setResult(scan);
          setSourceNotice("Saved to workspace");
        } else if (canUseDevelopmentFallback()) {
          setResult(getLastAgentScan());
          setHistory(getAgentScanHistory());
          setSourceNotice(DEVELOPMENT_FALLBACK_NOTICE);
        }
      });
    }
  }, [company?.organizationId]);

  async function handleSubmit(input: AgentScanInput) {
    setScanError(null);
    if (!company?.organizationId) {
      setScanError("Workspace context is missing. Please complete onboarding.");
      return;
    }
    setRunning(true);
    setProgress(INITIAL_PROGRESS);
    setResult(null);
    try {
      const scan = await runAgentScan(
        { ...input, organizationId: company.organizationId },
        (step, status) => {
          setProgress((prev) => ({ ...prev, [step]: status }));
        },
      );
      const persisted = await getLatestPersistedAgentScan(company.organizationId);
      if (persisted) {
        setResult(persisted);
        setSourceNotice("Saved to workspace");
      } else if (canUseDevelopmentFallback()) {
        setResult(scan);
        setSourceNotice("Draft saved locally");
      } else {
        setResult(null);
        setSourceNotice(WORKSPACE_UNAVAILABLE_NOTICE);
        setScanError("Agent scan completed, but workspace persistence could not be verified.");
      }
      setHistory(canUseDevelopmentFallback() ? getAgentScanHistory() : []);
    } finally {
      setRunning(false);
    }
  }

  const showResults = useMemo(() => result && !running, [result, running]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Readiness"
        title="Agent Evidence"
        description="Run safe external checks against a public domain. Agent Evidence checks external technical signals only and does not replace Manual Assessment."
      />

      <WorkspaceCard className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#111827]">
              {scanBackendModeLabel(backendStatus)}
            </p>
            <p className="mt-1 text-sm text-[#6B7280]">{scanBackendStatusLabel(backendStatus)}</p>
          </div>
          <StatusPill tone={backendStatus === "connected" ? "green" : "amber"}>
            {backendStatus === "connected" ? "Backend Agent active" : "Backend unavailable"}
          </StatusPill>
        </div>
      </WorkspaceCard>

      {sourceNotice ? (
        <section className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#5B6472]">
          {sourceNotice}
        </section>
      ) : null}

      {scanError ? (
        <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {scanError}
        </section>
      ) : null}

      <AgentScanForm
        running={running}
        defaultDomain={company?.domain ?? ""}
        defaultCompany={company?.name ?? ""}
        defaultSector={normalizeSector(company?.sector)}
        onSubmit={(input) => handleSubmit({ ...input, organizationId: company?.organizationId })}
      />

      {(running || result) && <AgentScanProgress state={progress} />}

      {!running && !result ? (
        <EmptyState
          title="No Agent Evidence scan has been run yet."
          description="Run Agent Evidence Scan to collect external signals. Coverage remains partial and Manual Assessment is still required."
          actionLabel={undefined}
        />
      ) : null}

      {showResults && result ? <AgentResults result={result} /> : null}

      {history.length > 0 ? (
        <WorkspaceCard className="p-4">
          <h2 className="text-lg font-semibold text-[#111827]">Recent scans</h2>
          <div className="mt-3 divide-y divide-[#E5E7EB]">
            {history.map((scan) => (
              <div key={scan.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-[#111827]">{scan.target.domain}</p>
                  <p className="text-xs text-[#6B7280]">
                    {new Date(scan.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#6B7280]">
                    Signal {scan.summary.verifiedSignalScore} - Confidence{" "}
                    {scan.summary.evidenceConfidence}% - {scan.summary.criticalFindings} critical
                  </span>
                  <button
                    type="button"
                    onClick={() => setResult(scan)}
                    className="rounded-md border border-[#D1D5DB] px-3 py-1.5 text-xs font-semibold text-[#374151] transition hover:border-[#7C3AED]/40 hover:text-[#7C3AED]"
                  >
                    Load
                  </button>
                </div>
              </div>
            ))}
          </div>
        </WorkspaceCard>
      ) : null}
    </div>
  );
}

function AgentResults({ result }: { result: AgentScanResult }) {
  const totalChecks =
    result.summary.passedChecks +
    result.summary.warningChecks +
    result.summary.failedChecks +
    result.summary.notChecked;
  const checked = totalChecks - result.summary.notChecked;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Domain"
          value={result.target.domain}
          subtext={`Last scan ${new Date(result.createdAt).toLocaleString()}`}
          tone="purple"
        />
        <MetricCard
          label="External Signal Score"
          value={`${result.summary.verifiedSignalScore}/100`}
          subtext="Excludes unchecked items"
          tone={result.summary.failedChecks ? "red" : "green"}
          progress={result.summary.verifiedSignalScore}
        />
        <MetricCard
          label="Signal Confidence"
          value={`${result.summary.evidenceConfidence}%`}
          subtext="Verified coverage of checks"
          tone={result.summary.evidenceConfidence >= 60 ? "green" : "amber"}
          progress={result.summary.evidenceConfidence}
        />
        <MetricCard
          label="Checked"
          value={`${checked}/${totalChecks}`}
          subtext={`${result.summary.notChecked} not checked`}
          tone="blue"
        />
        <MetricCard
          label="Critical findings"
          value={String(result.summary.criticalFindings)}
          subtext="External technical findings"
          tone={result.summary.criticalFindings ? "red" : "green"}
        />
      </section>

      <ChecksTable checks={result.checks} />
      <MappedEvidenceTable result={result} />
      <DomainCoverageTable result={result} />
      <WorkspaceCard className="p-4">
        <h2 className="text-lg font-semibold text-[#111827]">Limitations</h2>
        <ul className="mt-3 space-y-2 text-sm text-[#5B6472]">
          {result.limitations.map((limitation) => (
            <li key={limitation} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C3AED]" />
              <span>{limitation}</span>
            </li>
          ))}
        </ul>
      </WorkspaceCard>
    </div>
  );
}

function ChecksTable({ checks }: { checks: AgentCheckResult[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [signalType, setSignalType] = useState("All");
  const [domain, setDomain] = useState("All");
  const filtered = checks.filter((check) => {
    const matchesSearch =
      !search || `${check.name} ${check.evidence}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "All" || agentStatusLabel(check.status) === status;
    const matchesSignal =
      signalType === "All" || signalTypeFromCheck(check).toLowerCase() === signalType.toLowerCase();
    const matchesDomain = domain === "All" || check.mappedDomains.includes(domain);
    return matchesSearch && matchesStatus && matchesSignal && matchesDomain;
  });

  return (
    <WorkspaceCard>
      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search checks" />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            "All",
            "External signal passed",
            "Needs attention",
            "Failed",
            "Not checked",
            "Manual required",
          ]}
        />
        <FilterSelect
          label="Signal type"
          value={signalType}
          onChange={setSignalType}
          options={["All", "HTTPS", "TLS", "DNS", "Email", "Headers", "Cookies", "Exposure"]}
        />
        <FilterSelect
          label="Domain mapping"
          value={domain}
          onChange={setDomain}
          options={["All", "D7", "D8", "D9"]}
        />
      </Toolbar>
      <TableWrap>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#E5E7EB] bg-[#F8F8FA] text-xs uppercase tracking-[0.08em] text-[#6B7280]">
            <tr>
              <th className="px-4 py-3 font-semibold">Check</th>
              <th className="px-4 py-3 font-semibold">Signal type</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Finding</th>
              <th className="px-4 py-3 font-semibold">Mapped control</th>
              <th className="px-4 py-3 font-semibold">Coverage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {filtered.map((check) => (
              <tr key={check.id} className="align-top">
                <td className="min-w-[220px] px-4 py-4 font-medium text-[#111827]">{check.name}</td>
                <td className="px-4 py-4 text-[#5B6472]">{signalTypeFromCheck(check)}</td>
                <td className="px-4 py-4">
                  <StatusPill tone={agentStatusTone(check.status)}>
                    {agentStatusLabel(check.status)}
                  </StatusPill>
                </td>
                <td className="min-w-[320px] px-4 py-4 text-[#5B6472]">{check.evidence}</td>
                <td className="px-4 py-4 text-[#5B6472]">
                  {check.mappedQuestionIds.length
                    ? check.mappedQuestionIds.join(", ")
                    : "Manual required"}
                </td>
                <td className="px-4 py-4 text-[#5B6472]">
                  {check.mappedDomains.length ? check.mappedDomains.join(", ") : "Partial"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </WorkspaceCard>
  );
}

function MappedEvidenceTable({ result }: { result: AgentScanResult }) {
  const grouped = groupMappedEvidence(result.mappedQuestions, result.checks);
  if (!grouped.length) return null;

  return (
    <WorkspaceCard>
      <div className="border-b border-[#E5E7EB] p-4">
        <h2 className="text-lg font-semibold text-[#111827]">Mapped evidence</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          External signals are grouped by readiness question. Manual Assessment is required for full
          interpretation.
        </p>
      </div>
      <TableWrap>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#E5E7EB] bg-[#F8F8FA] text-xs uppercase tracking-[0.08em] text-[#6B7280]">
            <tr>
              <th className="px-4 py-3 font-semibold">Control</th>
              <th className="px-4 py-3 font-semibold">External signal status</th>
              <th className="px-4 py-3 font-semibold">Coverage</th>
              <th className="px-4 py-3 font-semibold">Manual required</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {grouped.map((group) => (
              <tr key={group.questionId} className="align-top">
                <td className="min-w-[360px] px-4 py-4">
                  <p className="text-xs font-semibold text-[#7C3AED]">
                    {group.controlCode ?? group.questionId}
                  </p>
                  <p className="mt-1 font-medium text-[#111827]">{group.question}</p>
                </td>
                <td className="px-4 py-4">
                  <StatusPill
                    tone={
                      group.status === "passed"
                        ? "green"
                        : group.status === "failed"
                          ? "red"
                          : "amber"
                    }
                  >
                    {group.status === "passed"
                      ? "External signal passed"
                      : group.status === "not_checked"
                        ? "Not checked"
                        : group.status === "partial"
                          ? "Partial external signal"
                          : "Failed"}
                  </StatusPill>
                </td>
                <td className="px-4 py-4 text-[#5B6472]">
                  {group.score}% score - {group.confidence}% confidence
                </td>
                <td className="px-4 py-4 text-[#5B6472]">Yes</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </WorkspaceCard>
  );
}

function DomainCoverageTable({ result }: { result: AgentScanResult }) {
  const domainIds = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9"];
  return (
    <WorkspaceCard>
      <div className="border-b border-[#E5E7EB] p-4">
        <h2 className="text-lg font-semibold text-[#111827]">Domain coverage</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          D7, D8, and D9 can receive partial external signals. D1-D6 require guided assessment or
          future integrations.
        </p>
      </div>
      <TableWrap>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#E5E7EB] bg-[#F8F8FA] text-xs uppercase tracking-[0.08em] text-[#6B7280]">
            <tr>
              <th className="px-4 py-3 font-semibold">Domain</th>
              <th className="px-4 py-3 font-semibold">Coverage</th>
              <th className="px-4 py-3 font-semibold">Signal score</th>
              <th className="px-4 py-3 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {domainIds.map((domainId) => {
              const coverage = result.domainCoverage[domainId];
              const partial = coverage?.score !== null && coverage?.score !== undefined;
              return (
                <tr key={domainId}>
                  <td className="px-4 py-4 font-medium text-[#111827]">{domainId}</td>
                  <td className="px-4 py-4">
                    <StatusPill tone={partial ? "blue" : "gray"}>
                      {partial ? "Partial external signal" : "Assessment or integration"}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-4 text-[#5B6472]">
                    {partial
                      ? `${coverage.score} - confidence ${coverage.confidence}%`
                      : "Not checked"}
                  </td>
                  <td className="min-w-[320px] px-4 py-4 text-[#5B6472]">
                    {coverage?.notes ?? "Requires guided assessment or future integration."}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableWrap>
    </WorkspaceCard>
  );
}

function agentStatusLabel(status: AgentCheckResult["status"]): string {
  if (status === "passed") return "External signal passed";
  if (status === "warning") return "Needs attention";
  if (status === "failed") return "Failed";
  return "Not checked";
}

function agentStatusTone(
  status: AgentCheckResult["status"],
): "green" | "amber" | "red" | "purple" | "gray" | "blue" {
  if (status === "passed") return "green";
  if (status === "warning") return "amber";
  if (status === "failed") return "red";
  return "gray";
}

function signalTypeFromCheck(check: AgentCheckResult): string {
  const text = `${check.id} ${check.name}`.toLowerCase();
  if (text.includes("https")) return "HTTPS";
  if (text.includes("tls") || text.includes("certificate")) return "TLS";
  if (text.includes("dns")) return "DNS";
  if (
    text.includes("mx") ||
    text.includes("spf") ||
    text.includes("dmarc") ||
    text.includes("dkim")
  ) {
    return "Email";
  }
  if (text.includes("header") || text.includes("hsts") || text.includes("policy")) return "Headers";
  if (text.includes("cookie")) return "Cookies";
  if (text.includes("exposed")) return "Exposure";
  return "External signal";
}
