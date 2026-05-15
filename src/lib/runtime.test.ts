import { afterEach, describe, expect, it, vi } from "vitest";
import {
  canUseDevelopmentFallback,
  canUseLocalFinalResultFallback,
  canUseLocalWorkspaceFallback,
  isStrictProductionRuntime,
} from "./runtime";

describe("runtime source-of-truth helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows local workspace fallback only in development", () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("PROD", false);

    expect(canUseDevelopmentFallback()).toBe(true);
    expect(canUseLocalWorkspaceFallback()).toBe(true);
    expect(canUseLocalFinalResultFallback()).toBe(true);
  });

  it("fails closed for local final-result fallback in production", () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("PROD", true);

    expect(isStrictProductionRuntime()).toBe(true);
    expect(canUseDevelopmentFallback()).toBe(false);
    expect(canUseLocalWorkspaceFallback()).toBe(false);
    expect(canUseLocalFinalResultFallback()).toBe(false);
  });
});
