import anyio

from app import persistence


def test_create_organization_stores_profile_completed(monkeypatch):
    calls = []

    async def fake_rest_insert(table, payload, **_kwargs):
        calls.append((table, payload))
        if table == "organizations":
            return [{**payload, "id": "org_1"}]
        return [{**payload, "id": "row_1"}]

    async def fake_audit_log(*_args, **_kwargs):
        return None

    monkeypatch.setattr(persistence, "rest_insert", fake_rest_insert)
    monkeypatch.setattr(persistence, "audit_log", fake_audit_log)

    org = anyio.run(
        persistence.create_organization,
        "00000000-0000-4000-8000-000000000001",
        {
            "name": "Averonix Demo",
            "sector": "SaaS / Software",
            "size": "1-10",
            "domain": "example.com",
            "country": "Morocco",
            "profileCompleted": True,
        },
    )

    assert org["profile_completed"] is True
    assert calls[0][0] == "organizations"
    assert calls[0][1]["sector"] == "saas"


def test_update_organization_stores_profile_completed(monkeypatch):
    async def fake_require_access(*_args, **_kwargs):
        return {"role": "owner"}

    async def fake_rest_update(table, payload, _filters):
        assert table == "organizations"
        assert payload["profile_completed"] is True
        return [{**payload, "id": "org_1"}]

    async def fake_audit_log(*_args, **_kwargs):
        return None

    monkeypatch.setattr(persistence, "require_organization_access", fake_require_access)
    monkeypatch.setattr(persistence, "rest_update", fake_rest_update)
    monkeypatch.setattr(persistence, "audit_log", fake_audit_log)

    org = anyio.run(
        persistence.update_organization,
        "org_1",
        "00000000-0000-4000-8000-000000000001",
        {
            "name": "Averonix Demo",
            "sector": "saas",
            "profileCompleted": True,
        },
    )

    assert org["profile_completed"] is True
