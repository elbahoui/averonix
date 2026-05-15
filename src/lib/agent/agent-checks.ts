import type { AgentCheckResult, AgentSeverity } from "./types";
import { getMapping } from "./agent-mapping";

const NEEDS_BACKEND_REASON = "This check requires a backend or edge function.";
const NEEDS_BACKEND_RECO = "Run this check from the Agent backend or Supabase Edge Function.";

function notChecked(
  id: string,
  name: string,
  description: string,
  severity: AgentSeverity = "medium",
  reason: string = NEEDS_BACKEND_REASON,
): AgentCheckResult {
  const m = getMapping(id);
  return {
    id,
    name,
    status: "not_checked",
    score: 0,
    confidence: 0,
    severity,
    description,
    evidence: "Not verifiable from the browser in Phase 1.",
    recommendation: NEEDS_BACKEND_RECO,
    mappedDomains: m.domains,
    mappedQuestionIds: m.questionIds,
    reason,
  };
}

function buildResult(
  id: string,
  name: string,
  partial: Partial<AgentCheckResult> & {
    status: AgentCheckResult["status"];
    score: number;
    confidence: number;
    severity: AgentSeverity;
    description: string;
    evidence: string;
    recommendation: string;
  },
): AgentCheckResult {
  const m = getMapping(id);
  return {
    id,
    name,
    mappedDomains: m.domains,
    mappedQuestionIds: m.questionIds,
    ...partial,
  };
}

async function tryFetch(
  url: string,
  init?: RequestInit,
  timeoutMs = 8000,
): Promise<Response | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    clearTimeout(t);
    return res;
  } catch {
    return null;
  }
}

export async function checkWebsiteAvailability(domain: string): Promise<AgentCheckResult> {
  const res = await tryFetch(`https://${domain}`, { mode: "no-cors", redirect: "follow" });
  if (res) {
    return buildResult("website_availability", "Website availability", {
      status: "passed",
      score: 100,
      confidence: 60,
      severity: "medium",
      description: "Public website is reachable.",
      evidence: `Reachable at https://${domain} (opaque response).`,
      recommendation: "Keep the public site monitored for uptime.",
    });
  }
  return buildResult("website_availability", "Website availability", {
    status: "failed",
    score: 20,
    confidence: 50,
    severity: "medium",
    description: "Public website was not reachable.",
    evidence: `Browser fetch to https://${domain} failed.`,
    recommendation: "Verify DNS, hosting, and TLS settings for the public domain.",
  });
}

export async function checkHttpsAvailability(domain: string): Promise<AgentCheckResult> {
  const res = await tryFetch(`https://${domain}`, { mode: "no-cors" });
  if (res) {
    return buildResult("https_availability", "HTTPS availability", {
      status: "passed",
      score: 100,
      confidence: 70,
      severity: "high",
      description: "HTTPS endpoint is reachable.",
      evidence: `https://${domain} responded.`,
      recommendation: "Keep TLS up to date and monitor certificate expiry.",
    });
  }
  return buildResult("https_availability", "HTTPS availability", {
    status: "failed",
    score: 20,
    confidence: 60,
    severity: "high",
    description: "HTTPS endpoint did not respond.",
    evidence: `Browser fetch to https://${domain} failed.`,
    recommendation: "Enable HTTPS and ensure the certificate chain is valid.",
  });
}

export async function checkHttpToHttpsRedirect(domain: string): Promise<AgentCheckResult> {
  // Browser cannot reliably observe redirects across origins; mark not_checked but try a soft probe.
  const res = await tryFetch(`http://${domain}`, { mode: "no-cors" });
  if (!res) {
    return notChecked(
      "http_to_https_redirect",
      "HTTP → HTTPS redirect",
      "Verifies that plain HTTP redirects to HTTPS.",
      "high",
    );
  }
  return notChecked(
    "http_to_https_redirect",
    "HTTP → HTTPS redirect",
    "Verifies that plain HTTP redirects to HTTPS.",
    "high",
    "Redirect chains cannot be inspected from the browser; needs a backend probe.",
  );
}

async function readHeaders(domain: string): Promise<Headers | null> {
  // Only readable when target serves permissive CORS — otherwise returns null.
  const res = await tryFetch(`https://${domain}`, { method: "GET", mode: "cors" });
  if (!res) return null;
  return res.headers;
}

export async function checkSecurityHeaders(domain: string): Promise<AgentCheckResult> {
  const headers = await readHeaders(domain);
  if (!headers) {
    return notChecked(
      "security_headers",
      "Security headers",
      "Inspects response headers (HSTS, CSP, X-Frame-Options, etc.).",
      "high",
      "Cross-origin response headers are not readable; needs a backend probe.",
    );
  }
  const required = [
    "strict-transport-security",
    "content-security-policy",
    "x-frame-options",
    "x-content-type-options",
    "referrer-policy",
    "permissions-policy",
  ];
  const present = required.filter((h) => headers.get(h));
  const missing = required.filter((h) => !headers.get(h));
  let status: AgentCheckResult["status"] = "passed";
  let score = 100;
  if (missing.length === 0) {
    status = "passed";
    score = 100;
  } else if (present.length >= 4) {
    status = "warning";
    score = 60;
  } else {
    status = "failed";
    score = 20;
  }
  return buildResult("security_headers", "Security headers", {
    status,
    score,
    confidence: 90,
    severity: "high",
    description: "Checks for the standard set of security response headers.",
    evidence:
      missing.length === 0
        ? "All standard security headers present."
        : `Missing: ${missing.join(", ")}.`,
    recommendation:
      missing.length === 0
        ? "Maintain the current header policy and review periodically."
        : "Add the missing security headers via your CDN, web server, or application.",
  });
}

function singleHeaderCheck(
  id: string,
  name: string,
  headerKey: string,
  description: string,
  severity: AgentSeverity = "medium",
) {
  return async (domain: string): Promise<AgentCheckResult> => {
    const headers = await readHeaders(domain);
    if (!headers) {
      return notChecked(
        id,
        name,
        description,
        severity,
        "Cross-origin headers are not readable from the browser.",
      );
    }
    const v = headers.get(headerKey);
    if (v) {
      return buildResult(id, name, {
        status: "passed",
        score: 100,
        confidence: 90,
        severity,
        description,
        evidence: `${headerKey}: ${v}`,
        recommendation: `Keep ${headerKey} configured.`,
      });
    }
    return buildResult(id, name, {
      status: "failed",
      score: 20,
      confidence: 90,
      severity,
      description,
      evidence: `${headerKey} header is missing.`,
      recommendation: `Configure ${headerKey} on the public web origin.`,
    });
  };
}

export const checkHsts = singleHeaderCheck(
  "hsts",
  "HSTS",
  "strict-transport-security",
  "Verifies HTTP Strict-Transport-Security is configured.",
  "high",
);
export const checkContentSecurityPolicy = singleHeaderCheck(
  "content_security_policy",
  "Content Security Policy",
  "content-security-policy",
  "Verifies a Content-Security-Policy header is set.",
  "high",
);
export const checkFrameProtection = singleHeaderCheck(
  "frame_protection",
  "Frame protection",
  "x-frame-options",
  "Verifies clickjacking protection via X-Frame-Options or CSP frame-ancestors.",
  "medium",
);
export const checkContentTypeOptions = singleHeaderCheck(
  "content_type_options",
  "Content-Type-Options",
  "x-content-type-options",
  "Verifies X-Content-Type-Options: nosniff.",
  "low",
);
export const checkReferrerPolicy = singleHeaderCheck(
  "referrer_policy",
  "Referrer-Policy",
  "referrer-policy",
  "Verifies a Referrer-Policy header is configured.",
  "low",
);
export const checkPermissionsPolicy = singleHeaderCheck(
  "permissions_policy",
  "Permissions-Policy",
  "permissions-policy",
  "Verifies a Permissions-Policy header is configured.",
  "low",
);

export async function checkCookieSecurityFlags(domain: string): Promise<AgentCheckResult> {
  return notChecked(
    "cookie_security",
    "Cookie security flags",
    "Verifies Secure, HttpOnly, and SameSite flags on Set-Cookie.",
    "medium",
    "Set-Cookie headers are not exposed to cross-origin browser code.",
  );
}

export async function checkDnsRecords(_domain: string): Promise<AgentCheckResult> {
  return notChecked(
    "dns_records",
    "DNS records",
    "Lists public DNS A/AAAA/NS records for the domain.",
    "medium",
  );
}

export async function checkMxRecords(_domain: string): Promise<AgentCheckResult> {
  return notChecked(
    "mx_records",
    "MX records",
    "Verifies the domain advertises mail exchange records.",
    "medium",
  );
}

export async function checkSpfRecord(_domain: string): Promise<AgentCheckResult> {
  return notChecked(
    "spf_record",
    "SPF record",
    "Verifies that an SPF record is published.",
    "high",
  );
}

export async function checkDmarcRecord(_domain: string): Promise<AgentCheckResult> {
  return notChecked(
    "dmarc_record",
    "DMARC record",
    "Verifies that a DMARC policy is published.",
    "high",
  );
}

export async function checkDkimPresence(_domain: string): Promise<AgentCheckResult> {
  return notChecked(
    "dkim_presence",
    "DKIM presence",
    "Verifies the presence of DKIM selectors (selector list required).",
    "medium",
  );
}

export async function checkTlsCertificate(_domain: string): Promise<AgentCheckResult> {
  return notChecked(
    "tls_certificate",
    "TLS certificate",
    "Inspects validity, expiry, and chain of the TLS certificate.",
    "high",
  );
}

export async function checkExposedServices(_domain: string): Promise<AgentCheckResult> {
  return notChecked(
    "exposed_services",
    "Exposed services",
    "Lightweight check for unexpected publicly exposed services.",
    "medium",
    "Service discovery requires a backend probe and is intentionally non-intrusive.",
  );
}

export const ALL_CHECKS: Array<(domain: string) => Promise<AgentCheckResult>> = [
  checkWebsiteAvailability,
  checkHttpsAvailability,
  checkHttpToHttpsRedirect,
  checkSecurityHeaders,
  checkHsts,
  checkContentSecurityPolicy,
  checkFrameProtection,
  checkContentTypeOptions,
  checkReferrerPolicy,
  checkPermissionsPolicy,
  checkCookieSecurityFlags,
  checkDnsRecords,
  checkMxRecords,
  checkSpfRecord,
  checkDmarcRecord,
  checkDkimPresence,
  checkTlsCertificate,
  checkExposedServices,
];
