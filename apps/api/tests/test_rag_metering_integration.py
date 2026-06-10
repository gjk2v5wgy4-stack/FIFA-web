from fastapi.testclient import TestClient

from app.main import create_app
from app.models import FeatureType, UserRole, UserStatus


def rag_payload(request_id: str, total_provider_tokens: int = 640) -> dict[str, object]:
    return {
        "requestId": request_id,
        "question": "这场比赛的主要风险因素是什么？",
        "context": {"matchId": "match_001", "teamIds": ["team_usa", "team_wal"]},
        "mockUsage": {
            "model": "rag-test-model",
            "promptTokens": 320,
            "completionTokens": 120,
            "embeddingTokens": 200,
            "totalProviderTokens": total_provider_tokens,
            "estimatedCost": 0.0042,
        },
    }


def test_pending_approval_user_cannot_call_rag() -> None:
    client = TestClient(create_app())

    response = client.post(
        "/api/rag/ask",
        headers={"x-user-id": "user_pending"},
        json=rag_payload("rag_pending_001"),
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "ACCOUNT_PENDING_APPROVAL"


def test_approved_user_with_enough_tokens_can_call_rag_and_writes_metering_logs() -> None:
    app = create_app()
    client = TestClient(app)

    response = client.post(
        "/api/rag/ask",
        headers={"x-user-id": "user_approved"},
        json=rag_payload("rag_ok_001", total_provider_tokens=640),
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["ragQueryId"].startswith("ragq_")
    assert data["usage"]["tokensCharged"] == 1280
    assert data["usage"]["remainingTokens"] == 220
    assert data["usage"]["lowBalance"] is True
    assert data["usage"]["providerUsage"] == {
        "model": "rag-test-model",
        "promptTokens": 320,
        "completionTokens": 120,
        "embeddingTokens": 200,
        "totalProviderTokens": 640,
        "estimatedCost": 0.0042,
    }

    ledger = app.state.services.tokens.listLedger("user_approved")
    assert [entry.amount_tokens for entry in ledger] == [1500, -1280]
    assert ledger[-1].reason == FeatureType.RAG_QUERY.value
    assert ledger[-1].idempotency_key == "rag_ok_001"
    assert ledger[-1].related_entity_type == "rag_query"
    assert ledger[-1].related_entity_id == data["ragQueryId"]

    usage_logs = app.state.store.api_usage_logs
    assert len(usage_logs) == 1
    assert usage_logs[0].user_id == "user_approved"
    assert usage_logs[0].usage_type == "rag"
    assert usage_logs[0].model == "rag-test-model"
    assert usage_logs[0].prompt_tokens == 320
    assert usage_logs[0].completion_tokens == 120
    assert usage_logs[0].embedding_tokens == 200
    assert usage_logs[0].total_provider_tokens == 640
    assert usage_logs[0].estimated_cost == 0.0042
    assert usage_logs[0].internal_tokens_charged == 1280
    assert usage_logs[0].token_ledger_id == ledger[-1].id
    assert usage_logs[0].related_entity_type == "rag_query"
    assert usage_logs[0].related_entity_id == data["ragQueryId"]

    account = client.get("/api/account/tokens", headers={"x-user-id": "user_approved"})
    assert account.status_code == 200
    assert account.json()["data"]["balanceTokens"] == 220
    assert account.json()["data"]["totalConsumedTokens"] == 1280


def test_rag_rejects_insufficient_tokens_without_writing_ledger_or_usage_log() -> None:
    app = create_app()
    client = TestClient(app)

    response = client.post(
        "/api/rag/ask",
        headers={"x-user-id": "user_approved_low"},
        json=rag_payload("rag_low_001", total_provider_tokens=1200),
    )

    assert response.status_code == 402
    error = response.json()["error"]
    assert error["code"] == "INSUFFICIENT_TOKENS"
    assert error["details"] == {
        "requiredTokens": 2400,
        "availableTokens": 900,
        "contactAdminMessage": "账号余额不足，请联系管理员充值。",
    }
    assert app.state.services.tokens.getBalance("user_approved_low") == 900
    assert len(app.state.services.tokens.listLedger("user_approved_low")) == 1
    assert app.state.store.api_usage_logs == []


def test_rag_idempotency_key_prevents_duplicate_token_charge() -> None:
    app = create_app()
    client = TestClient(app)

    first = client.post(
        "/api/rag/ask",
        headers={"x-user-id": "user_approved"},
        json=rag_payload("rag_duplicate_001", total_provider_tokens=500),
    )
    second = client.post(
        "/api/rag/ask",
        headers={"x-user-id": "user_approved"},
        json=rag_payload("rag_duplicate_001", total_provider_tokens=500),
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["data"]["usage"]["duplicate"] is False
    assert second.json()["data"]["usage"]["duplicate"] is True
    assert first.json()["data"]["usage"]["tokenLedgerId"] == second.json()["data"]["usage"][
        "tokenLedgerId"
    ]
    assert app.state.services.tokens.getBalance("user_approved") == 500
    assert len(app.state.services.tokens.listLedger("user_approved")) == 2
    assert len(app.state.store.api_usage_logs) == 1


def test_zero_balance_user_is_blocked_before_ai_dialogue_metering() -> None:
    app = create_app()
    app.state.store.create_user(
        user_id="user_zero_balance",
        email="zero@example.com",
        display_name="Zero Balance",
        role=UserRole.USER,
        status=UserStatus.APPROVED,
        low_balance_threshold=100,
    )
    client = TestClient(app)

    response = client.post(
        "/api/rag/ask",
        headers={"x-user-id": "user_zero_balance"},
        json=rag_payload("rag_zero_001", total_provider_tokens=300),
    )

    assert response.status_code == 402
    error = response.json()["error"]
    assert error["code"] == "INSUFFICIENT_TOKENS"
    assert error["message"] == "账号余额不足，请联系管理员充值。"
    assert error["details"] == {
        "requiredTokens": 1,
        "availableTokens": 0,
        "contactAdminMessage": "账号余额不足，请联系管理员充值。",
    }
    assert app.state.services.tokens.getBalance("user_zero_balance") == 0
    assert app.state.services.tokens.listLedger("user_zero_balance") == []
    assert app.state.store.api_usage_logs == []


def test_suspended_user_cannot_call_rag_even_with_tokens() -> None:
    app = create_app()
    app.state.services.tokens.grantTokens(
        adminId="admin_001",
        userId="user_suspended",
        amount=5000,
        reason="Suspended user still blocked.",
    )
    client = TestClient(app)

    response = client.post(
        "/api/rag/ask",
        headers={"x-user-id": "user_suspended"},
        json=rag_payload("rag_suspended_001"),
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "ACCOUNT_SUSPENDED"
    assert app.state.services.tokens.getBalance("user_suspended") == 5000


def test_regular_user_cannot_view_admin_usage_logs() -> None:
    client = TestClient(create_app())

    response = client.get(
        "/api/admin/users/user_approved/usage",
        headers={"x-user-id": "user_approved"},
    )

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"
