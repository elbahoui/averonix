"""Agent → ISO/IEC 27001 question mapping."""
from __future__ import annotations

AGENT_CHECK_MAPPINGS: dict[str, dict[str, list[str]]] = {
    "website_availability": {"domains": ["D9"], "questionIds": ["D9-C05"]},
    "https_availability": {"domains": ["D9"], "questionIds": ["D9-C05"]},
    "http_to_https_redirect": {"domains": ["D9"], "questionIds": ["D9-C05"]},
    "security_headers": {"domains": ["D9"], "questionIds": ["D9-C01", "D9-C05"]},
    "hsts": {"domains": ["D9"], "questionIds": ["D9-C05"]},
    "content_security_policy": {"domains": ["D9"], "questionIds": ["D9-C01"]},
    "frame_protection": {"domains": ["D9"], "questionIds": ["D9-C01"]},
    "content_type_options": {"domains": ["D9"], "questionIds": ["D9-C01"]},
    "referrer_policy": {"domains": ["D9"], "questionIds": ["D9-C01"]},
    "permissions_policy": {"domains": ["D9"], "questionIds": ["D9-C01"]},
    "cookie_security": {"domains": ["D8", "D9"], "questionIds": ["D8-C05", "D9-C05"]},
    "dns_records": {"domains": ["D7", "D9"], "questionIds": ["D7-C02", "D9-C05"]},
    "mx_records": {"domains": ["D7", "D9"], "questionIds": ["D7-C02", "D9-C05"]},
    "spf_record": {"domains": ["D9"], "questionIds": ["D9-C05"]},
    "dmarc_record": {"domains": ["D9"], "questionIds": ["D9-C05"]},
    "dkim_presence": {"domains": ["D9"], "questionIds": ["D9-C05"]},
    "tls_certificate": {"domains": ["D9"], "questionIds": ["D9-C05"]},
    "tls_expiry": {"domains": ["D9"], "questionIds": ["D9-C05"]},
    "exposed_services": {"domains": ["D9"], "questionIds": ["D9-C05"]},
}


def get_mapping(check_id: str) -> dict[str, list[str]]:
    return AGENT_CHECK_MAPPINGS.get(check_id, {"domains": [], "questionIds": []})
