import importlib

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.config import get_allowed_origins, get_app_env
from app.main import app
from app.persistence import compute_response_hash
from app.schemas import AgentScanResult, AssessmentResponseIn


client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_config_cache():
    get_app_env.cache_clear()
    get_allowed_origins.cache_clear()
    yield
    get_app_env.cache_clear()
    get_allowed_origins.cache_clear()


def test_app_main_imports_successfully():
    module = importlib.import_module("app.main")
    assert module.app


def test_health_returns_200():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_assessment_questions_saas_returns_81():
    response = client.get("/api/assessment/questions?sector=saas")
    assert response.status_code == 200
    domains = response.json()["domains"]
    assert sum(len(bundle["questions"]) for bundle in domains.values()) == 81


def test_assessment_evaluate_rejects_incomplete():
    response = client.post(
        "/api/assessment/evaluate",
        json={
            "sector": "saas",
            "responses": [
                {
                    "questionId": "D1-C01",
                    "domainId": "D1",
                    "maturityLevel": 3,
                    "evidenceConfidence": 1.0,
                }
            ],
        },
    )
    assert response.status_code == 400
    payload = response.json()["error"]
    assert payload["code"] == "ASSESSMENT_INCOMPLETE"
    assert payload["answered"] == 1
    assert payload["expected"] == 81


@pytest.mark.parametrize("target", ["localhost", "127.0.0.1", "10.0.0.1"])
def test_agent_scan_rejects_private_literal_targets(target):
    response = client.post("/api/agent/scan", json={"domain": target})
    assert response.status_code == 400


def test_agent_scan_rejects_public_domain_resolving_private_ip(monkeypatch):
    def fake_getaddrinfo(*args, **kwargs):
        return [(None, None, None, None, ("10.0.0.8", 0))]

    monkeypatch.setattr("app.security.socket.getaddrinfo", fake_getaddrinfo)
    response = client.post("/api/agent/scan", json={"domain": "example.com"})
    assert response.status_code == 400
    assert "public" in response.json()["detail"].lower()


def test_production_cors_has_no_wildcard_fallback(monkeypatch):
    monkeypatch.setenv("AVERONIX_ENV", "production")
    monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)

    with pytest.raises(RuntimeError):
        get_allowed_origins()

    monkeypatch.setenv("ALLOWED_ORIGINS", "*")
    get_allowed_origins.cache_clear()
    with pytest.raises(RuntimeError):
        get_allowed_origins()

    monkeypatch.setenv("ALLOWED_ORIGINS", "https://app.averonix.io")
    get_allowed_origins.cache_clear()
    assert get_allowed_origins() == ["https://app.averonix.io"]


def test_agent_scan_rejects_production_without_api_key(monkeypatch):
    monkeypatch.setenv("AVERONIX_ENV", "production")
    monkeypatch.delenv("AVERONIX_API_KEY", raising=False)
    get_app_env.cache_clear()

    response = client.post(
        "/api/agent/scan",
        headers={"x-forwarded-for": "prod-no-key"},
        json={"domain": "example.com"},
    )

    assert response.status_code == 401
    assert "required" in response.json()["detail"].lower()


def test_agent_scan_rejects_production_wrong_api_key(monkeypatch):
    monkeypatch.setenv("AVERONIX_ENV", "production")
    monkeypatch.setenv("AVERONIX_API_KEY", "expected-demo-key")
    get_app_env.cache_clear()

    response = client.post(
        "/api/agent/scan",
        headers={
            "x-forwarded-for": "prod-wrong-key",
            "X-Averonix-API-Key": "wrong-key",
        },
        json={"domain": "example.com"},
    )

    assert response.status_code == 401
    assert "authentication" in response.json()["detail"].lower()


def test_agent_scan_generic_500_does_not_leak_exception(monkeypatch):
    async def fail_scan(_payload):
        raise RuntimeError("sensitive internal failure")

    monkeypatch.setattr("app.api.agent_routes.run_agent_scan", fail_scan)

    response = client.post(
        "/api/agent/scan",
        headers={"x-forwarded-for": "generic-error"},
        json={"domain": "example.com"},
    )

    assert response.status_code == 500
    assert response.json()["detail"] == "Agent scan failed. Please try again later."
    assert "sensitive internal failure" not in response.text


def test_assessment_evaluate_requires_auth_in_production(monkeypatch):
    monkeypatch.setenv("AVERONIX_ENV", "production")
    get_app_env.cache_clear()

    response = client.post(
        "/api/assessment/evaluate",
        json={"sector": "saas", "responses": []},
    )

    assert response.status_code == 401


def test_persisted_assessment_evaluate_uses_session(monkeypatch):
    async def fake_verify(_token):
        return {"id": "00000000-0000-4000-8000-000000000010", "email": "owner@example.com"}

    async def fake_evaluate(_organization_id, _session_id, _user_id):
        return {
            "overallScore": 100,
            "riskLevel": "minimal",
            "evidenceConfidence": 100,
            "domainScores": {},
            "criticalGaps": [],
            "weakEvidence": [],
            "recommendations": [],
            "sessionId": _session_id,
            "organizationId": _organization_id,
            "questionCount": 81,
            "answeredCount": 81,
            "completedAt": "2026-05-13T00:00:00Z",
            "source": "backend",
        }

    monkeypatch.setattr("app.auth.verify_supabase_token", fake_verify)
    monkeypatch.setattr("app.api.assessment_routes.evaluate_assessment_session", fake_evaluate)

    response = client.post(
        "/api/assessment/evaluate",
        headers={"Authorization": "Bearer test-token"},
        json={
            "organizationId": "org_1",
            "sessionId": "session_1",
            "sector": "saas",
            "responses": [],
        },
    )

    assert response.status_code == 200
    assert response.json()["sessionId"] == "session_1"
    assert response.json()["organizationId"] == "org_1"


def test_response_hash_changes_when_answer_changes():
    base = [
        AssessmentResponseIn(
            questionId="D1-C01",
            domainId="D1",
            maturityLevel=3,
            evidenceConfidence=1.0,
            evidenceNote="policy",
        )
    ]
    changed = [
        AssessmentResponseIn(
            questionId="D1-C01",
            domainId="D1",
            maturityLevel=2,
            evidenceConfidence=1.0,
            evidenceNote="policy",
        )
    ]

    assert compute_response_hash(base) != compute_response_hash(changed)


def test_agent_scan_checks_org_access_before_scan(monkeypatch):
    async def fake_verify(_token):
        return {"id": "00000000-0000-4000-8000-000000000020"}

    async def deny_access(*_args, **_kwargs):
        raise HTTPException(status_code=403, detail="Organization access denied.")

    async def fail_if_called(_payload):
        raise AssertionError("scan should not run before organization access check")

    monkeypatch.setattr("app.auth.verify_supabase_token", fake_verify)
    monkeypatch.setattr("app.api.agent_routes.require_organization_access", deny_access)
    monkeypatch.setattr("app.api.agent_routes.run_agent_scan", fail_if_called)

    response = client.post(
        "/api/agent/scan",
        headers={"Authorization": "Bearer test-token", "x-forwarded-for": "org-denied"},
        json={"domain": "example.com", "organizationId": "org_denied"},
    )

    assert response.status_code == 403


def test_agent_scan_persists_under_authenticated_organization(monkeypatch):
    persisted = {}

    async def fake_verify(_token):
        return {"id": "00000000-0000-4000-8000-000000000030"}

    async def allow_access(*_args, **_kwargs):
        return {"role": "owner"}

    async def fake_scan(payload):
        return AgentScanResult(
            id="scan_1",
            createdAt="2026-05-14T00:00:00Z",
            target={"domain": payload.domain, "organizationId": payload.organizationId},
            summary={
                "verifiedSignalScore": 90,
                "riskInterpretation": "low",
                "evidenceConfidence": 90,
                "agentReadinessImpact": 81,
                "automatedQuestions": 12,
                "totalModelQuestions": 270,
                "coveragePercent": 4,
                "passedChecks": 1,
                "warningChecks": 0,
                "failedChecks": 0,
                "notChecked": 0,
                "criticalFindings": 0,
            },
            checks=[],
            findings=[],
            mappedQuestions=[],
            domainCoverage={},
            limitations=[],
        )

    async def fake_persist(organization_id, user_id, result):
        persisted["organization_id"] = organization_id
        persisted["user_id"] = user_id
        persisted["result_id"] = result.id
        return {"id": "scan_row_1"}

    monkeypatch.setattr("app.auth.verify_supabase_token", fake_verify)
    monkeypatch.setattr("app.api.agent_routes.require_organization_access", allow_access)
    monkeypatch.setattr("app.api.agent_routes.run_agent_scan", fake_scan)
    monkeypatch.setattr("app.api.agent_routes.persist_agent_scan", fake_persist)

    response = client.post(
        "/api/agent/scan",
        headers={"Authorization": "Bearer test-token", "x-forwarded-for": "persist-agent"},
        json={"domain": "example.com", "organizationId": "org_123", "sector": "saas"},
    )

    assert response.status_code == 200
    assert persisted == {
        "organization_id": "org_123",
        "user_id": "00000000-0000-4000-8000-000000000030",
        "result_id": "scan_1",
    }
