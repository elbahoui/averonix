import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { fetchCompany } from "@/lib/storage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Averonix" },
      { name: "description", content: "Sign in to continue your security readiness workflow." },
    ],
  }),
  component: LoginPage,
});

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-mono-label">{label}</span>
      <div className="mt-2">{children}</div>
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

const inputClass =
  "h-[52px] w-full rounded-[10px] border-[1.5px] border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-primary focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error || !data.user) {
      setErrors({ form: error?.message ?? "Sign in failed." });
      return;
    }
    const company = await fetchCompany(data.user.id).catch(() => null);
    navigate({ to: company?.onboardingCompleted ? "/dashboard" : "/onboarding" });
  }

  async function googleSignIn() {
    setErrors({});
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) {
      setErrors({ form: result.error.message ?? "Google sign in failed." });
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <AuthSplitLayout
      title="Welcome back"
      subtitle="Sign in to continue your security readiness workflow."
    >
      <form onSubmit={submit} className="space-y-5">
        <button
          type="button"
          onClick={googleSignIn}
          className="inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-[10px] border-[1.5px] border-border bg-card text-sm font-semibold text-foreground transition hover:border-primary hover:bg-surface-soft"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative flex items-center py-1">
          <div className="flex-1 border-t border-border" />
          <span className="px-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            or
          </span>
          <div className="flex-1 border-t border-border" />
        </div>

        <Field label="Work email" error={errors.email}>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@company.ma"
          />
        </Field>
        <Field label="Password" error={errors.password}>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="••••••••"
          />
        </Field>
        {errors.form && <p className="text-center text-xs text-danger">{errors.form}</p>}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-[52px] w-full items-center justify-center rounded-[10px] bg-primary font-display text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-[var(--primary-deep)] hover:shadow-glow disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Register →
          </Link>
        </p>
        <p className="pt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
          Averonix is a readiness tool. It does not provide certification or legal advice.
        </p>
      </form>
    </AuthSplitLayout>
  );
}
