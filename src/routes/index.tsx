import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Averonix — Security readiness made simple" },
      {
        name: "description",
        content:
          "Averonix helps Moroccan companies understand information security gaps, organize evidence, and prepare for ISO/IEC 27001 readiness without claiming certification.",
      },
      { property: "og:title", content: "Averonix — Security readiness made simple" },
      {
        property: "og:description",
        content: "Security readiness, gap analysis and evidence confidence for Moroccan SMEs.",
      },
    ],
  }),
  component: Landing,
});

const DISCLAIMER =
  "Averonix is an information security readiness and gap analysis tool. It does not provide ISO certification, conformity assessment, accreditation, legal advice, or official approval from ISO or any regulator. Formal certification requires qualified auditors and accredited certification bodies.";

function useFadeUp() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-fade]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.animationDelay = `${i * 80}ms`;
            el.classList.add("animate-[fade-up_0.6s_ease-out_both]");
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => {
      el.style.opacity = "0";
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);
}

function Navbar() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-white/80 backdrop-blur-md"
      style={{ boxShadow: "0 1px 20px rgba(124,58,237,0.06)" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Logo variant="horizontal" size="lg" showBeta imgClassName="!h-[34px] md:!h-[60px]" />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#problem" className="transition hover:text-primary">
            Problem
          </a>
          <a href="#solution" className="transition hover:text-primary">
            Solution
          </a>
          <a href="#how" className="transition hover:text-primary">
            How it works
          </a>
          <a href="#features" className="transition hover:text-primary">
            Features
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="hidden rounded-lg border border-primary/40 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/5 sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:bg-[var(--primary-deep)]"
          >
            Start Free Readiness Check
          </Link>
        </div>
      </div>
    </header>
  );
}

function ScoreRing({ value = 72 }: { value?: number }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setProgress(value), 200);
    return () => clearTimeout(t);
  }, [value]);
  const r = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;
  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={r} stroke="var(--surface-soft)" strokeWidth="12" fill="none" />
        <circle
          cx="70"
          cy="70"
          r={r}
          stroke="var(--primary)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.4s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-extrabold text-foreground">{progress}%</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Readiness
        </span>
        <span className="mt-1 text-xs text-muted-foreground">Sample view</span>
      </div>
    </div>
  );
}

function HeroMockup() {
  const bars = [
    { label: "Security Governance", value: 78, color: "var(--primary)" },
    { label: "Risk Management", value: 52, color: "var(--warning)" },
    { label: "Access Control", value: 38, color: "var(--danger)" },
    { label: "Security Controls", value: 71, color: "var(--primary)" },
  ];
  const findings = [
    { dot: "var(--danger)", text: "Missing asset inventory" },
    { dot: "var(--warning)", text: "Weak evidence for access reviews" },
    { dot: "var(--warning)", text: "Email security policy gap" },
  ];
  return (
    <div className="relative">
      <div
        className="rounded-[20px] border border-border bg-card p-6"
        style={{ boxShadow: "0 20px 60px rgba(124,58,237,0.12)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Sample readiness view
            </div>
            <div className="mt-1 font-display text-lg font-bold text-foreground">
              Atlas Cloud SARL
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft/60 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 animate-[pulse-dot_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
            Sample
          </span>
        </div>

        <div className="mt-6 flex items-center gap-6">
          <ScoreRing value={72} />
          <div className="flex-1 space-y-3">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="font-mono text-foreground">{b.value}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-soft">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${b.value}%`,
                      background: b.color,
                      transition: "width 1.2s ease-out",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Critical findings
          </div>
          <ul className="mt-3 space-y-2">
            {findings.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-sm text-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: f.dot }} />
                {f.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className="absolute -left-6 top-16 hidden rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-glow sm:block"
        style={{ animation: "float 5s ease-in-out infinite" }}
      >
        ✓ SSL checked
      </div>
      <div
        className="absolute -right-4 bottom-12 hidden rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-glow sm:block"
        style={{ animation: "float 5s ease-in-out infinite", animationDelay: "1.5s" }}
      >
        ⚡ 3 gaps found
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div data-fade>
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-soft px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-primary">
            <span className="h-1.5 w-1.5 animate-[pulse-dot_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
            ISO/IEC 27001 readiness · ISMS preparation · Built for Morocco
          </span>
          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] text-foreground sm:text-6xl">
            Security readiness
            <br />
            <span className="italic text-primary">made simple.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Averonix helps Moroccan companies understand information security gaps, organize
            evidence, and prepare for ISO/IEC 27001 readiness — without claiming certification or
            replacing qualified auditors.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:bg-[var(--primary-deep)] hover:shadow-glow"
            >
              Start Free Readiness Check
            </Link>
            <a
              href="#how"
              className="inline-flex items-center text-sm font-semibold text-primary transition hover:text-[var(--primary-deep)]"
            >
              See how it works
            </a>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
            {[
              ["81", "Guided questions"],
              ["9", "Readiness domains"],
              ["✓", "Evidence confidence"],
              ["✓", "No raw sensitive data"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-2xl font-extrabold text-primary">{n}</div>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div data-fade>
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}

function Section({
  id,
  eyebrow,
  title,
  subtitle,
  bg = "bg-card",
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  bg?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`${bg} py-20`}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center" data-fade>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-foreground sm:text-4xl">
            {title}
          </h2>
          {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  bg = "bg-background",
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  bg?: string;
}) {
  return (
    <div
      data-fade
      className={`group rounded-2xl border border-border ${bg} p-6 transition duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-card`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-soft text-primary transition group-hover:scale-110">
        {icon}
      </div>
      <h3 className="mt-5 font-display text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

function Landing() {
  useFadeUp();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />

      {/* Problem */}
      <Section
        id="problem"
        eyebrow="The problem"
        title="Security programs are scattered, manual, and hard to prove."
        subtitle="Most teams know they need to prepare for ISO/IEC 27001, but evidence lives in spreadsheets, inboxes, and people's heads."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            [
              "Scattered evidence",
              "Policies, screenshots, and notes sit across tools — nothing is consolidated.",
              "M3 7h18M3 12h18M3 17h18",
            ],
            [
              "Unclear gaps",
              "You do not know which controls are weak or where readiness drops.",
              "M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z",
            ],
            [
              "Slow audits",
              "Teams often re-collect the same evidence every time they prepare for a review.",
              "M12 6v6l4 2",
            ],
            [
              "No clear roadmap",
              "Teams do not know what to fix first or what good evidence looks like.",
              "M3 12h6l3-9 3 18 3-9h3",
            ],
            [
              "Low evidence maturity",
              "Policies may exist, but the proof is weak, outdated, or hard to defend.",
              "M9 12l2 2 4-4M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z",
            ],
          ].map(([t, d, p]) => (
            <FeatureCard key={t} icon={<Icon d={p} />} title={t} desc={d} />
          ))}
        </div>
      </Section>

      {/* Solution */}
      <Section
        id="solution"
        eyebrow="The solution"
        title="One workspace for security readiness."
        subtitle="Map your controls, score your gaps, and build evidence confidence — all in one place."
        bg="bg-surface-soft"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            [
              "Readiness assessment",
              "Answer 81 guided questions across 9 information security readiness domains.",
            ],
            [
              "Gap analysis",
              "See which controls are weak, where evidence is missing, and what to fix first.",
            ],
            [
              "Evidence confidence",
              "Track evidence references, notes, owners, and confidence levels without storing raw sensitive data.",
            ],
          ].map(([t, d], i) => (
            <div
              key={t}
              data-fade
              className="rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-card"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
                <span className="font-mono text-sm">0{i + 1}</span>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-foreground">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section id="how" eyebrow="How it works" title="From signup to your first readiness report.">
        <div className="relative grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["Create account", "Sign up and tell us about your company in under 2 minutes."],
            [
              "Answer 81 guided questions",
              "Nine information security domains covering governance, risk, access, operations, evidence, and resilience.",
            ],
            [
              "Review your gaps",
              "See your readiness score, weak domains, and prioritized findings.",
            ],
            [
              "Build evidence confidence",
              "Track evidence references and confidence levels over time.",
            ],
          ].map(([t, d], i) => (
            <div
              key={t}
              data-fade
              className="relative rounded-2xl border border-border bg-background p-6 transition hover:-translate-y-1 hover:border-primary hover:shadow-card"
            >
              <div className="font-display text-3xl font-extrabold text-primary">0{i + 1}</div>
              <h3 className="mt-3 font-display text-lg font-bold text-foreground">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Features */}
      <Section
        id="features"
        eyebrow="Features"
        title="Everything you need to prepare with confidence."
        bg="bg-surface-soft"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            [
              "Domain-based scoring",
              "Nine information security domains, weighted by impact, scored through guided assessment.",
              "M12 2v20M2 12h20",
            ],
            [
              "Evidence references",
              "Track which controls have evidence references, owners, and confidence levels — without storing raw sensitive data.",
              "M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z",
            ],
            [
              "Readiness report preview",
              "Generate a clear readiness summary based on your assessment responses.",
              "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
            ],
            [
              "Risk management readiness",
              "Identify, assess, and prioritize information security risks.",
              "M3 12l2-2 4 4 8-8 4 4",
            ],
            [
              "Security maturity timeline",
              "See how your posture improves over time.",
              "M3 3v18h18",
            ],
            [
              "Team collaboration",
              "Assign owners to controls and track response progress.",
              "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
            ],
          ].map(([t, d, p]) => (
            <FeatureCard key={t} icon={<Icon d={p} />} title={t} desc={d} bg="bg-card" />
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-primary py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-4xl font-extrabold text-white sm:text-5xl">
            Start your first readiness check today.
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Free to start. No raw sensitive data required. Built for Moroccan startups and SMEs.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center rounded-lg bg-white px-5 py-3 text-sm font-bold text-primary shadow-soft transition hover:-translate-y-0.5"
            >
              Start Free Readiness Check
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-white/80">
            {["No raw sensitive data", "Readiness preview", "Built for Morocco"].map((b) => (
              <span
                key={b}
                className="rounded-full bg-white/15 px-3 py-1 font-mono uppercase tracking-wider"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1E1B2E] py-14 text-white/60">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
            <div>
              <Logo variant="dark" size="lg" showBeta />
              <p className="mt-4 max-w-xs text-sm text-white/50">
                Security readiness, gap analysis and evidence confidence for Moroccan teams.
              </p>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-white/40">
                Product
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a className="hover:text-white" href="#problem">
                    Problem
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#solution">
                    Solution
                  </a>
                </li>
                <li>
                  <a className="hover:text-white" href="#features">
                    Features
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-white/40">
                Account
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link className="hover:text-white" to="/login">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-white" to="/register">
                    Create account
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-white/40">
                Compliance
              </p>
              <p className="mt-4 text-xs leading-relaxed text-white/40">{DISCLAIMER}</p>
            </div>
          </div>
          <div className="mt-12 border-t border-white/10 pt-6 text-xs text-white/30">
            © 2026 Averonix. Readiness tooling — not a certification body.
          </div>
        </div>
      </footer>
    </div>
  );
}
