import pytest

from app.errors import AppError
from app.models import FeatureType, ServiceBundle, UserRole, UserStatus
from app.services.factory import create_services
from app.store import InMemoryStore


def make_services() -> tuple[ServiceBundle, InMemoryStore]:
    store = InMemoryStore()
    store.create_user(
        user_id="admin_001",
        email="admin@example.com",
        display_name="Admin",
        role=UserRole.ADMIN,
        status=UserStatus.APPROVED,
    )
    store.create_user(
        user_id="user_001",
        email="user@example.com",
        display_name="User",
        role=UserRole.USER,
        status=UserStatus.PENDING_APPROVAL,
    )
    return create_services(store), store


def test_admin_approval_sets_status_and_initial_tokens_through_ledger() -> None:
    services, store = make_services()

    result = services.admin_users.approveUser(
        adminId="admin_001",
        userId="user_001",
        initialTokens=5_000,
        lowThreshold=1_000,
        note="Approved for MVP access.",
    )

    user = store.get_user("user_001")
    assert user.status == UserStatus.APPROVED
    assert user.approved_by == "admin_001"
    assert user.low_balance_threshold == 1_000
    assert services.tokens.getBalance("user_001") == 5_000
    assert result.token_balance == 5_000
    assert result.token_ledger_id is not None

    ledger = services.tokens.listLedger("user_001")
    assert len(ledger) == 1
    assert ledger[0].amount_tokens == 5_000
    assert ledger[0].reason == "admin_initial_grant"
    assert ledger[0].admin_user_id == "admin_001"

    assert len(store.admin_action_logs) == 1
    assert store.admin_action_logs[0].action == "approve_user"
    assert store.admin_action_logs[0].target_user_id == "user_001"


def test_non_admin_cannot_approve_or_grant_tokens() -> None:
    services, _store = make_services()

    with pytest.raises(AppError) as approve_error:
        services.admin_users.approveUser(
            adminId="user_001",
            userId="user_001",
            initialTokens=1_000,
            lowThreshold=500,
            note="Should fail.",
        )
    assert approve_error.value.code == "FORBIDDEN"

    with pytest.raises(AppError) as grant_error:
        services.tokens.grantTokens(
            adminId="user_001",
            userId="user_001",
            amount=1_000,
            reason="Should fail.",
        )
    assert grant_error.value.code == "FORBIDDEN"


def test_consuming_tokens_writes_ledger_usage_log_and_low_balance_warning() -> None:
    services, store = make_services()
    services.admin_users.approveUser(
        adminId="admin_001",
        userId="user_001",
        initialTokens=2_000,
        lowThreshold=1_000,
        note="Approved for MVP access.",
    )

    result = services.tokens.consumeTokens(
        userId="user_001",
        amount=1_200,
        requestId="req_001",
        featureType=FeatureType.RAG_QUERY,
    )

    assert result.tokens_charged == 1_200
    assert result.remaining_tokens == 800
    assert result.lowTokenWarning is True
    assert result.duplicate is False
    assert services.tokens.getBalance("user_001") == 800

    ledger = services.tokens.listLedger("user_001")
    assert [entry.amount_tokens for entry in ledger] == [2_000, -1_200]
    assert ledger[-1].reason == FeatureType.RAG_QUERY.value
    assert ledger[-1].idempotency_key == "req_001"

    assert len(store.api_usage_logs) == 1
    assert store.api_usage_logs[0].feature_type == FeatureType.RAG_QUERY
    assert store.api_usage_logs[0].internal_tokens_charged == 1_200
    assert store.api_usage_logs[0].token_ledger_id == ledger[-1].id


def test_duplicate_request_id_does_not_charge_tokens_twice() -> None:
    services, store = make_services()
    services.admin_users.approveUser(
        adminId="admin_001",
        userId="user_001",
        initialTokens=2_500,
        lowThreshold=500,
        note="Approved for MVP access.",
    )

    first = services.tokens.consumeTokens(
        userId="user_001",
        amount=800,
        requestId="same-request",
        featureType=FeatureType.MATCH_PREDICTION,
    )
    second = services.tokens.consumeTokens(
        userId="user_001",
        amount=800,
        requestId="same-request",
        featureType=FeatureType.MATCH_PREDICTION,
    )

    assert first.duplicate is False
    assert second.duplicate is True
    assert first.token_ledger_id == second.token_ledger_id
    assert services.tokens.getBalance("user_001") == 1_700
    assert len(services.tokens.listLedger("user_001")) == 2
    assert len(store.api_usage_logs) == 1


def test_insufficient_tokens_raises_contract_error_without_negative_balance() -> None:
    services, _store = make_services()
    services.admin_users.approveUser(
        adminId="admin_001",
        userId="user_001",
        initialTokens=500,
        lowThreshold=100,
        note="Approved for MVP access.",
    )

    with pytest.raises(AppError) as exc:
        services.tokens.ensureSufficientBalance(userId="user_001", estimatedCost=800)

    assert exc.value.code == "INSUFFICIENT_TOKENS"
    assert exc.value.details == {"requiredTokens": 800, "availableTokens": 500}
    assert services.tokens.getBalance("user_001") == 500


@pytest.mark.parametrize(
    ("status", "code"),
    [
        (UserStatus.PENDING_APPROVAL, "ACCOUNT_PENDING_APPROVAL"),
        (UserStatus.REJECTED, "ACCOUNT_REJECTED"),
        (UserStatus.SUSPENDED, "ACCOUNT_SUSPENDED"),
    ],
)
def test_unapproved_users_cannot_use_metered_features(status: UserStatus, code: str) -> None:
    services, store = make_services()
    user = store.get_user("user_001")
    user.status = status

    access = services.access.canUseFeature("user_001", FeatureType.RAG_QUERY)
    assert access.allowed is False
    assert access.error_code == code

    with pytest.raises(AppError) as exc:
        services.tokens.consumeTokens(
            userId="user_001",
            amount=100,
            requestId="req_blocked",
            featureType=FeatureType.RAG_QUERY,
        )
    assert exc.value.code == code


def test_admin_adjustment_and_revoke_cannot_make_balance_negative() -> None:
    services, _store = make_services()
    services.admin_users.approveUser(
        adminId="admin_001",
        userId="user_001",
        initialTokens=1_000,
        lowThreshold=200,
        note="Approved for MVP access.",
    )

    adjusted = services.tokens.adjustTokens(
        adminId="admin_001",
        userId="user_001",
        amount=-400,
        reason="Manual correction.",
    )
    assert adjusted.token_balance == 600

    with pytest.raises(AppError) as exc:
        services.tokens.revokeTokens(
            adminId="admin_001",
            userId="user_001",
            amount=700,
            reason="Revoke too much.",
        )
    assert exc.value.code == "INSUFFICIENT_TOKENS"
    assert services.tokens.getBalance("user_001") == 600
