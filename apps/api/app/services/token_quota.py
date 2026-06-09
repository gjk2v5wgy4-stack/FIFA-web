from __future__ import annotations

from typing import Any

from app.errors import insufficient_tokens, validation_error
from app.models import (
    ApiUsageLog,
    FeatureType,
    TokenConsumptionResult,
    TokenLedgerEntry,
    TokenOperationResult,
)
from app.services.access_control import AccessControlService
from app.store import InMemoryStore

FEATURE_COSTS: dict[FeatureType, int] = {
    FeatureType.RAG_QUERY: 1_200,
    FeatureType.MATCH_PREDICTION: 800,
    FeatureType.WHAT_IF_PREDICTION: 1_000,
    FeatureType.GROUP_SIMULATION: 1_500,
    FeatureType.REPORT_GENERATION: 3_000,
}


class TokenQuotaService:
    def __init__(self, store: InMemoryStore, access: AccessControlService) -> None:
        self._store = store
        self._access = access

    def getBalance(self, userId: str) -> int:
        self._store.get_user(userId)
        return sum(
            entry.amount_tokens for entry in self._store.token_ledger if entry.user_id == userId
        )

    def getLowThreshold(self, userId: str) -> int:
        return self._store.get_user(userId).low_balance_threshold

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

        user = self._store.get_user(userId)
        self._access.requireApproved(user)

        existing = self._store.find_ledger_by_idempotency_key(
            user_id=userId,
            idempotency_key=requestId,
            feature_type=featureType,
        )
        if existing is not None:
            usage = self._store.find_usage_by_ledger_id(existing.id)
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
        ledger = self._store.add_token_ledger_entry(
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
        self._store.get_user(userId)
        return [entry for entry in self._store.token_ledger if entry.user_id == userId]

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
        return self._store.add_token_ledger_entry(
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
        admin = self._store.get_user(adminId)
        self._access.requireAdmin(admin)
        self._store.get_user(userId)

        if amount < 0:
            self.ensureSufficientBalance(userId, abs(amount))

        action_log = self._store.add_admin_action(
            admin_user_id=adminId,
            target_user_id=userId,
            action=action,
            reason=reason,
            metadata=metadata,
        )
        ledger = self._store.add_token_ledger_entry(
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
        return self._store.add_api_usage_log(
            user_id=userId,
            feature_type=featureType,
            request_id=requestId,
            internal_tokens_charged=amount,
            token_ledger_id=ledger.id,
            related_entity_type=featureType.value,
            related_entity_id=requestId,
            total_provider_tokens=amount,
        )
