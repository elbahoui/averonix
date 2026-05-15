import { describe, expect, it } from "vitest";
import { normalizeSector } from "./sector";

describe("normalizeSector", () => {
  it.each([
    ["SaaS / Software", "saas"],
    ["SaaS", "saas"],
    ["software", "saas"],
    ["startup", "saas"],
    ["E-commerce", "ecommerce"],
    ["commerce", "ecommerce"],
    ["shop", "ecommerce"],
    ["Healthtech", "healthcare"],
    ["clinic", "healthcare"],
    ["Fintech", "fintech"],
    ["finance", "fintech"],
    ["Education", "education"],
    ["school", "education"],
    ["Telecom", "telecom"],
    ["isp", "telecom"],
    ["Professional Services", "professional_services"],
    ["consulting", "professional_services"],
    ["unknown", "general_sme"],
  ] as const)("maps %s to %s", (input, expected) => {
    expect(normalizeSector(input)).toBe(expected);
  });
});
