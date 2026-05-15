import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";

const trustPoints = [
  "ISO/IEC 27001 readiness support",
  "No raw sensitive data required",
  "Results in under 30 minutes",
];

export function AuthSplitLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-hero-gradient p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 60% at 20% 20%, rgba(99,102,241,0.45), transparent 60%), radial-gradient(50% 50% at 80% 80%, rgba(236,72,153,0.25), transparent 60%)",
          }}
        />
        <div className="relative">
          <Logo variant="dark" size="lg" showBeta />
        </div>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-extrabold leading-tight">
            Your readiness journey starts here.
          </h2>
          <p className="mt-4 text-white/80">
            Understand security control gaps, organize evidence, and prepare for ISO/IEC 27001
            readiness.
          </p>
          <ul className="mt-8 space-y-4">
            {trustPoints.map((t) => (
              <li key={t} className="flex items-start gap-3 text-white/90">
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
          Built for Moroccan startups and SMEs
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo variant="horizontal" size="lg" showBeta />
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft sm:p-10">
            <h1 className="font-display text-3xl font-extrabold text-foreground">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-muted-foreground transition hover:text-primary">
              ← Back to Averonix
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
