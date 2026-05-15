"""TLS certificate inspection (read-only)."""
from __future__ import annotations
import socket
import ssl
from datetime import datetime, timezone

from cryptography import x509
from cryptography.hazmat.backends import default_backend

from ..schemas import AgentCheckResult
from .mapping import get_mapping


def _result(check_id, name, **kw) -> AgentCheckResult:
    m = get_mapping(check_id)
    return AgentCheckResult(
        id=check_id, name=name,
        mappedDomains=m["domains"], mappedQuestionIds=m["questionIds"], **kw
    )


def _fetch_cert(domain: str, timeout: float = 5.0) -> x509.Certificate | None:
    ctx = ssl.create_default_context()
    try:
        with socket.create_connection((domain, 443), timeout=timeout) as sock:
            with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                der = ssock.getpeercert(binary_form=True)
                if not der:
                    return None
                return x509.load_der_x509_certificate(der, default_backend())
    except Exception:
        return None


def check_tls_certificate(domain: str) -> tuple[AgentCheckResult, AgentCheckResult]:
    """Returns (tls_certificate, tls_expiry)."""
    cert = _fetch_cert(domain)
    if not cert:
        cert_fail = _result(
            "tls_certificate", "TLS certificate",
            status="failed", score=20, confidence=100, severity="high",
            description="Could not retrieve a TLS certificate.",
            evidence="TLS handshake on port 443 failed or returned no certificate.",
            recommendation="Ensure HTTPS is enabled with a valid public certificate.",
        )
        expiry_nc = _result(
            "tls_expiry", "TLS certificate expiry",
            status="not_checked", score=0, confidence=0, severity="medium",
            description="No certificate available to check expiry.",
            evidence="TLS handshake failed.",
            recommendation="Enable HTTPS so expiry can be monitored.",
            reason="No certificate to inspect.",
        )
        return cert_fail, expiry_nc

    try:
        not_after = cert.not_valid_after_utc  # type: ignore[attr-defined]
    except AttributeError:
        not_after = cert.not_valid_after.replace(tzinfo=timezone.utc)
    days = (not_after - datetime.now(timezone.utc)).days

    subj = cert.subject.rfc4514_string()
    issuer = cert.issuer.rfc4514_string()

    cert_ok = _result(
        "tls_certificate", "TLS certificate",
        status="passed", score=100, confidence=100, severity="high",
        description="Valid TLS certificate served on HTTPS.",
        evidence=f"Subject: {subj} · Issuer: {issuer}",
        recommendation="Keep certificate renewals automated.",
    )

    if days < 0:
        expiry = _result(
            "tls_expiry", "TLS certificate expiry",
            status="failed", score=0, confidence=100, severity="critical",
            description="TLS certificate has expired.",
            evidence=f"Expired {abs(days)} day(s) ago ({not_after.date().isoformat()}).",
            recommendation="Renew the certificate immediately.",
        )
    elif days < 14:
        expiry = _result(
            "tls_expiry", "TLS certificate expiry",
            status="warning", score=60, confidence=100, severity="high",
            description="TLS certificate expires soon.",
            evidence=f"Expires in {days} day(s) ({not_after.date().isoformat()}).",
            recommendation="Renew before expiry; automate renewal (e.g. ACME).",
        )
    else:
        expiry = _result(
            "tls_expiry", "TLS certificate expiry",
            status="passed", score=100, confidence=100, severity="medium",
            description="TLS certificate has healthy lifetime remaining.",
            evidence=f"Expires in {days} day(s) ({not_after.date().isoformat()}).",
            recommendation="Continue monitoring expiry windows.",
        )
    return cert_ok, expiry
