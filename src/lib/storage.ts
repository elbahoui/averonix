import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  clearDevTestWorkspace,
  getDevTestCompany,
  getDevTestSession,
  isDevTestWorkspaceEnabled,
} from "@/lib/dev-workspace";
import { getCurrentOrganization, organizationToCompany, saveOrganization } from "@/lib/org/api";
import { isStrictProductionRuntime } from "@/lib/runtime";
import { normalizeSector } from "@/lib/sector";

export type StoredUser = {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
};

export type StoredCompany = {
  organizationId?: string;
  name: string;
  domain: string;
  city: string;
  country: string;
  size: string;
  sector: string;
  description: string;
  privacyRole: string;
  tools: string[];
  dataTypes: string[];
};

type CompanyRow = {
  name: string | null;
  domain: string | null;
  city: string | null;
  country: string | null;
  size: string | null;
  sector: string | null;
  description: string | null;
  privacy_role: string | null;
  tools: string[] | null;
  data_types: string[] | null;
  onboarding_completed: boolean | null;
  organization_id?: string | null;
};

function rowToCompany(r: CompanyRow): Partial<StoredCompany> & { onboardingCompleted: boolean } {
  return {
    name: r.name ?? "",
    organizationId: r.organization_id ?? undefined,
    domain: r.domain ?? "",
    city: r.city ?? "",
    country: r.country ?? "",
    size: r.size ?? "",
    sector: normalizeSector(r.sector),
    description: r.description ?? "",
    privacyRole: r.privacy_role ?? "",
    tools: r.tools ?? [],
    dataTypes: r.data_types ?? [],
    onboardingCompleted: !!r.onboarding_completed,
  };
}

function isCompanyProfileComplete(c: Partial<StoredCompany>): boolean {
  const required = [
    c.name?.trim(),
    c.sector,
    c.size?.trim(),
    c.domain?.trim(),
    (c.country ?? "Morocco").trim(),
  ];
  return required.every(Boolean);
}

export async function fetchCompany(userId: string) {
  if (isDevTestWorkspaceEnabled()) return getDevTestCompany();

  try {
    const organization = await getCurrentOrganization();
    if (organization) return organizationToCompany(organization);
  } catch (error) {
    if (isStrictProductionRuntime()) throw error;
    // Fall back to the legacy user-owned company profile.
  }

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToCompany(data as CompanyRow) : null;
}

export async function saveCompany(userId: string, c: Partial<StoredCompany>, completed = false) {
  let organizationId = c.organizationId;
  try {
    if (!organizationId) {
      organizationId = (await getCurrentOrganization())?.id;
    }
    const organization = await saveOrganization(
      c,
      organizationId,
      completed && isCompanyProfileComplete(c),
    );
    organizationId = organization?.id ?? organizationId;
  } catch (error) {
    if (isStrictProductionRuntime()) throw error;
    // Keep legacy Supabase company persistence as a compatibility fallback.
  }

  const payload = {
    user_id: userId,
    organization_id: organizationId ?? null,
    name: c.name ?? null,
    domain: c.domain ?? null,
    city: c.city ?? null,
    country: c.country ?? null,
    size: c.size ?? null,
    sector: c.sector ? normalizeSector(c.sector) : null,
    description: c.description ?? null,
    privacy_role: c.privacyRole ?? null,
    tools: c.tools ?? [],
    data_types: c.dataTypes ?? [],
    onboarding_completed: completed,
  };
  const { error } = await supabase.from("companies").upsert(payload, { onConflict: "user_id" });
  if (error) throw error;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, email, created_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function userToStored(user: User, fullName?: string | null): StoredUser {
  return {
    id: user.id,
    fullName:
      fullName || (user.user_metadata?.full_name as string) || (user.email?.split("@")[0] ?? ""),
    email: user.email ?? "",
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDevTestWorkspaceEnabled()) {
      setSession(getDevTestSession());
      setLoading(false);
      return;
    }

    let active = true;
    const timeout = window.setTimeout(() => {
      if (!active) return;
      setSession(null);
      setLoading(false);
    }, 8000);

    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        if (!active) return;
        window.clearTimeout(timeout);
        setSession(s);
        setLoading(false);
      });
      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (!active) return;
          window.clearTimeout(timeout);
          setSession(data.session);
          setLoading(false);
        })
        .catch(() => {
          if (!active) return;
          window.clearTimeout(timeout);
          setSession(null);
          setLoading(false);
        });
      return () => {
        active = false;
        window.clearTimeout(timeout);
        sub.subscription.unsubscribe();
      };
    } catch {
      window.clearTimeout(timeout);
      setSession(null);
      setLoading(false);
    }
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export async function signOut() {
  const wasDevTestWorkspace = isDevTestWorkspaceEnabled();
  clearDevTestWorkspace();
  if (wasDevTestWorkspace) return;
  await supabase.auth.signOut();
}
