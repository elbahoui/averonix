"""Email security checks (delegated to dns_checks for SPF/DMARC/DKIM)."""
from __future__ import annotations
from .dns_checks import check_spf, check_dmarc, check_dkim

__all__ = ["check_spf", "check_dmarc", "check_dkim"]
