"""Aggregates all agent check families."""
from __future__ import annotations
import asyncio
from typing import Awaitable, Callable

from ..schemas import AgentCheckResult
from .dns_checks import check_dns_records, check_mx_records
from .email_security_checks import check_spf, check_dmarc, check_dkim
from .exposure_checks import check_exposed_services
from .headers_checks import run_http_checks
from .tls_checks import check_tls_certificate


async def run_all_checks(domain: str) -> list[AgentCheckResult]:
    """Run HTTP/TLS/DNS check families concurrently."""
    loop = asyncio.get_event_loop()

    def _sync(fn: Callable[[str], AgentCheckResult]):
        return loop.run_in_executor(None, fn, domain)

    http_task: Awaitable[list[AgentCheckResult]] = run_http_checks(domain)
    tls_task = loop.run_in_executor(None, check_tls_certificate, domain)
    dns_task = _sync(check_dns_records)
    mx_task = _sync(check_mx_records)
    spf_task = _sync(check_spf)
    dmarc_task = _sync(check_dmarc)
    dkim_task = _sync(check_dkim)
    exposed_task = _sync(check_exposed_services)

    http_results, tls_pair, dns_r, mx_r, spf_r, dmarc_r, dkim_r, exp_r = await asyncio.gather(
        http_task, tls_task, dns_task, mx_task, spf_task, dmarc_task, dkim_task, exposed_task,
        return_exceptions=False,
    )
    tls_cert, tls_exp = tls_pair
    return [*http_results, tls_cert, tls_exp, dns_r, mx_r, spf_r, dmarc_r, dkim_r, exp_r]
