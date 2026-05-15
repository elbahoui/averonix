import type { Session, User } from "@supabase/supabase-js";
import { normalizeSector } from "@/lib/sector";
import type { StoredCompany } from "@/lib/storage";

export const DEV_TEST_WORKSPACE_KEY = "averonix.dev.testWorkspace";
export const DEV_TEST_USER_EMAIL = "verification.user@averonix.test";
export const DEV_TEST_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000201";

function canUseDevWorkspace(): boolean {
  return import.meta.env.DEV === true && typeof window !== "undefined";
}

export function syncDevTestWorkspaceFromUrl(): void {
  if (!canUseDevWorkspace()) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("devWorkspace") === "1") {
    window.localStorage.setItem(DEV_TEST_WORKSPACE_KEY, "1");
  }
  if (params.get("devWorkspace") === "0") {
    window.localStorage.removeItem(DEV_TEST_WORKSPACE_KEY);
  }
}

export function isDevTestWorkspaceEnabled(): boolean {
  if (!canUseDevWorkspace()) return false;
  syncDevTestWorkspaceFromUrl();
  return (
    window.localStorage.getItem(DEV_TEST_WORKSPACE_KEY) === "1" ||
    import.meta.env.VITE_AVERONIX_DEV_TEST_WORKSPACE === "1"
  );
}

export function clearDevTestWorkspace(): void {
  if (!canUseDevWorkspace()) return;
  window.localStorage.removeItem(DEV_TEST_WORKSPACE_KEY);
}

export function getDevTestUser(): User {
  return {
    id: "00000000-0000-4000-8000-000000000101",
    aud: "authenticated",
    role: "authenticated",
    email: DEV_TEST_USER_EMAIL,
    email_confirmed_at: new Date(0).toISOString(),
    phone: "",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { full_name: "Averonix Verification User" },
    identities: [],
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  } as User;
}

export function getDevTestSession(): Session {
  return {
    access_token: "dev-test-workspace-token",
    refresh_token: "dev-test-workspace-refresh",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: getDevTestUser(),
  } as Session;
}

export function getDevTestCompany(): Partial<StoredCompany> & {
  onboardingCompleted: boolean;
} {
  return {
    organizationId: DEV_TEST_ORGANIZATION_ID,
    name: "Averonix Verification Workspace",
    domain: "example.ma",
    city: "Casablanca",
    country: "Morocco",
    size: "11-50",
    sector: normalizeSector("SaaS / Software"),
    description: "Local verification workspace. Test data only.",
    privacyRole: "controller",
    tools: ["Microsoft 365", "Google Workspace", "GitHub", "Cloudflare"],
    dataTypes: ["customer_contact", "business_records"],
    onboardingCompleted: true,
  };
}
