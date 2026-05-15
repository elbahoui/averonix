"""Domain / target validation."""
from __future__ import annotations
import ipaddress
import re
import socket


FORBIDDEN_SCHEMES = ("file:", "javascript:", "data:", "vbscript:", "ftp:")
FORBIDDEN_HOSTS = {"localhost", "0.0.0.0"}


class InvalidDomainError(ValueError):
    pass


def _is_private_ip(host: str) -> bool:
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        return False
    return (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_reserved
        or ip.is_multicast
        or ip.is_unspecified
    )


def validate_resolved_public_ips(host: str) -> list[str]:
    """Resolve A/AAAA targets and reject any non-public address."""
    try:
        infos = socket.getaddrinfo(host, None, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise InvalidDomainError("Domain could not be resolved.") from exc

    resolved = sorted({info[4][0] for info in infos if info and info[4]})
    if not resolved:
        raise InvalidDomainError("Domain did not resolve to an IP address.")

    forbidden = [ip for ip in resolved if _is_private_ip(ip)]
    if forbidden:
        raise InvalidDomainError("Resolved IP addresses must be public.")

    return resolved


def normalize_domain(raw: str) -> str:
    """Strip scheme/path/query, lowercase, validate FQDN. Reject private/internal."""
    if not raw or not isinstance(raw, str):
        raise InvalidDomainError("Domain is required.")
    s = raw.strip().lower()
    for bad in FORBIDDEN_SCHEMES:
        if s.startswith(bad):
            raise InvalidDomainError(f"Scheme '{bad}' is not allowed.")
    s = re.sub(r"^https?://", "", s)
    s = s.split("/", 1)[0].split("?", 1)[0].split("#", 1)[0]
    s = s.split("@")[-1]
    s = s.split(":")[0]
    if not s:
        raise InvalidDomainError("Empty domain.")
    if s in FORBIDDEN_HOSTS:
        raise InvalidDomainError("Local/internal hostnames are not allowed.")
    if _is_private_ip(s):
        raise InvalidDomainError("Private or reserved IP addresses are not allowed.")
    # FQDN-ish check: must have at least one dot and a TLD letter.
    if "." not in s or s.endswith("."):
        raise InvalidDomainError("Enter a valid public domain (e.g. example.com).")
    if not re.match(r"^[a-z0-9.-]+$", s):
        raise InvalidDomainError("Domain contains invalid characters.")
    if s.endswith(".local") or s.endswith(".internal") or s.endswith(".lan"):
        raise InvalidDomainError("Internal TLDs are not allowed.")
    return s
