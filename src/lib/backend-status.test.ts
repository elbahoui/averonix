import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assessmentBackendStatusLabel,
  getBackendStatus,
  scanBackendModeLabel,
  scanBackendStatusLabel,
} from "./backend-status";

describe("backend status", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reports missing configuration when VITE_API_BASE_URL is absent", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");

    await expect(getBackendStatus()).resolves.toEqual({
      status: "missing_config",
      apiConfigured: false,
      healthReachable: false,
    });
    expect(scanBackendStatusLabel("missing_config")).toContain("not configured");
  });

  it("reports connected when backend health succeeds", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:8000");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ status: "ok" }), { status: 200 })),
    );

    await expect(getBackendStatus()).resolves.toEqual({
      status: "connected",
      apiConfigured: true,
      healthReachable: true,
    });
    expect(scanBackendModeLabel("connected")).toBe("Backend Agent active");
    expect(assessmentBackendStatusLabel("connected")).toContain("backend scoring");
  });

  it("reports unavailable when backend health fails", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://127.0.0.1:8000");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 500 })),
    );

    await expect(getBackendStatus()).resolves.toEqual({
      status: "unavailable",
      apiConfigured: true,
      healthReachable: false,
    });
    expect(scanBackendStatusLabel("unavailable")).toContain("Backend unavailable");
  });
});
