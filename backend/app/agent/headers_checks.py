"""HTTP availability + security header checks (httpx)."""
from __future__ import annotations
import httpx

from ..schemas import AgentCheckResult
from .mapping import get_mapping


def _result(check_id, name, **kw) -> AgentCheckResult:
    m = get_mapping(check_id)
    return AgentCheckResult(
        id=check_id, name=name,
        mappedDomains=m["domains"], mappedQuestionIds=m["questionIds"], **kw
    )


async def _safe_get(client: httpx.AsyncClient, url: str) -> httpx.Response | None:
    try:
        return await client.get(url, follow_redirects=False)
    except httpx.HTTPError:
        return None


async def run_http_checks(domain: str) -> list[AgentCheckResult]:
    out: list[AgentCheckResult] = []
    headers_ua = {"User-Agent": "AveronixAgent/1.0 (+readiness scan)"}
    async with httpx.AsyncClient(timeout=8.0, headers=headers_ua, verify=True) as client:
        https_url = f"https://{domain}"
        http_url = f"http://{domain}"
        https_res = await _safe_get(client, https_url)
        http_res = await _safe_get(client, http_url)

        # Website availability
        if https_res is not None or http_res is not None:
            out.append(_result(
                "website_availability", "Website availability",
                status="passed", score=100, confidence=100, severity="medium",
                description="Public website is reachable.",
                evidence=f"HTTPS={https_res.status_code if https_res else 'n/a'} HTTP={http_res.status_code if http_res else 'n/a'}",
                recommendation="Monitor uptime continuously.",
            ))
        else:
            out.append(_result(
                "website_availability", "Website availability",
                status="failed", score=20, confidence=100, severity="medium",
                description="Public website was not reachable.",
                evidence="Both HTTP and HTTPS requests failed.",
                recommendation="Verify DNS, hosting, and TLS.",
            ))

        # HTTPS availability
        if https_res is not None and https_res.status_code < 500:
            out.append(_result(
                "https_availability", "HTTPS availability",
                status="passed", score=100, confidence=100, severity="high",
                description="HTTPS endpoint responded successfully.",
                evidence=f"HTTPS status {https_res.status_code}.",
                recommendation="Keep HTTPS as the default protocol.",
            ))
        else:
            out.append(_result(
                "https_availability", "HTTPS availability",
                status="failed", score=20, confidence=100, severity="critical",
                description="HTTPS endpoint not reachable.",
                evidence=f"HTTPS error or 5xx: {https_res.status_code if https_res else 'no response'}.",
                recommendation="Enable HTTPS with a valid certificate.",
            ))

        # HTTP→HTTPS redirect
        if http_res is not None:
            loc = http_res.headers.get("location", "")
            if 300 <= http_res.status_code < 400 and loc.lower().startswith("https://"):
                out.append(_result(
                    "http_to_https_redirect", "HTTP → HTTPS redirect",
                    status="passed", score=100, confidence=100, severity="high",
                    description="HTTP traffic is redirected to HTTPS.",
                    evidence=f"{http_res.status_code} → {loc}",
                    recommendation="Keep the permanent redirect (301) in place.",
                ))
            else:
                out.append(_result(
                    "http_to_https_redirect", "HTTP → HTTPS redirect",
                    status="failed", score=20, confidence=100, severity="high",
                    description="HTTP does not redirect to HTTPS.",
                    evidence=f"HTTP {http_res.status_code}, location='{loc}'.",
                    recommendation="Configure a permanent 301 redirect to HTTPS.",
                ))
        else:
            out.append(_result(
                "http_to_https_redirect", "HTTP → HTTPS redirect",
                status="not_checked", score=0, confidence=0, severity="high",
                description="HTTP endpoint did not respond.",
                evidence="HTTP request failed.",
                recommendation="Ensure plain HTTP either responds with a redirect or is closed.",
                reason="HTTP endpoint unreachable.",
            ))

        # Header analysis (use HTTPS response)
        out.extend(_header_checks(https_res))
        out.extend(_cookie_checks(https_res))
    return out


def _header_checks(res: httpx.Response | None) -> list[AgentCheckResult]:
    if res is None:
        return [
            _nc("security_headers", "Security headers"),
            _nc("hsts", "HSTS"),
            _nc("content_security_policy", "Content Security Policy"),
            _nc("frame_protection", "X-Frame-Options"),
            _nc("content_type_options", "X-Content-Type-Options"),
            _nc("referrer_policy", "Referrer-Policy"),
            _nc("permissions_policy", "Permissions-Policy"),
        ]
    h = {k.lower(): v for k, v in res.headers.items()}
    checks: list[AgentCheckResult] = []

    def _hdr(check_id: str, name: str, key: str, severity: str, ok_eval=None):
        v = h.get(key)
        if v:
            ok = True if ok_eval is None else ok_eval(v)
            return _result(
                check_id, name,
                status="passed" if ok else "warning",
                score=100 if ok else 60,
                confidence=100, severity=severity,
                description=f"{name} header set.",
                evidence=f"{key}: {v[:200]}",
                recommendation="Keep the header configured and reviewed periodically.",
            )
        return _result(
            check_id, name,
            status="failed", score=20, confidence=100, severity=severity,
            description=f"{name} header missing.",
            evidence=f"No '{key}' header.",
            recommendation=f"Set the {name} header at the edge or web server.",
        )

    important = sum(
        1 for k in ("strict-transport-security", "content-security-policy",
                    "x-frame-options", "x-content-type-options",
                    "referrer-policy", "permissions-policy") if k in h
    )
    checks.append(_result(
        "security_headers", "Security headers (overall)",
        status="passed" if important >= 5 else ("warning" if important >= 3 else "failed"),
        score=100 if important >= 5 else (60 if important >= 3 else 20),
        confidence=100, severity="high",
        description="Overview of common security headers.",
        evidence=f"{important}/6 key security headers present.",
        recommendation="Aim for HSTS, CSP, XFO, XCTO, Referrer-Policy, Permissions-Policy.",
    ))
    checks.append(_hdr("hsts", "HSTS", "strict-transport-security", "high"))
    checks.append(_hdr("content_security_policy", "Content Security Policy",
                       "content-security-policy", "high"))
    checks.append(_hdr("frame_protection", "X-Frame-Options", "x-frame-options", "medium"))
    checks.append(_hdr("content_type_options", "X-Content-Type-Options",
                       "x-content-type-options", "medium"))
    checks.append(_hdr("referrer_policy", "Referrer-Policy", "referrer-policy", "low"))
    checks.append(_hdr("permissions_policy", "Permissions-Policy", "permissions-policy", "low"))
    return checks


def _cookie_checks(res: httpx.Response | None) -> list[AgentCheckResult]:
    if res is None:
        return [_nc("cookie_security", "Cookie security flags")]
    set_cookies = res.headers.get_list("set-cookie") if hasattr(res.headers, "get_list") else []
    if not set_cookies:
        return [_result(
            "cookie_security", "Cookie security flags",
            status="not_checked", score=0, confidence=0, severity="medium",
            description="No cookies set on landing response.",
            evidence="No Set-Cookie header on the public homepage.",
            recommendation="If you set cookies elsewhere, enforce Secure, HttpOnly, SameSite.",
            reason="No cookies observed.",
        )]
    bad = []
    for c in set_cookies:
        low = c.lower()
        flags = []
        if "secure" not in low: flags.append("Secure")
        if "httponly" not in low: flags.append("HttpOnly")
        if "samesite" not in low: flags.append("SameSite")
        if flags:
            bad.append(f"{c.split('=')[0]}: missing {', '.join(flags)}")
    if bad:
        return [_result(
            "cookie_security", "Cookie security flags",
            status="failed", score=30, confidence=100, severity="high",
            description="Cookies missing security flags.",
            evidence="; ".join(bad)[:300],
            recommendation="Always set Secure, HttpOnly, and SameSite on cookies.",
        )]
    return [_result(
        "cookie_security", "Cookie security flags",
        status="passed", score=100, confidence=100, severity="medium",
        description="All landing cookies set with security flags.",
        evidence=f"{len(set_cookies)} cookie(s) reviewed.",
        recommendation="Keep cookie hardening consistent across the application.",
    )]


def _nc(check_id: str, name: str) -> AgentCheckResult:
    return _result(
        check_id, name,
        status="not_checked", score=0, confidence=0, severity="medium",
        description="Could not retrieve HTTPS response to evaluate.",
        evidence="No HTTPS response available.",
        recommendation="Ensure HTTPS is reachable so headers can be evaluated.",
        reason="HTTPS endpoint unreachable.",
    )
