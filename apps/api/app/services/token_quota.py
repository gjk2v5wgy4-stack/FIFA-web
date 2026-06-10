from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import ApiException
from app.core.ids import new_id
from app.errors import insufficient_tokens, validation_error
from app.models import AIUsageLog, TokenLedger, User
from app.models.access_contracts import (
    ApiUsageLog,
    FeatureType,
    TokenConsumptionResult,
    TokenLedgerEntry,
    TokenOperationResult,
)
from app.store import InMemoryStore

FEATURE_COSTS: dict[FeatureType, int] = {
    FeatureType.RAG_QUERY: 1_200,
    FeatureType.MATCH_PREDICTION: 800,
    FeatureType.WHAT_IF_PREDICTION: 1_000,
    FeatureType.GROUP_SIMULATION: 1_500,
    FeatureType.REPORT_GENERATION: 3_000,
}


@dataclass(frozen=True)
class UsageCharge:
    tokens_charged: int
    remaining_tokens: int
    low_balance: bool
    low_token_warning: bool
    token_ledger_id: str
    ai_usage_log_id: str
    duplicate: bool = False

    def to_contract(self) -> dict[str, object]:
        return {
            "tokensCharged": self.tokens_charged,
            "remainingTokens": self.remaining_tokens,
            "lowBalance": self.low_balance,
            "lowTokenWarning": self.low_token_warning,
        }


class TokenQuotaService:
    def __init__(self, store: InMemoryStore | None = None, access: Any | None = None) -> None:
        self._store = store
        self._access = access

    def get_balance(self, session: Session, user_id: str) -> int:
        value = session.scalar(
            select(func.coalesce(func.sum(TokenLedger.amount_tokens), 0)).where(
                TokenLedger.user_id == user_id
            )
        )
        return int(value or 0)

    def ledger_entries(self, session: Session, user_id: str) -> list[TokenLedger]:
        return list(
            session.scalars(
                select(TokenLedger)
                .where(TokenLedger.user_id == user_id)
                .order_by(TokenLedger.created_at.desc())
            )
        )

    def create_admin_ledger_entry(
        self,
        session: Session,
        user_id: str,
        admin_user_id: str,
        amount_tokens: int,
        reason: str,
        related_entity_type: str,
        related_entity_id: str,
    ) -> TokenLedger:
        entry = TokenLedger(
            id=new_id("tl"),
            user_id=user_id,
            admin_user_id=admin_user_id,
            amount_tokens=amount_tokens,
            reason=reason,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            metadata_json={"source": "admin_token_change"},
        )
        session.add(entry)
        return entry

    def charge_for_usage(
        self,
        session: Session,
        user: User,
        usage_type: str,
        related_entity_type: str,
        related_entity_id: str,
        tokens_required: int,
        model_version: str = "stub-0.1.0",
    ) -> UsageCharge:
        if tokens_required <= 0:
            raise ApiException("VALIDATION_ERROR", "Token charge must be positive.", 422)

        existing = session.scalar(
            select(TokenLedger).where(
                TokenLedger.user_id == user.id,
                TokenLedger.idempotency_key == related_entity_id,
            )
        )
        if existing is not None:
            usage = session.scalar(
                select(AIUsageLog).where(AIUsageLog.token_ledger_id == existing.id)
            )
            remaining = self.get_balance(session, user.id)
            low = remaining < get_settings().low_balance_threshold
            return UsageCharge(
                tokens_charged=abs(existing.amount_tokens),
                remaining_tokens=remaining,
                low_balance=low,
                low_token_warning=low,
                token_ledger_id=existing.id,
                ai_usage_log_id=usage.id if usage else "",
                duplicate=True,
            )

        balance = self.get_balance(session, user.id)
        if balance < tokens_required:
            raise ApiException(
                "INSUFFICIENT_TOKENS",
                "Not enough tokens for this action.",
                402,
                {"requiredTokens": tokens_required, "availableTokens": balance},
            )

        ledger = TokenLedger(
            id=new_id("tl"),
            user_id=user.id,
            admin_user_id=None,
            amount_tokens=-tokens_required,
            reason=usage_type,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            idempotency_key=related_entity_id,
            metadata_json={"source": "token_quota_service", "usageType": usage_type},
        )
        usage_log = AIUsageLog(
            id=new_id("usage"),
            user_id=user.id,
            usage_type=usage_type,
            model="stub",
            model_version=model_version,
            prompt_tokens=tokens_required,
            completion_tokens=0,
            embedding_tokens=0,
            total_provider_tokens=tokens_required,
            estimated_cost=Decimal("0"),
            internal_tokens_charged=tokens_required,
            token_ledger_id=ledger.id,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
        )
        session.add_all([ledger, usage_log])
        session.flush()
        remaining = balance - tokens_required
        low = remaining < get_settings().low_balance_threshold
        return UsageCharge(
            tokens_charged=tokens_required,
            remaining_tokens=remaining,
            low_balance=low,
            low_token_warning=low,
            token_ledger_id=ledger.id,
            ai_usage_log_id=usage_log.id,
        )

    def getBalance(self, userId: str) -> int:
        store = self._require_store()
        store.get_user(userId)
        return sum(entry.amount_tokens for entry in store.token_ledger if entry.user_id == userId)

    def getLowThreshold(self, userId: str) -> int:
        return self._require_store().get_user(userId).low_balance_threshold

    def isLowBalance(self, userId: str) -> bool:
        return self.getBalance(userId) <= self.getLowThreshold(userId)

    def estimateFeatureCost(
        self,
        featureType: FeatureType,
        payload: dict[str, object] | None = None,
    ) -> int:
        base_cost = FEATURE_COSTS[featureType]
        if featureType == FeatureType.GROUP_SIMULATION and payload:
            iterations = payload.get("iterations")
            if isinstance(iterations, int) and iterations > 10_000:
                return base_cost + ((iterations - 10_000) // 10_000) * 500
        return base_cost

    def ensureSufficientBalance(self, userId: str, estimatedCost: int) -> None:
        if estimatedCost < 0:
            raise validation_error("Estimated cost cannot be negative.")
        available = self.getBalance(userId)
        if available < estimatedCost:
            raise insufficient_tokens(required_tokens=estimatedCost, available_tokens=available)

    def consumeTokens(
        self,
        userId: str,
        amount: int,
        requestId: str,
        featureType: FeatureType,
    ) -> TokenConsumptionResult:
        if amount <= 0:
            raise validation_error("Token consumption amount must be positive.")
        if not requestId:
            raise validation_error("requestId is required for token consumption.")

        store = self._require_store()
        user = store.get_user(userId)
        self._require_access().requireApproved(user)

        existing = store.find_ledger_by_idempotency_key(
            user_id=userId,
            idempotency_key=requestId,
            feature_type=featureType,
        )
        if existing is not None:
            usage = store.find_usage_by_ledger_id(existing.id)
            if usage is None:
                usage = self._record_api_usage(
                    userId=userId,
                    featureType=featureType,
                    requestId=requestId,
                    amount=abs(existing.amount_tokens),
                    ledger=existing,
                )
            return TokenConsumptionResult(
                user_id=userId,
                token_ledger_id=existing.id,
                api_usage_log_id=usage.id,
                tokens_charged=abs(existing.amount_tokens),
                remaining_tokens=self.getBalance(userId),
                lowTokenWarning=self.isLowBalance(userId),
                duplicate=True,
            )

        self.ensureSufficientBalance(userId, amount)
        ledger = store.add_token_ledger_entry(
            user_id=userId,
            admin_user_id=None,
            amount_tokens=-amount,
            reason=featureType.value,
            related_entity_type=featureType.value,
            related_entity_id=requestId,
            idempotency_key=requestId,
            metadata={"featureType": featureType.value},
        )
        usage = self._record_api_usage(
            userId=userId,
            featureType=featureType,
            requestId=requestId,
            amount=amount,
            ledger=ledger,
        )
        return TokenConsumptionResult(
            user_id=userId,
            token_ledger_id=ledger.id,
            api_usage_log_id=usage.id,
            tokens_charged=amount,
            remaining_tokens=self.getBalance(userId),
            lowTokenWarning=self.isLowBalance(userId),
            duplicate=False,
        )

    def grantTokens(
        self,
        adminId: str,
        userId: str,
        amount: int,
        reason: str,
    ) -> TokenOperationResult:
        if amount <= 0:
            raise validation_error("Grant amount must be positive.")
        return self._admin_token_change(
            adminId=adminId,
            userId=userId,
            amount=amount,
            reason=reason,
            action="grant_tokens",
            ledger_reason="admin_grant",
        )

    def adjustTokens(
        self,
        adminId: str,
        userId: str,
        amount: int,
        reason: str,
    ) -> TokenOperationResult:
        if amount == 0:
            raise validation_error("Adjustment amount cannot be zero.")
        return self._admin_token_change(
            adminId=adminId,
            userId=userId,
            amount=amount,
            reason=reason,
            action="adjust_tokens",
            ledger_reason="admin_adjustment",
        )

    def refundTokens(
        self,
        adminId: str,
        userId: str,
        amount: int,
        reason: str,
    ) -> TokenOperationResult:
        if amount <= 0:
            raise validation_error("Refund amount must be positive.")
        return self._admin_token_change(
            adminId=adminId,
            userId=userId,
            amount=amount,
            reason=reason,
            action="adjust_tokens",
            ledger_reason="admin_adjustment",
            metadata={"operation": "refund_tokens"},
        )

    def revokeTokens(
        self,
        adminId: str,
        userId: str,
        amount: int,
        reason: str,
    ) -> TokenOperationResult:
        if amount <= 0:
            raise validation_error("Revoke amount must be positive.")
        return self._admin_token_change(
            adminId=adminId,
            userId=userId,
            amount=-amount,
            reason=reason,
            action="revoke_tokens",
            ledger_reason="admin_revoke",
        )

    def listLedger(self, userId: str) -> list[TokenLedgerEntry]:
        store = self._require_store()
        store.get_user(userId)
        return [entry for entry in store.token_ledger if entry.user_id == userId]

    def recordInitialGrant(
        self,
        *,
        adminId: str,
        userId: str,
        amount: int,
        relatedEntityId: str,
        reason: str,
    ) -> TokenLedgerEntry | None:
        if amount < 0:
            raise validation_error("Initial token grant cannot be negative.")
        if amount == 0:
            return None
        return self._require_store().add_token_ledger_entry(
            user_id=userId,
            admin_user_id=adminId,
            amount_tokens=amount,
            reason="admin_initial_grant",
            related_entity_type="admin_action",
            related_entity_id=relatedEntityId,
            metadata={"reason": reason},
        )

    def _admin_token_change(
        self,
        *,
        adminId: str,
        userId: str,
        amount: int,
        reason: str,
        action: str,
        ledger_reason: str,
        metadata: dict[str, Any] | None = None,
    ) -> TokenOperationResult:
        store = self._require_store()
        admin = store.get_user(adminId)
        self._require_access().requireAdmin(admin)
        store.get_user(userId)

        if amount < 0:
            self.ensureSufficientBalance(userId, abs(amount))

        action_log = store.add_admin_action(
            admin_user_id=adminId,
            target_user_id=userId,
            action=action,
            reason=reason,
            metadata=metadata,
        )
        ledger = store.add_token_ledger_entry(
            user_id=userId,
            admin_user_id=adminId,
            amount_tokens=amount,
            reason=ledger_reason,
            related_entity_type="admin_action",
            related_entity_id=action_log.id,
            metadata={"reason": reason, **(metadata or {})},
        )
        return TokenOperationResult(
            user_id=userId,
            admin_action_id=action_log.id,
            token_ledger_id=ledger.id,
            amount_tokens=amount,
            token_balance=self.getBalance(userId),
        )

    def _record_api_usage(
        self,
        *,
        userId: str,
        featureType: FeatureType,
        requestId: str,
        amount: int,
        ledger: TokenLedgerEntry,
    ) -> ApiUsageLog:
        return self._require_store().add_api_usage_log(
            user_id=userId,
            feature_type=featureType,
            request_id=requestId,
            internal_tokens_charged=amount,
            token_ledger_id=ledger.id,
            related_entity_type=featureType.value,
            related_entity_id=requestId,
            total_provider_tokens=amount,
        )

    def _require_store(self) -> InMemoryStore:
        if self._store is None:
            raise RuntimeError("TokenQuotaService was not configured with an in-memory store.")
        return self._store

    def _require_access(self) -> Any:
        if self._access is None:
            raise RuntimeError("TokenQuotaService was not configured with access control.")
        return self._access


token_quota_service = TokenQuotaService()
