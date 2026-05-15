const DISCLAIMER =
  "Averonix is an information security readiness and gap analysis tool. It does not provide ISO certification, conformity assessment, accreditation, legal advice, or official approval from ISO or any regulator. Formal certification requires qualified auditors and accredited certification bodies.";

export function AgentLimitations({ limitations }: { limitations: string[] }) {
  return (
    <section className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-5 shadow-soft">
      <h2 className="font-display text-base font-bold text-[#92400E]">Limitations</h2>
      <ul className="mt-3 space-y-1.5 text-sm text-[#78350F]">
        {limitations.map((l) => (
          <li key={l} className="flex items-start gap-2">
            <span aria-hidden>•</span>
            <span>{l}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 font-mono text-[11px] leading-relaxed text-[#78350F]">{DISCLAIMER}</p>
    </section>
  );
}
