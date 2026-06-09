from fastapi.testclient import TestClient

from app.main import create_app


def test_admin_approve_endpoint_requires_admin_and_grants_initial_tokens() -> None:
    client = TestClient(create_app())

    forbidden = client.post(
        "/api/admin/users/user_pending/approve",
        headers={"x-user-id": "user_pending"},
        json={
            "initialTokenGrant": 10_000,
            "lowBalanceThreshold": 1_000,
            "reason": "Approved for MVP access.",
        },
    )
    assert forbidden.status_code == 403
    assert forbidden.json()["error"]["code"] == "FORBIDDEN"

    response = client.post(
        "/api/admin/users/user_pending/approve",
        headers={"x-user-id": "admin_001"},
        json={
            "initialTokenGrant": 10_000,
            "lowBalanceThreshold": 1_000,
            "reason": "Approved for MVP access.",
        },
    )

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["userId"] == "user_pending"
    assert body["status"] == "approved"
    assert body["tokenBalance"] == 10_000
    assert body["tokenLedgerId"].startswith("tl_")
    assert body["adminActionId"].startswith("admin_action_")


def test_metered_consume_endpoint_rejects_insufficient_tokens_with_contract_error() -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/features/report_generation/consume",
        headers={"x-user-id": "user_approved_low"},
        json={"requestId": "req_report_001"},
    )

    assert response.status_code == 402
    assert response.json()["error"]["code"] == "INSUFFICIENT_TOKENS"
    assert response.json()["error"]["details"] == {
        "requiredTokens": 3000,
        "availableTokens": 900,
    }


def test_metered_consume_endpoint_charges_once_and_returns_low_token_warning() -> None:
    client = TestClient(create_app())

    first = client.post(
        "/api/features/match_prediction/consume",
        headers={"x-user-id": "user_approved"},
        json={"requestId": "req_prediction_001"},
    )
    duplicate = client.post(
        "/api/features/match_prediction/consume",
        headers={"x-user-id": "user_approved"},
        json={"requestId": "req_prediction_001"},
    )

    assert first.status_code == 200
    first_body = first.json()["data"]
    assert first_body["tokensCharged"] == 800
    assert first_body["remainingTokens"] == 700
    assert first_body["lowTokenWarning"] is True
    assert first_body["duplicate"] is False

    assert duplicate.status_code == 200
    duplicate_body = duplicate.json()["data"]
    assert duplicate_body["tokensCharged"] == 800
    assert duplicate_body["remainingTokens"] == 700
    assert duplicate_body["lowTokenWarning"] is True
    assert duplicate_body["duplicate"] is True


def test_account_token_endpoint_returns_balance_threshold_and_ledger() -> None:
    client = TestClient(create_app())

    response = client.get(
        "/api/account/tokens",
        headers={"x-user-id": "user_approved"},
    )

    assert response.status_code == 200
    body = response.json()["data"]
    assert body["userId"] == "user_approved"
    assert body["balanceTokens"] == 1500
    assert body["lowBalance"] is False
    assert body["lowBalanceThreshold"] == 1000
    assert body["ledger"][0]["reason"] == "admin_initial_grant"
