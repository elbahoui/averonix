import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { fetchCompany, saveCompany, useAuthSession, type StoredCompany } from "@/lib/storage";
import { normalizeSector, SECTOR_LABELS, type CompanySector } from "@/lib/sector";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding — Averonix" },
      {
        name: "description",
        content: "Set up your company information security profile in 5 quick steps.",
      },
    ],
  }),
  component: OnboardingPage,
});

const STEPS = [
  {
    id: 1,
    label: "Company",
    title: "Tell us about your company",
    subtitle: "We'll personalize your readiness checks based on your context.",
  },
  {
    id: 2,
    label: "Context",
    title: "What's your business context?",
    subtitle: "Helps us weight controls relevant to your sector.",
  },
  {
    id: 3,
    label: "Security role",
    title: "What is your security role?",
    subtitle: "Different roles face different ISMS obligations.",
  },
  {
    id: 4,
    label: "Tools",
    title: "What tools do you use?",
    subtitle: "Select the platforms in scope of your ISMS.",
  },
  {
    id: 5,
    label: "Data",
    title: "What data do you handle?",
    subtitle: "Pick the categories of information assets you manage.",
  },
] as const;

const SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];
const SECTORS: Array<{ value: CompanySector; label: string }> = [
  { value: "saas", label: SECTOR_LABELS.saas },
  { value: "fintech", label: SECTOR_LABELS.fintech },
  { value: "healthcare", label: "Healthtech" },
  { value: "ecommerce", label: SECTOR_LABELS.ecommerce },
  { value: "education", label: SECTOR_LABELS.education },
  { value: "telecom", label: SECTOR_LABELS.telecom },
  { value: "professional_services", label: SECTOR_LABELS.professional_services },
  { value: "general_sme", label: SECTOR_LABELS.general_sme },
];
const ROLES = [
  {
    id: "owner",
    label: "Security owner",
    desc: "We define and run the information security program internally.",
  },
  {
    id: "operator",
    label: "IT / Operations lead",
    desc: "We operate systems and apply controls day to day.",
  },
  {
    id: "executive",
    label: "Executive sponsor",
    desc: "We sponsor the ISMS and approve risk decisions.",
  },
  { id: "unsure", label: "Not sure yet", desc: "We need help figuring this out." },
];
const TOOLS = [
  "Google Workspace",
  "Microsoft 365",
  "AWS",
  "GCP",
  "Azure",
  "GitHub",
  "Stripe",
  "Other",
];
const DATA_TYPES = [
  "Customer information",
  "Employee records",
  "Source code & IP",
  "Financial records",
  "Operational data",
  "Third-party / vendor data",
  "None of the above",
];

const inputClass =
  "h-[52px] w-full rounded-[10px] border-[1.5px] border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-mono-label">{children}</span>;
}

function SelectionCard({
  active,
  onClick,
  title,
  desc,
  multi = false,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc?: string;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border-[1.5px] p-4 text-left transition ${
        active
          ? "border-primary bg-surface-soft"
          : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:bg-[oklch(0.99_0.02_305)]"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-${multi ? "[6px]" : "full"} border-[1.5px] ${
          active ? "border-primary bg-primary" : "border-border bg-card"
        }`}
      >
        {active && (
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <div className="flex-1">
        <div className="font-medium text-foreground">{title}</div>
        {desc && <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>}
      </div>
    </button>
  );
}

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuthSession();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Partial<StoredCompany>>({
    name: "",
    domain: "",
    city: "",
    country: "Morocco",
    size: "",
    sector: "",
    description: "",
    privacyRole: "",
    tools: [],
    dataTypes: [],
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    fetchCompany(user.id)
      .then((existing) => {
        if (existing) setData((d) => ({ ...d, ...existing }));
      })
      .catch(() => {});
  }, [loading, user, navigate]);

  function update<K extends keyof StoredCompany>(k: K, v: StoredCompany[K]) {
    setData((d) => ({ ...d, [k]: v }));
  }

  function toggle(k: "tools" | "dataTypes", v: string) {
    setData((d) => {
      const arr = (d[k] ?? []) as string[];
      return { ...d, [k]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });
  }

  const canContinue = useMemo(() => {
    if (step === 1) return !!data.name && !!data.domain && !!data.size && !!data.country;
    if (step === 2) return !!data.sector;
    if (step === 3) return !!data.privacyRole;
    if (step === 4) return (data.tools?.length ?? 0) > 0;
    if (step === 5) return (data.dataTypes?.length ?? 0) > 0;
    return false;
  }, [step, data]);

  async function next() {
    if (!canContinue || !user) return;
    if (step < 5) {
      setStep(step + 1);
      // Persist progress without marking complete
      saveCompany(user.id, { ...data, sector: normalizeSector(data.sector) }, false).catch(
        () => {},
      );
    } else {
      setSaving(true);
      try {
        await saveCompany(user.id, { ...data, sector: normalizeSector(data.sector) }, true);
        setDone(true);
        setTimeout(() => navigate({ to: "/dashboard" }), 1500);
      } finally {
        setSaving(false);
      }
    }
  }

  function back() {
    if (step > 1) setStep(step - 1);
  }

  const progress = (step / 5) * 100;

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-glow">
            <svg
              viewBox="0 0 24 24"
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="mt-6 font-display text-4xl font-extrabold text-foreground">
            Your profile is ready.
          </h1>
          <p className="mt-3 text-muted-foreground">Setting up your readiness workspace…</p>
          <div className="mt-6 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 animate-[pulse-dot_1.2s_ease-in-out_infinite] rounded-full bg-primary"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const current = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-background">
      {/* top progress bar */}
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-border">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo variant="horizontal" size="md" showBeta />
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {current.label}
          </span>
        </div>
      </header>

      {/* steps */}
      <div className="mx-auto max-w-6xl px-6 pt-10">
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => {
            const completed = step > s.id;
            const isCurrent = step === s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                    completed
                      ? "bg-primary text-white"
                      : isCurrent
                        ? "border-2 border-primary bg-card text-primary animate-[pulse-soft_2s_ease-in-out_infinite]"
                        : "border border-border bg-surface-soft text-muted-foreground"
                  }`}
                >
                  {completed ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    s.id
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="mx-2 h-0.5 w-10 overflow-hidden rounded-full bg-border sm:w-16">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: completed ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Step {step} of 5 · {current.label}
        </p>
      </div>

      {/* main content */}
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <section
            key={step}
            className="rounded-2xl border border-border bg-card p-8 shadow-soft sm:p-12 animate-[fade-up_0.4s_ease-out_both]"
          >
            <span className="inline-block rounded-full bg-surface-soft px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-primary">
              Step {step} of 5
            </span>
            <h1 className="mt-4 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
              {current.title}
            </h1>
            <p className="mt-2 text-muted-foreground">{current.subtitle}</p>

            <div className="mt-8 space-y-6">
              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <label className="block">
                      <Label>Company name</Label>
                      <input
                        className={`${inputClass} mt-2`}
                        value={data.name ?? ""}
                        onChange={(e) => update("name", e.target.value)}
                        placeholder="Atlas Cloud SARL"
                      />
                    </label>
                    <label className="block">
                      <Label>Domain</Label>
                      <input
                        className={`${inputClass} mt-2`}
                        value={data.domain ?? ""}
                        onChange={(e) => update("domain", e.target.value)}
                        placeholder="atlascloud.ma"
                      />
                    </label>
                    <label className="block">
                      <Label>City</Label>
                      <input
                        className={`${inputClass} mt-2`}
                        value={data.city ?? ""}
                        onChange={(e) => update("city", e.target.value)}
                        placeholder="Casablanca"
                      />
                    </label>
                    <label className="block">
                      <Label>Country</Label>
                      <input
                        className={`${inputClass} mt-2`}
                        value={data.country ?? ""}
                        onChange={(e) => update("country", e.target.value)}
                        placeholder="Morocco"
                      />
                    </label>
                  </div>
                  <div>
                    <Label>Company size</Label>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {SIZES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => update("size", s)}
                          className={`rounded-[10px] border-[1.5px] py-3 text-sm font-medium transition ${
                            data.size === s
                              ? "border-primary bg-surface-soft text-primary"
                              : "border-border bg-card text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <Label>Sector</Label>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {SECTORS.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => update("sector", s.value)}
                          className={`rounded-[10px] border-[1.5px] py-3 text-sm font-medium transition ${
                            normalizeSector(data.sector) === s.value
                              ? "border-primary bg-surface-soft text-primary"
                              : "border-border bg-card text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="block">
                    <Label>Brief description (optional)</Label>
                    <textarea
                      rows={4}
                      className="mt-2 w-full rounded-[10px] border-[1.5px] border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]"
                      placeholder="A short sentence about what your company does."
                      value={data.description ?? ""}
                      onChange={(e) => update("description", e.target.value)}
                    />
                  </label>
                </>
              )}

              {step === 3 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {ROLES.map((r) => (
                    <SelectionCard
                      key={r.id}
                      title={r.label}
                      desc={r.desc}
                      active={data.privacyRole === r.id}
                      onClick={() => update("privacyRole", r.id)}
                    />
                  ))}
                </div>
              )}

              {step === 4 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {TOOLS.map((t) => (
                    <SelectionCard
                      key={t}
                      title={t}
                      multi
                      active={(data.tools ?? []).includes(t)}
                      onClick={() => toggle("tools", t)}
                    />
                  ))}
                </div>
              )}

              {step === 5 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {DATA_TYPES.map((t) => (
                    <SelectionCard
                      key={t}
                      title={t}
                      multi
                      active={(data.dataTypes ?? []).includes(t)}
                      onClick={() => toggle("dataTypes", t)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-10 flex items-center justify-between">
              <button
                type="button"
                onClick={back}
                disabled={step === 1}
                className="text-sm text-muted-foreground transition hover:text-primary disabled:opacity-40"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={next}
                disabled={!canContinue || saving}
                className="inline-flex h-[52px] items-center justify-center rounded-[10px] bg-primary px-6 font-display text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-[var(--primary-deep)] hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {step === 5 ? (saving ? "Saving…" : "Save Profile") : "Continue →"}
              </button>
            </div>
          </section>

          {/* sticky sidebar */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-7 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-mono-label">Your profile</span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-soft text-primary">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4z" />
                  </svg>
                </span>
              </div>
              <dl className="mt-5 divide-y divide-border text-sm">
                {[
                  ["Company", data.name],
                  ["Domain", data.domain],
                  ["City", data.city],
                  ["Country", data.country],
                  ["Size", data.size],
                  ["Sector", data.sector ? SECTOR_LABELS[normalizeSector(data.sector)] : ""],
                  ["Security role", data.privacyRole],
                  ["Tools", (data.tools ?? []).length ? `${data.tools!.length} selected` : ""],
                  [
                    "Data types",
                    (data.dataTypes ?? []).length ? `${data.dataTypes!.length} selected` : "",
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2.5">
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {k}
                    </dt>
                    <dd className={v ? "text-foreground" : "text-border"}>{v || "—"}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex items-start gap-2 rounded-[10px] border border-border bg-surface-soft p-3">
                <svg
                  viewBox="0 0 24 24"
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <p className="text-xs text-muted-foreground">
                  No raw sensitive data is required. Averonix is a readiness tool — not a
                  certification body.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
