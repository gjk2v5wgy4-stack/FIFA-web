from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from app.core.config import get_settings
from app.models import AdminActionLog, AIUsageLog, TokenLedger, User
from app.models.access_contracts import UserRecord
from app.services.access_control import access_control_service
from app.services.token_quota import token_quota_service


def iso_utc(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


def user_contract(user: User | UserRecord) -> dict[str, object]:
    return {
        "userId": user.id,
        "email": user.email,
        "displayName": user.display_name,
        "role": user.role,
        "status": user.status,
    }


def user_admin_contract(user: User, balance: int) -> dict[str, object]:
    return {
        "userId": user.id,
        "email": user.email,
        "displayName": user.display_name,
        "status": user.status,
        "tokenBalance": balance,
    }


def access_status_contract(user: User) -> dict[str, object]:
    return {
        "userId": user.id,
        "status": user.status,
        "canUseProtectedApis": access_control_service.can_use_protected_apis(user),
        "message": access_control_service.account_message(user),
        "updatedAt": iso_utc(user.updated_at),
    }


def ledger_contract(entry: TokenLedger) -> dict[str, object]:
    return {
        "ledgerId": entry.id,
        "amountTokens": entry.amount_tokens,
        "reason": entry.reason,
        "relatedEntityType": entry.related_entity_type,
        "relatedEntityId": entry.related_entity_id,
        "createdAt": iso_utc(entry.created_at),
    }


def usage_contract(entry: AIUsageLog) -> dict[str, object]:
    estimated_cost: Decimal | float = entry.estimated_cost
    return {
        "usageLogId": entry.id,
        "usageType": entry.usage_type,
        "model": entry.model,
        "modelVersion": entry.model_version,
        "tokensCharged": entry.internal_tokens_charged,
        "providerUsage": {
            "prompt_tokens": entry.prompt_tokens,
            "completion_tokens": entry.completion_tokens,
            "embedding_tokens": entry.embedding_tokens,
            "total_provider_tokens": entry.total_provider_tokens,
            "estimated_cost": float(estimated_cost),
        },
        "relatedEntityType": entry.related_entity_type,
        "relatedEntityId": entry.related_entity_id,
        "createdAt": iso_utc(entry.created_at),
    }


def action_log_contract(entry: AdminActionLog) -> dict[str, Any]:
    return {
        "adminActionId": entry.id,
        "adminUserId": entry.admin_user_id,
        "targetUserId": entry.target_user_id,
        "action": entry.action,
        "reason": entry.reason,
        "metadata": entry.metadata_json,
        "createdAt": iso_utc(entry.created_at),
    }


def token_status_contract(user: User, balance: int, ledger: list[TokenLedger]) -> dict[str, object]:
    threshold = get_settings().low_balance_threshold
    return {
        "userId": user.id,
        "balanceTokens": balance,
        "lowBalance": balance < threshold,
        "lowBalanceThreshold": threshold,
        "contactAdminMessage": "Token balance is low. Please contact the admin.",
        "ledger": [ledger_contract(entry) for entry in ledger],
    }


def token_status_for_user(session: Any, user: User) -> dict[str, object]:
    balance = token_quota_service.get_balance(session, user.id)
    ledger = token_quota_service.ledger_entries(session, user.id)
    return token_status_contract(user, balance, ledger)
