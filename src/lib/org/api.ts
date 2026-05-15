import { fetchJSON } from "@/lib/api";
import { normalizeSector } from "@/lib/sector";
import type { StoredCompany } from "@/lib/storage";

export type Organization = {
  id: string;
  name: string;
  slug?: string | null;
  sector: string;
  size?: string | null;
  domain?: string | null;
  city?: string | null;
  country?: string | null;
  profile_completed?: boolean | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

type OrganizationEnvelope = {
  organization: Organization | null;
};

export function organizationToCompany(
  organization: Organization,
): Partial<StoredCompany> & { onboardingCompleted: boolean; organizationId: string } {
  return {
    organizationId: organization.id,
    name: organization.name ?? "",
    domain: organization.domain ?? "",
    city: organization.city ?? "",
    country: organization.country ?? "Morocco",
    size: organization.size ?? "",
    sector: normalizeSector(organization.sector),
    description: "",
    privacyRole: "",
    tools: [],
    dataTypes: [],
    onboardingCompleted: organization.profile_completed === true,
  };
}

export async function getCurrentOrganization(): Promise<Organization | null> {
  const response = await fetchJSON<OrganizationEnvelope>("/api/organizations/current");
  return response?.organization ?? null;
}

export async function saveOrganization(
  company: Partial<StoredCompany>,
  organizationId?: string | null,
  profileCompleted = false,
): Promise<Organization | null> {
  const payload = {
    name: company.name || "Averonix Workspace",
    sector: normalizeSector(company.sector),
    size: company.size || null,
    domain: company.domain || null,
    city: company.city || null,
    country: company.country || "Morocco",
    profileCompleted,
  };
  const path = organizationId ? `/api/organizations/${organizationId}` : "/api/organizations";
  const method = organizationId ? "PATCH" : "POST";
  const response = await fetchJSON<OrganizationEnvelope>(
    path,
    {
      method,
      body: JSON.stringify(payload),
    },
    { throwOnError: true },
  );
  return response?.organization ?? null;
}
