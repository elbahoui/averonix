import { describe, expect, it } from "vitest";
import { organizationToCompany } from "./api";

describe("organizationToCompany", () => {
  it("does not mark an existing draft organization as completed", () => {
    const company = organizationToCompany({
      id: "org_1",
      name: "Draft Org",
      sector: "saas",
      size: "1-10",
      domain: "example.com",
      city: "Casablanca",
      country: "Morocco",
      profile_completed: false,
    });

    expect(company.onboardingCompleted).toBe(false);
  });

  it("uses explicit profile_completed as the onboarding source of truth", () => {
    const company = organizationToCompany({
      id: "org_1",
      name: "Complete Org",
      sector: "SaaS / Software",
      size: "1-10",
      domain: "example.com",
      city: "Casablanca",
      country: "Morocco",
      profile_completed: true,
    });

    expect(company.onboardingCompleted).toBe(true);
    expect(company.sector).toBe("saas");
  });
});
