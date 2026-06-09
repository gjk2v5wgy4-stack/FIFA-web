from fastapi.testclient import TestClient

from tests.conftest import auth_headers


def register_user(
    client: TestClient,
    email: str = "new-user@example.com",
    password: str = "Password123!",
) -> dict[str, object]:
    response = client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "displayName": "World Cup Analyst"},
    )
    assert response.status_code == 201, response.text
    return response.json()["data"]


def test_register_login_and_me_keep_new_user_pending(client: TestClient) -> None:
    user = register_user(client)

    assert user["status"] == "pending_approval"
    assert user["email"] == "new-user@example.com"

    headers = auth_headers(client, "new-user@example.com")
    response = client.get("/api/auth/me", headers=headers)

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "pending_approval"


def test_pending_user_can_login_but_cannot_call_metered_rag(client: TestClient) -> None:
    register_user(client, email="pending@example.com")
    headers = auth_headers(client, "pending@example.com")

    response = client.post(
        "/api/rag/ask",
        headers=headers,
        json={"question": "What are the main risk factors?", "context": {}, "retrieval": {}},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "ACCOUNT_PENDING_APPROVAL"


def test_admin_approves_user_and_grants_tokens_through_service(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    user = register_user(client, email="approval@example.com")

    response = client.post(
        f"/api/admin/users/{user['userId']}/approve",
        headers=admin_headers,
        json={"reason": "Approved for MVP access.", "initialTokenGrant": 2_000},
    )

    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["status"] == "approved"
    assert data["tokenBalance"] == 2_000
    assert data["tokenLedgerId"].startswith("tl_")

    token_response = client.get(
        "/api/account/tokens",
        headers=auth_headers(client, "approval@example.com"),
    )
    assert token_response.status_code == 200
    assert token_response.json()["data"]["balanceTokens"] == 2_000


def test_admin_endpoints_require_admin_role(client: TestClient) -> None:
    register_user(client, email="non-admin@example.com")
    headers = auth_headers(client, "non-admin@example.com")

    response = client.get("/api/admin/users", headers=headers)

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_approved_metered_api_charges_tokens_and_warns_on_low_balance(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    user = register_user(client, email="metered@example.com")
    client.post(
        f"/api/admin/users/{user['userId']}/approve",
        headers=admin_headers,
        json={"reason": "Approved.", "initialTokenGrant": 1_250},
    )
    headers = auth_headers(client, "metered@example.com")

    response = client.post(
        "/api/rag/ask",
        headers=headers,
        json={"question": "What uncertainty matters?", "context": {}, "retrieval": {}},
    )

    assert response.status_code == 200, response.text
    usage = response.json()["data"]["usage"]
    assert usage["tokensCharged"] == 1_200
    assert usage["remainingTokens"] == 50
    assert usage["lowBalance"] is True
    assert usage["lowTokenWarning"] is True


def test_insufficient_tokens_uses_contract_error(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    user = register_user(client, email="low-balance@example.com")
    client.post(
        f"/api/admin/users/{user['userId']}/approve",
        headers=admin_headers,
        json={"reason": "Approved.", "initialTokenGrant": 500},
    )
    headers = auth_headers(client, "low-balance@example.com")

    response = client.post(
        "/api/predictions/match",
        headers=headers,
        json={
            "matchId": "match_001",
            "options": {"includeScoreDistribution": True, "includeExplanations": True},
        },
    )

    assert response.status_code == 402
    payload = response.json()["error"]
    assert payload["code"] == "INSUFFICIENT_TOKENS"
    assert payload["details"] == {"requiredTokens": 800, "availableTokens": 500}


def test_account_status_tokens_and_usage_endpoints(client: TestClient) -> None:
    headers = auth_headers(client, "approved@example.com", "Approved123!")

    access_status = client.get("/api/account/access-status", headers=headers)
    tokens = client.get("/api/account/tokens", headers=headers)
    usage = client.get("/api/account/usage", headers=headers)

    assert access_status.status_code == 200
    assert access_status.json()["data"]["canUseProtectedApis"] is True
    assert tokens.status_code == 200
    assert tokens.json()["data"]["balanceTokens"] == 100_000
    assert usage.status_code == 200
    assert usage.json()["data"] == []


def test_football_stub_endpoints_return_seed_data(client: TestClient) -> None:
    responses = [
        client.get("/api/matches"),
        client.get("/api/matches/match_001"),
        client.get("/api/teams/team_usa"),
        client.get("/api/players/player_001"),
    ]

    assert [response.status_code for response in responses] == [200, 200, 200, 200]
    assert responses[0].json()["data"][0]["matchId"] == "match_001"
    assert responses[1].json()["data"]["matchId"] == "match_001"
    assert responses[2].json()["data"]["teamId"] == "team_usa"
    assert responses[3].json()["data"]["playerId"] == "player_001"


def test_admin_skeleton_routes_exist(client: TestClient, admin_headers: dict[str, str]) -> None:
    users = client.get("/api/admin/users", headers=admin_headers)
    pending = client.get("/api/admin/users/pending", headers=admin_headers)
    audit_logs = client.get("/api/admin/audit-logs", headers=admin_headers)
    usage = client.get("/api/admin/users/user_approved/usage", headers=admin_headers)
    ledger = client.get("/api/admin/users/user_approved/token-ledger", headers=admin_headers)

    assert users.status_code == 200
    assert pending.status_code == 200
    assert audit_logs.status_code == 200
    assert usage.status_code == 200
    assert ledger.status_code == 200


def test_prediction_simulation_and_report_stubs_are_metered(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    user = register_user(client, email="stub-user@example.com")
    client.post(
        f"/api/admin/users/{user['userId']}/approve",
        headers=admin_headers,
        json={"reason": "Approved.", "initialTokenGrant": 10_000},
    )
    headers = auth_headers(client, "stub-user@example.com")

    endpoints = [
        (
            "/api/predictions/match",
            {"matchId": "match_001", "options": {"includeScoreDistribution": True}},
            800,
        ),
        (
            "/api/predictions/what-if",
            {"matchId": "match_001", "scenario": {"homeLineupChanges": []}},
            1_000,
        ),
        (
            "/api/simulations/group",
            {"group": "A", "fixedResults": [], "options": {"iterations": 1000}},
            1_500,
        ),
        (
            "/api/reports/generate",
            {"reportType": "single_match", "context": {"matchId": "match_001"}, "format": "pdf"},
            3_000,
        ),
    ]

    for path, payload, expected_charge in endpoints:
        response = client.post(path, headers=headers, json=payload)
        assert response.status_code in {200, 202}, response.text
        assert response.json()["data"]["usage"]["tokensCharged"] == expected_charge


def test_prediction_contract_exposes_qa_fields(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    user = register_user(client, email="prediction-contract@example.com")
    client.post(
        f"/api/admin/users/{user['userId']}/approve",
        headers=admin_headers,
        json={"reason": "Approved.", "initialTokenGrant": 10_000},
    )
    headers = auth_headers(client, "prediction-contract@example.com")

    response = client.post(
        "/api/predictions/match",
        headers=headers,
        json={"matchId": "match_001", "options": {"includeScoreDistribution": True}},
    )

    assert response.status_code == 200, response.text
    data = response.json()["data"]
    prediction = data["prediction"]
    assert prediction["confidence"] in {"low", "medium", "high"}
    assert isinstance(prediction["riskFactors"], list)
    assert isinstance(prediction["keyDrivers"], list)
    assert data["metering"]["featureType"] == "match_full_prediction"
    assert data["metering"]["complexity"] in {"basic", "standard", "advanced"}
    assert data["metering"]["estimatedInternalTokens"] > 0
    assert (
        prediction["homeWinProbability"]
        + prediction["drawProbability"]
        + prediction["awayWinProbability"]
    ) == 1.0
    assert all(0.0 <= row["probability"] <= 1.0 for row in prediction["scorelineProbabilities"])
    forbidden_terms = (
        "\u5fc5\u4e2d",
        "\u7a33\u8d62",
        "\u7a33\u8d5a",
        "\u7a33\u80dc",
        "\u6295\u6ce8\u5efa\u8bae",
        "\u4fdd\u8bc1\u547d\u4e2d",
    )
    payload_text = str(data)
    assert all(term not in payload_text for term in forbidden_terms)


def test_what_if_and_group_simulation_contracts_include_metering(
    client: TestClient,
    admin_headers: dict[str, str],
) -> None:
    user = register_user(client, email="simulation-contract@example.com")
    client.post(
        f"/api/admin/users/{user['userId']}/approve",
        headers=admin_headers,
        json={"reason": "Approved.", "initialTokenGrant": 10_000},
    )
    headers = auth_headers(client, "simulation-contract@example.com")

    what_if = client.post(
        "/api/predictions/what-if",
        headers=headers,
        json={"matchId": "match_001", "scenario": {"homeLineupChanges": []}},
    )
    group = client.post(
        "/api/simulations/group",
        headers=headers,
        json={"group": "A", "fixedResults": [], "options": {"iterations": 1000}},
    )

    assert what_if.status_code == 200, what_if.text
    what_if_data = what_if.json()["data"]
    assert {"baseline", "adjusted", "delta", "metering"}.issubset(what_if_data)
    assert what_if_data["metering"]["featureType"] == "what_if_simulation"
    assert what_if_data["metering"]["estimatedInternalTokens"] > 0

    assert group.status_code == 200, group.text
    group_data = group.json()["data"]
    assert group_data["group"] == "A"
    assert isinstance(group_data["table"], list)
    assert group_data["metering"]["featureType"] == "group_simulation"
    assert group_data["metering"]["estimatedInternalTokens"] > 0

