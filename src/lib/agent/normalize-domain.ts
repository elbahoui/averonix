import type { NormalizedTarget } from "./types";

const FORBIDDEN_SCHEMES = ["file:", "javascript:", "data:", "vbscript:", "ftp:"];

function isPrivateIp(host: string): boolean {
  if (host === "localhost" || host === "0.0.0.0") return true;
  const m = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if (a === 127) return true;
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

export function normalizeDomain(input: string): NormalizedTarget {
  if (!input || typeof input !== "string") {
    throw new Error("Please enter a domain.");
  }
  const original = input;
  let s = input.trim().toLowerCase();
  if (!s) throw new Error("Please enter a domain.");

  for (const scheme of FORBIDDEN_SCHEMES) {
    if (s.startsWith(scheme)) {
      throw new Error(`Unsupported URL scheme: ${scheme}`);
    }
  }

  s = s.replace(/^https?:\/\//, "");
  // strip user@
  s = s.replace(/^[^@/]*@/, "");
  // remove path/query/hash
  s = s.split("/")[0].split("?")[0].split("#")[0];
  // strip port
  s = s.replace(/:\d+$/, "");
  // strip trailing dot
  s = s.replace(/\.$/, "");

  if (!s) throw new Error("Please enter a valid public domain.");

  if (isPrivateIp(s)) {
    throw new Error("Private or local addresses are not allowed.");
  }

  // Reject bare hostnames without a public TLD (must contain a dot and TLD ≥ 2 chars)
  const parts = s.split(".");
  if (parts.length < 2 || parts[parts.length - 1].length < 2) {
    throw new Error("Enter a public domain (e.g. example.com).");
  }

  // Validate domain characters
  if (!/^[a-z0-9.-]+$/.test(s)) {
    throw new Error("Domain contains invalid characters.");
  }
  if (s.includes("..") || s.startsWith("-") || s.endsWith("-")) {
    throw new Error("Domain format is invalid.");
  }

  return { domain: s, originalInput: original };
}
