import { useEffect, useState } from "react";
import type { AgentScanInput, CompanySector } from "@/lib/agent";
import { normalizeDomain } from "@/lib/agent";
import { normalizeSector } from "@/lib/sector";

const SECTORS: { value: CompanySector; label: string }[] = [
  { value: "saas", label: "SaaS" },
  { value: "fintech", label: "Fintech" },
  { value: "healthcare", label: "Healthcare" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "education", label: "Education" },
  { value: "telecom", label: "Telecom" },
  { value: "professional_services", label: "Professional services" },
  { value: "general_sme", label: "General SME" },
];

export function AgentScanForm({
  defaultDomain,
  defaultCompany,
  defaultSector,
  running,
  onSubmit,
}: {
  defaultDomain?: string;
  defaultCompany?: string;
  defaultSector?: string;
  running: boolean;
  onSubmit: (input: AgentScanInput) => void;
}) {
  const [domain, setDomain] = useState(defaultDomain ?? "");
  const [companyName, setCompanyName] = useState(defaultCompany ?? "");
  const [sector, setSector] = useState<CompanySector>(normalizeSector(defaultSector));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultDomain) setDomain(defaultDomain);
  }, [defaultDomain]);
  useEffect(() => {
    if (defaultCompany) setCompanyName(defaultCompany);
  }, [defaultCompany]);
  useEffect(() => {
    if (defaultSector) setSector(normalizeSector(defaultSector));
  }, [defaultSector]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const t = normalizeDomain(domain);
      onSubmit({
        domain: t.domain,
        companyName: companyName.trim() || undefined,
        sector: normalizeSector(sector),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid domain.");
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="font-display text-base font-bold text-foreground">Run an Agent scan</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Safe external checks against a public domain. No intrusive scanning.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Company
          </span>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme SARL"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Domain
          </span>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            required
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
        <label className="block">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Sector
          </span>
          <select
            value={sector}
            onChange={(e) => setSector(normalizeSector(e.target.value))}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {SECTORS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs text-[#991B1B]">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Agent Evidence covers a small but valuable subset of ISO/IEC 27001 readiness.
        </p>
        <button
          type="submit"
          disabled={running}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-deep disabled:opacity-60"
        >
          {running ? "Scanning…" : "Start Agent scan"}
        </button>
      </div>
    </form>
  );
}
