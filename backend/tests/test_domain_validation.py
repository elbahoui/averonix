from app.security import normalize_domain, InvalidDomainError
import pytest


def test_strip_scheme_and_path():
    assert normalize_domain("https://Example.com/foo?x=1") == "example.com"


def test_reject_localhost():
    with pytest.raises(InvalidDomainError):
        normalize_domain("localhost")


def test_reject_private_ip():
    with pytest.raises(InvalidDomainError):
        normalize_domain("http://10.0.0.1")
    with pytest.raises(InvalidDomainError):
        normalize_domain("192.168.1.1")
    with pytest.raises(InvalidDomainError):
        normalize_domain("127.0.0.1")


def test_reject_bad_schemes():
    for s in ("file:///etc/passwd", "javascript:alert(1)", "data:text/html,abc"):
        with pytest.raises(InvalidDomainError):
            normalize_domain(s)


def test_reject_internal_tld():
    with pytest.raises(InvalidDomainError):
        normalize_domain("server.local")
