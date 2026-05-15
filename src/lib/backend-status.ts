import { getApiBase, pingBackend } from "@/lib/api";

export type BackendConnectionStatus = "missing_config" | "unavailable" | "connected";

export type BackendStatusDetails = {
  status: BackendConnectionStatus;
  apiConfigured: boolean;
  healthReachable: boolean;
};

export async function getBackendStatus(): Promise<BackendStatusDetails> {
  const apiConfigured = getApiBase() !== null;
  if (!apiConfigured) {
    return {
      status: "missing_config",
      apiConfigured: false,
      healthReachable: false,
    };
  }

  const healthReachable = await pingBackend();
  return {
    status: healthReachable ? "connected" : "unavailable",
    apiConfigured: true,
    healthReachable,
  };
}

export function initialBackendStatus(): BackendConnectionStatus {
  return getApiBase() === null ? "missing_config" : "unavailable";
}

export function scanBackendStatusLabel(status: BackendConnectionStatus): string {
  if (status === "connected") return "Python backend connected.";
  if (status === "unavailable") return "Backend unavailable - using limited fallback.";
  return "Backend API URL is not configured - limited frontend checks only.";
}

export function scanBackendModeLabel(status: BackendConnectionStatus): string {
  return status === "connected" ? "Backend Agent active" : "Limited browser checks only";
}

export function assessmentBackendStatusLabel(status: BackendConnectionStatus): string {
  if (status === "connected") {
    return "Python backend connected - final evaluation uses backend scoring.";
  }
  return "Backend unavailable - using local fallback. Final scores should be verified later.";
}
