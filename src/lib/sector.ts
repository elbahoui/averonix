export type CompanySector =
  | "saas"
  | "fintech"
  | "healthcare"
  | "ecommerce"
  | "education"
  | "telecom"
  | "professional_services"
  | "general_sme";

export const SECTOR_LABELS: Record<CompanySector, string> = {
  saas: "SaaS / Software",
  fintech: "Fintech",
  healthcare: "Healthcare",
  ecommerce: "E-commerce",
  education: "Education",
  telecom: "Telecom",
  professional_services: "Professional Services",
  general_sme: "General SME",
};

export function normalizeSector(input?: string | null): CompanySector {
  const value = (input ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[_/-]+/g, " ")
    .replace(/\s+/g, " ");

  if (!value) return "general_sme";

  if (["saas", "software", "startup", "saas software"].includes(value)) {
    return "saas";
  }
  if (["e commerce", "ecommerce", "commerce", "shop"].includes(value)) {
    return "ecommerce";
  }
  if (["healthtech", "health", "healthcare", "clinic"].includes(value)) {
    return "healthcare";
  }
  if (["fintech", "finance", "financial"].includes(value)) {
    return "fintech";
  }
  if (["education", "school", "training"].includes(value)) {
    return "education";
  }
  if (["telecom", "network", "isp"].includes(value)) {
    return "telecom";
  }
  if (["professional services", "consulting", "agency", "services"].includes(value)) {
    return "professional_services";
  }

  return "general_sme";
}

export function sectorLabel(input?: string | null): string {
  return SECTOR_LABELS[normalizeSector(input)];
}
