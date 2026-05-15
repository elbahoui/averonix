"""DNS checks using dnspython."""
from __future__ import annotations
from typing import Optional

import dns.resolver
import dns.exception

from ..schemas import AgentCheckResult
from .mapping import get_mapping


def _result(
    check_id: str,
    name: str,
    *,
    status: str,
    score: int,
    confidence: int,
    severity: str,
    description: str,
    evidence: str,
    recommendation: str,
    reason: Optional[str] = None,
) -> AgentCheckResult:
    m = get_mapping(check_id)
    return AgentCheckResult(
        id=check_id,
        name=name,
        status=status,  # type: ignore[arg-type]
        score=score,
        confidence=confidence,
        severity=severity,  # type: ignore[arg-type]
        description=description,
        evidence=evidence,
        recommendation=recommendation,
        mappedDomains=m["domains"],
        mappedQuestionIds=m["questionIds"],
        reason=reason,
    )


def _query(domain: str, rtype: str) -> list[str]:
    try:
        answers = dns.resolver.resolve(domain, rtype, lifetime=5)
        return [r.to_text() for r in answers]
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.exception.DNSException):
        return []


def check_dns_records(domain: str) -> AgentCheckResult:
    a = _query(domain, "A")
    aaaa = _query(domain, "AAAA")
    if a or aaaa:
        return _result(
            "dns_records", "DNS records",
            status="passed", score=100, confidence=100, severity="medium",
            description="Public DNS resolution succeeded.",
            evidence=f"A: {len(a)} record(s), AAAA: {len(aaaa)} record(s).",
            recommendation="Keep DNS configuration documented and monitored.",
        )
    return _result(
        "dns_records", "DNS records",
        status="failed", score=20, confidence=100, severity="high",
        description="No A or AAAA records found.",
        evidence="Public DNS query returned no records.",
        recommendation="Verify zone configuration and authoritative servers.",
    )


def check_mx_records(domain: str) -> AgentCheckResult:
    mx = _query(domain, "MX")
    if mx:
        return _result(
            "mx_records", "MX records",
            status="passed", score=100, confidence=100, severity="medium",
            description="Mail exchanger records configured.",
            evidence=f"{len(mx)} MX record(s).",
            recommendation="Ensure MX records align with the authorized mail provider.",
        )
    return _result(
        "mx_records", "MX records",
        status="warning", score=60, confidence=100, severity="low",
        description="No MX records found.",
        evidence="No MX records on the apex domain.",
        recommendation="If email is sent from this domain, configure MX, SPF, and DMARC.",
    )


def check_spf(domain: str) -> AgentCheckResult:
    txt = _query(domain, "TXT")
    spf = [t for t in txt if "v=spf1" in t.lower()]
    if spf:
        return _result(
            "spf_record", "SPF record",
            status="passed", score=100, confidence=100, severity="high",
            description="SPF record present.",
            evidence=spf[0][:200],
            recommendation="Keep SPF aligned with authorized senders; avoid +all.",
        )
    return _result(
        "spf_record", "SPF record",
        status="failed", score=20, confidence=100, severity="high",
        description="No SPF record found.",
        evidence="No TXT record containing v=spf1.",
        recommendation="Publish an SPF record listing authorized senders.",
    )


def check_dmarc(domain: str) -> AgentCheckResult:
    txt = _query(f"_dmarc.{domain}", "TXT")
    dmarc = [t for t in txt if "v=dmarc1" in t.lower()]
    if dmarc:
        policy = "p=none"
        low = dmarc[0].lower()
        for p in ("p=reject", "p=quarantine", "p=none"):
            if p in low:
                policy = p
                break
        score = 100 if "reject" in policy else (80 if "quarantine" in policy else 60)
        status = "passed" if score >= 80 else "warning"
        return _result(
            "dmarc_record", "DMARC record",
            status=status, score=score, confidence=100, severity="high",
            description="DMARC record present.",
            evidence=f"{dmarc[0][:200]} ({policy})",
            recommendation="Move to p=quarantine then p=reject when ready.",
        )
    return _result(
        "dmarc_record", "DMARC record",
        status="failed", score=20, confidence=100, severity="high",
        description="No DMARC record found.",
        evidence="No TXT record at _dmarc.{domain}.",
        recommendation="Publish a DMARC record starting at p=none, then tighten.",
    )


def check_dkim(domain: str) -> AgentCheckResult:
    """Without a known selector we can only mark not_checked. Try common selectors best-effort."""
    selectors = ["default", "google", "selector1", "selector2", "k1", "mail"]
    for s in selectors:
        txt = _query(f"{s}._domainkey.{domain}", "TXT")
        if any("v=dkim1" in t.lower() or "p=" in t for t in txt):
            return _result(
                "dkim_presence", "DKIM presence",
                status="passed", score=100, confidence=80, severity="medium",
                description=f"DKIM record found at selector '{s}'.",
                evidence=f"{s}._domainkey.{domain} has a DKIM-like TXT record.",
                recommendation="Rotate DKIM keys periodically and document selectors.",
            )
    return _result(
        "dkim_presence", "DKIM presence",
        status="not_checked", score=0, confidence=0, severity="medium",
        description="DKIM cannot be verified without a known selector.",
        evidence="No DKIM record found at common selectors.",
        recommendation="Provide your DKIM selector to confirm DKIM is enabled.",
        reason="DKIM selector unknown; selector-based DNS lookup required.",
    )
