const DEMO_STORAGE_KEYS = [
  "averonix.agent.lastScan",
  "averonix.agent.scanHistory",
  "averonix.assessment.responses",
  "averonix.assessment.results",
  "averonix.assessment.progress",
] as const;

export function clearDemoData(): void {
  try {
    if (typeof window === "undefined") return;
    for (const key of DEMO_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // localStorage unavailable or blocked
  }
}

export function demoStorageKeys(): readonly string[] {
  return DEMO_STORAGE_KEYS;
}
