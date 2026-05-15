export const DEVELOPMENT_FALLBACK_NOTICE =
  "Development fallback - showing locally saved data only.";

export const WORKSPACE_UNAVAILABLE_NOTICE =
  "Workspace data is unavailable. Persisted workspace data is required in production.";

export function isStrictProductionRuntime(): boolean {
  return import.meta.env.PROD === true;
}

export function canUseDevelopmentFallback(): boolean {
  return import.meta.env.DEV === true;
}

export function canUseLocalWorkspaceFallback(): boolean {
  return canUseDevelopmentFallback();
}

export function canUseLocalFinalResultFallback(): boolean {
  return canUseDevelopmentFallback();
}
