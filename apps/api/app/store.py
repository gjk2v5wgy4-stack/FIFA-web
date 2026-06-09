from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from app.errors import not_found
from app.models.access_contracts import (
    AdminActionRecord,
    ApiUsageLog,
    FeatureType,
    TokenLedgerEntry,
    UserRecord,
    UserRole,
    UserStatus,
)


def utc_now() -> datetime:
    return datetime.now(UTC)


class InMemoryStore:
    def __init__(self) -> None:
        self.users: dict[str, UserRecord] = {}
        self.token_ledger: list[TokenLedgerEntry] = []
        self.admin_action_logs: list[AdminActionRecord] = []
        self.api_usage_logs: list[ApiUsageLog] = []
        self._counters: dict[str, int] = {}

    def next_id(self, prefix: str) -> str:
        next_value = self._counters.get(prefix, 0) + 1
        self._counters[prefix] = next_value
        return f"{prefix}_{next_value:03d}"

    def create_user(
        self,
        *,
        user_id: str,
        email: str,
        display_name: str,
        role: UserRole,
        status: UserStatus,
        low_balance_threshold: int = 10_000,
    ) -> UserRecord:
        now = utc_now()
        user = UserRecord(
            id=user_id,
            email=email,
            display_name=display_name,
            role=role,
            status=status,
            low_balance_threshold=low_balance_threshold,
            created_at=now,
            updated_at=now,
        )
        self.users[user_id] = user
        return user

    def get_user(self, user_id: str) -> UserRecord:
        user = self.users.get(user_id)
        if user is None:
            raise not_found(f"User {user_id} was not found.")
        return user

    def add_admin_action(
        self,
        *,
        admin_user_id: str,
        target_user_id: str,
        action: str,
        reason: str,
        metadata: dict[str, Any] | None = None,
    ) -> AdminActionRecord:
        log = AdminActionRecord(
            id=self.next_id("admin_action"),
            admin_user_id=admin_user_id,
            target_user_id=target_user_id,
            action=action,
            reason=reason,
            metadata=metadata or {},
            created_at=utc_now(),
        )
        self.admin_action_logs.append(log)
        return log

    def add_token_ledger_entry(
        self,
        *,
        user_id: str,
        admin_user_id: str | None,
        amount_tokens: int,
        reason: str,
        related_entity_type: str,
        related_entity_id: str,
        idempotency_key: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> TokenLedgerEntry:
        entry = TokenLedgerEntry(
            id=self.next_id("tl"),
            user_id=user_id,
            admin_user_id=admin_user_id,
            amount_tokens=amount_tokens,
            reason=reason,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            idempotency_key=idempotency_key,
            metadata=metadata or {},
            created_at=utc_now(),
        )
        self.token_ledger.append(entry)
        return entry

    def add_api_usage_log(
        self,
        *,
        user_id: str,
        feature_type: FeatureType,
        request_id: str,
        internal_tokens_charged: int,
        token_ledger_id: str,
        related_entity_type: str,
        related_entity_id: str,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        embedding_tokens: int = 0,
        total_provider_tokens: int = 0,
        estimated_cost: float = 0.0,
    ) -> ApiUsageLog:
        log = ApiUsageLog(
            id=self.next_id("api_usage"),
            user_id=user_id,
            feature_type=feature_type,
            request_id=request_id,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            embedding_tokens=embedding_tokens,
            total_provider_tokens=total_provider_tokens,
            estimated_cost=estimated_cost,
            internal_tokens_charged=internal_tokens_charged,
            token_ledger_id=token_ledger_id,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            created_at=utc_now(),
        )
        self.api_usage_logs.append(log)
        return log

    def find_ledger_by_idempotency_key(
        self,
        *,
        user_id: str,
        idempotency_key: str,
        feature_type: FeatureType,
    ) -> TokenLedgerEntry | None:
        for entry in self.token_ledger:
            if (
                entry.user_id == user_id
                and entry.idempotency_key == idempotency_key
                and entry.reason == feature_type.value
            ):
                return entry
        return None

    def find_usage_by_ledger_id(self, token_ledger_id: str) -> ApiUsageLog | None:
        for usage in self.api_usage_logs:
            if usage.token_ledger_id == token_ledger_id:
                return usage
        return None

    @classmethod
    def seed_default(cls) -> InMemoryStore:
        store = cls()
        store.create_user(
            user_id="admin_001",
            email="admin@example.com",
            display_name="Admin",
            role=UserRole.ADMIN,
            status=UserStatus.APPROVED,
        )
        store.create_user(
            user_id="user_pending",
            email="pending@example.com",
            display_name="Pending User",
            role=UserRole.USER,
            status=UserStatus.PENDING_APPROVAL,
        )
        store.create_user(
            user_id="user_rejected",
            email="rejected@example.com",
            display_name="Rejected User",
            role=UserRole.USER,
            status=UserStatus.REJECTED,
        )
        store.create_user(
            user_id="user_suspended",
            email="suspended@example.com",
            display_name="Suspended User",
            role=UserRole.USER,
            status=UserStatus.SUSPENDED,
        )
        store.create_user(
            user_id="user_approved",
            email="approved@example.com",
            display_name="Approved User",
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            low_balance_threshold=1_000,
        )
        store.add_token_ledger_entry(
            user_id="user_approved",
            admin_user_id="admin_001",
            amount_tokens=1_500,
            reason="admin_initial_grant",
            related_entity_type="seed",
            related_entity_id="seed_user_approved",
        )
        store.create_user(
            user_id="user_approved_low",
            email="low@example.com",
            display_name="Low Balance User",
            role=UserRole.USER,
            status=UserStatus.APPROVED,
            low_balance_threshold=1_000,
        )
        store.add_token_ledger_entry(
            user_id="user_approved_low",
            admin_user_id="admin_001",
            amount_tokens=900,
            reason="admin_initial_grant",
            related_entity_type="seed",
            related_entity_id="seed_user_approved_low",
        )
        return store
