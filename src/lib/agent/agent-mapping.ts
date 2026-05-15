export type AgentCheckMapping = {
  domains: string[];
  questionIds: string[];
};

export const AGENT_CHECK_MAPPINGS: Record<string, AgentCheckMapping> = {
  website_availability: { domains: ["D9"], questionIds: ["D9-C05"] },
  https_availability: { domains: ["D9"], questionIds: ["D9-C05"] },
  http_to_https_redirect: { domains: ["D9"], questionIds: ["D9-C05"] },
  security_headers: { domains: ["D9"], questionIds: ["D9-C01", "D9-C05"] },
  hsts: { domains: ["D9"], questionIds: ["D9-C05"] },
  content_security_policy: { domains: ["D9"], questionIds: ["D9-C01"] },
  frame_protection: { domains: ["D9"], questionIds: ["D9-C01"] },
  content_type_options: { domains: ["D9"], questionIds: ["D9-C01"] },
  referrer_policy: { domains: ["D9"], questionIds: ["D9-C01"] },
  permissions_policy: { domains: ["D9"], questionIds: ["D9-C01"] },
  cookie_security: { domains: ["D8", "D9"], questionIds: ["D8-C05", "D9-C05"] },
  dns_records: { domains: ["D7", "D9"], questionIds: ["D7-C02", "D9-C05"] },
  mx_records: { domains: ["D7", "D9"], questionIds: ["D7-C02", "D9-C05"] },
  spf_record: { domains: ["D9"], questionIds: ["D9-C05"] },
  dmarc_record: { domains: ["D9"], questionIds: ["D9-C05"] },
  dkim_presence: { domains: ["D9"], questionIds: ["D9-C05"] },
  tls_certificate: { domains: ["D9"], questionIds: ["D9-C05"] },
  exposed_services: { domains: ["D9"], questionIds: ["D9-C05"] },
};

export function getMapping(checkId: string): AgentCheckMapping {
  return AGENT_CHECK_MAPPINGS[checkId] ?? { domains: [], questionIds: [] };
}
