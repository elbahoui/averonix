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
  "Averonix is a readiness and gap analysis tool. It does not provide ISO certification, CNDP approval, legal advice, accreditation, authorization, or official conformity assessment.";

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
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled ? "border-border bg-white/90 backdrop-blur-md" : "border-transparent bg-white/50"
      }`}
      style={{
        boxShadow: scrolled ? "0 1px 20px rgba(124,58,237,0.06)" : "none",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Logo variant="horizontal" size="lg" showBeta imgClassName="!h-[34px] md:!h-[60px]" />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#product" className="transition hover:text-primary">
            Product
          </a>
          <a href="#features" className="transition hover:text-primary">
            Features
          </a>
          <a href="#frameworks" className="transition hover:text-primary">
            Frameworks
          </a>
          <a href="#security" className="transition hover:text-primary">
            Security
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
            Start Free
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="ml-2 inline-flex md:hidden rounded-lg p-2 hover:bg-primary/10"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-border bg-white px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm text-muted-foreground">
            <a href="#product" className="transition hover:text-primary">
              Product
            </a>
            <a href="#features" className="transition hover:text-primary">
              Features
            </a>
            <a href="#frameworks" className="transition hover:text-primary">
              Frameworks
            </a>
            <a href="#security" className="transition hover:text-primary">
              Security
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

function StatusPill({
  label,
  type = "active",
}: {
  label: string;
  type?: "active" | "planned" | "research";
}) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    planned: "bg-slate-100 text-slate-600",
    research: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider ${
        colors[type] || colors.planned
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          type === "active"
            ? "bg-green-600 animate-[pulse-dot_1.4s_ease-in-out_infinite]"
            : "bg-slate-400"
        }`}
      />
      {label}
    </span>
  );
}

function HeroMockup() {
  const frameworks = [
    { name: "ISO/IEC 27001", status: "Active", type: "active" as const },
    {
      name: "Agent Evidence",
      description: "External signals only",
      status: "Active",
      type: "active" as const,
    },
    { name: "Evidence References", status: "Active", type: "active" as const },
    { name: "Readiness Report", status: "Preview", type: "active" as const },
    { name: "NIST CSF", status: "Planned", type: "planned" as const },
    { name: "SOC 2", status: "Planned", type: "planned" as const },
  ];

  return (
    <div className="perspective-card relative">
      <div
        className="absolute -inset-40 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 60% 40%, rgba(124, 58, 237, 0.3) 0%, transparent 70%)",
          animation: "orb-drift 20s ease-in-out infinite",
        }}
      />
      <div
        className="card-3d relative rounded-[20px] border border-border bg-card p-6"
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
          <StatusPill label="Sample" type="active" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {frameworks.map((f) => (
            <div
              key={f.name}
              className="rounded-lg border border-border/50 bg-surface-soft/50 p-3 transition hover:border-border hover:bg-surface-soft/80"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-foreground">{f.name}</div>
                <StatusPill label={f.status} type={f.type} />
              </div>
              {f.description && (
                <div className="mt-1 text-xs text-muted-foreground">{f.description}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        className="absolute -left-8 top-12 hidden rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-glow sm:block"
        style={{ animation: "float 5s ease-in-out infinite" }}
      >
        Evidence confidence
      </div>
      <div
        className="absolute -right-6 top-20 hidden rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-glow sm:block"
        style={{ animation: "float 5s ease-in-out infinite", animationDelay: "1s" }}
      >
        External signals
      </div>
      <div
        className="absolute -left-10 bottom-16 hidden rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-glow sm:block"
        style={{ animation: "float 5s ease-in-out infinite", animationDelay: "2s" }}
      >
        Gap detected
      </div>
      <div
        className="absolute -right-8 bottom-12 hidden rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-glow sm:block"
        style={{ animation: "float 5s ease-in-out infinite", animationDelay: "1.5s" }}
      >
        No raw data
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-background dot-grid">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div data-fade>
          <div className="flex flex-wrap gap-2">
            {[
              "ISO/IEC 27001 readiness",
              "Evidence confidence",
              "External technical signals",
              "No raw sensitive data required",
              "Built for Moroccan SMEs",
            ].map((badge, i) => (
              <span
                key={badge}
                className="inline-flex items-center gap-2 rounded-full bg-surface-soft px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-primary"
                style={{ animation: `fade-up 0.6s ease-out both`, animationDelay: `${i * 60}ms` }}
              >
                <span className="h-1.5 w-1.5 animate-[pulse-dot_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
                {badge}
              </span>
            ))}
          </div>
          <h1 className="mt-8 font-display text-5xl font-extrabold leading-[1.05] text-foreground sm:text-6xl">
            Security and privacy readiness,
            <br />
            <span className="italic text-primary">structured for growing teams.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Averonix helps SMEs assess security and data protection readiness, organize evidence
            references, identify gaps, and prepare remediation roadmaps — without claiming
            certification or replacing auditors.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:bg-[var(--primary-deep)] hover:shadow-glow"
            >
              Start Free Readiness Check
            </Link>
            <a
              href="#frameworks"
              className="inline-flex items-center text-sm font-semibold text-primary transition hover:text-[var(--primary-deep)]"
            >
              Explore Frameworks
            </a>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-5">
            {[
              ["81", "Guided questions"],
              ["9", "Readiness domains"],
              ["✓", "Evidence confidence"],
              ["✓", "External signals"],
              ["✓", "No raw data"],
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
      className={`group relative rounded-2xl border border-border ${bg} p-6 transition duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-card`}
    >
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-transparent rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
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

function ProductPreview() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["Home", "Frameworks", "Evidence", "Assessment", "Agent", "Report"];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % tabs.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [tabs.length]);

  return (
    <div className="perspective-card relative mx-auto max-w-2xl">
      <div
        className="absolute -inset-20 opacity-20"
        style={{
          background:
            "radial-gradient(circle at 40% 60%, rgba(124, 58, 237, 0.4) 0%, transparent 70%)",
        }}
      />
      <div
        className="card-3d relative rounded-[20px] border border-border bg-card p-8"
        style={{ boxShadow: "0 20px 60px rgba(124,58,237,0.12)" }}
      >
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="h-3 w-3 rounded-full bg-danger" />
          <div className="h-3 w-3 rounded-full bg-warning" />
          <div className="h-3 w-3 rounded-full bg-success" />
          <div className="ml-auto font-mono text-[10px] text-muted-foreground">averonix.io</div>
        </div>
        <div className="mt-6 flex gap-2 border-b border-border pb-4">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-3 py-1 text-xs font-medium transition rounded ${
                activeTab === i
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-3 w-full rounded bg-surface-soft animate-[fade-up_0.6s_ease-out_both]"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-20 rounded-lg bg-surface-soft border border-border animate-[fade-up_0.6s_ease-out_both]"
              style={{ animationDelay: `${(i + 3) * 100}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
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
        eyebrow="The problem"
        title="Security and compliance preparation is still too manual."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            [
              "Evidence is scattered across tools.",
              "Policies, screenshots, and notes sit across email, drive, and shared spaces.",
            ],
            [
              "Teams do not know which controls are weak.",
              "No clear visibility into readiness gaps or which domains need attention.",
            ],
            [
              "Readiness is often confused with certification.",
              "Preparation is not the same as formal ISO certification or regulatory approval.",
            ],
            [
              "SMEs lack a simple structure for preparation.",
              "Building a security program from scratch is complex and unguided.",
            ],
          ].map(([t, d]) => (
            <FeatureCard
              key={t as string}
              icon={<Icon d="M12 2v20M2 12h20" />}
              title={t as string}
              desc={d as string}
            />
          ))}
        </div>
      </Section>

      {/* Solution */}
      <Section
        id="product"
        eyebrow="The solution"
        title="A readiness workspace for security and privacy preparation."
        bg="bg-surface-soft"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {[
            ["Guided Assessment", "Structured readiness questions across framework domains."],
            [
              "Evidence Confidence",
              "Track whether controls are supported by strong evidence references.",
            ],
            [
              "Agent Evidence",
              "Review external technical signals such as HTTPS, TLS, DNS, SPF, DMARC, and security headers.",
            ],
            ["Readiness Report", "Understand gaps, risks, and recommended next actions."],
          ].map(([t, d], i) => (
            <div
              key={t}
              data-fade
              className="relative rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-card hover:border-primary group"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-transparent rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
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
      <Section id="features" eyebrow="How it works" title="From assessment to action plan.">
        <div className="relative grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="absolute left-0 right-0 top-1/2 hidden h-1 bg-gradient-to-r from-transparent via-primary to-transparent -translate-y-1/2 opacity-20 lg:block" />
          {[
            ["Create workspace", "Sign up and tell us about your organization."],
            ["Choose framework", "Select ISO/IEC 27001 or other supported frameworks."],
            [
              "Complete guided assessment",
              "Answer structured questions across 9 security domains.",
            ],
            ["Review gaps and roadmap", "Get a readiness score and prioritized remediation plan."],
          ].map(([t, d], i) => (
            <div
              key={t}
              data-fade
              className="relative rounded-2xl border border-border bg-background p-6 transition hover:-translate-y-1 hover:border-primary hover:shadow-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-display text-lg font-extrabold">
                {i + 1}
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-foreground">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Frameworks */}
      <Section
        id="frameworks"
        eyebrow="Frameworks"
        title="Built for a multi-framework readiness future."
        bg="bg-surface-soft"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {[
            {
              name: "ISO/IEC 27001",
              status: "Active",
              desc: "Security readiness",
              type: "active" as const,
            },
            {
              name: "Loi 09-08 / CNDP",
              status: "Research",
              desc: "Moroccan privacy readiness",
              type: "research" as const,
            },
            {
              name: "NIST CSF",
              status: "Planned",
              desc: "Cybersecurity maturity",
              type: "planned" as const,
            },
            {
              name: "SOC 2",
              status: "Planned",
              desc: "Trust readiness",
              type: "planned" as const,
            },
          ].map(({ name, status, desc, type }) => (
            <div
              key={name}
              data-fade
              className={`rounded-2xl border p-6 transition ${
                type === "active"
                  ? "border-primary/30 bg-card hover:border-primary hover:shadow-card"
                  : "border-border bg-background opacity-75"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">{name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
                <StatusPill label={status} type={type} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Product Preview */}
      <Section eyebrow="Dashboard" title="A clear workspace for readiness operations.">
        <ProductPreview />
      </Section>

      {/* Trust and Safety */}
      <Section
        id="security"
        eyebrow="Transparency"
        title="Designed to avoid misleading compliance claims."
        bg="bg-surface-soft"
      >
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div data-fade className="rounded-2xl border border-border bg-card p-8">
            <h3 className="flex items-center gap-3 font-display text-lg font-bold text-foreground">
              <svg
                className="h-5 w-5 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Averonix does not provide
            </h3>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {[
                "ISO certification",
                "CNDP approval",
                "Legal advice",
                "Official authorization",
                "Accreditation",
                "Official conformity assessment",
                "Guaranteed compliance",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-slate-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div data-fade className="rounded-2xl border border-border bg-card p-8">
            <h3 className="flex items-center gap-3 font-display text-lg font-bold text-foreground">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Averonix provides
            </h3>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {[
                "Readiness visibility",
                "Gap analysis",
                "Evidence reference tracking",
                "Remediation guidance",
                "Security posture dashboard",
                "Control mapping",
                "Maturity assessment",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <section className="relative overflow-hidden py-20">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.3) 0%, transparent 60%)",
            animation: "orb-drift 25s ease-in-out infinite",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/95 to-[var(--primary-deep)]/95" />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-4xl font-extrabold text-white sm:text-5xl">
            Start your readiness check today.
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Understand your gaps before you prepare for audits, security reviews, or regulatory
            discussions.
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
          <p className="mt-6 text-xs text-white/70">
            No raw sensitive data required. Readiness preview only.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1E1B2E] py-14 text-white/60">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-5">
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
                  <a className="hover:text-white transition" href="#product">
                    Features
                  </a>
                </li>
                <li>
                  <a className="hover:text-white transition" href="#features">
                    How it works
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-white/40">
                Frameworks
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a className="hover:text-white transition" href="#frameworks">
                    Browse frameworks
                  </a>
                </li>
                <li>
                  <a className="hover:text-white transition" href="#security">
                    Transparency
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
                  <Link className="hover:text-white transition" to="/login">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link className="hover:text-white transition" to="/register">
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
