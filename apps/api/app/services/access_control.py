from __future__ import annotations

from typing import Protocol

from app.core.errors import ApiException
from app.errors import AppError, forbidden, unauthorized
from app.models import User
from app.models.access_contracts import (
    AccessStatus,
    FeatureAccess,
    FeatureType,
    UserRecord,
    UserRole,
    UserStatus,
)
from app.store import InMemoryStore


class TokenQuotaReader(Protocol):
    def estimateFeatureCost(
        self,
        featureType: FeatureType,
        payload: dict[str, object] | None = None,
    ) -> int:
        ...

    def getBalance(self, userId: str) -> int:
        ...

    def isLowBalance(self, userId: str) -> bool:
        ...


STATUS_MESSAGES: dict[str, tuple[str, str, int]] = {
    "pending_approval": (
        "ACCOUNT_PENDING_APPROVAL",
        "Account is pending admin approval.",
        403,
    ),
    "rejected": ("ACCOUNT_REJECTED", "Account has been rejected.", 403),
    "suspended": ("ACCOUNT_SUSPENDED", "Account has been suspended.", 403),
}


class AccessControlService:
    def __init__(self, store: InMemoryStore | None = None) -> None:
        self._store = store
        self._tokens: TokenQuotaReader | None = None

    def bind_token_service(self, tokens: TokenQuotaReader) -> None:
        self._tokens = tokens

    def can_use_protected_apis(self, user: User) -> bool:
        return user.status == "approved"

    def account_message(self, user: User) -> str:
        if user.status == "approved":
            return "Account approved."
        return STATUS_MESSAGES.get(
            user.status,
            ("FORBIDDEN", "Account status is unknown.", 403),
        )[1]

    def ensure_metered_access(self, user: User) -> None:
        if user.status == "approved":
            return
        code, message, status_code = STATUS_MESSAGES.get(
            user.status,
            ("FORBIDDEN", "Account cannot use this API.", 403),
        )
        raise ApiException(code, message, status_code)

    def getAccessStatus(self, userId: str) -> AccessStatus:
        store = self._require_store()
        user = store.get_user(userId)
        can_use = user.status == UserStatus.APPROVED
        message = "Account approved." if can_use else STATUS_MESSAGES[user.status.value][1]
        return AccessStatus(
            user_id=user.id,
            status=user.status,
            can_use_protected_apis=can_use,
            message=message,
            updated_at=user.updated_at,
        )

    def requireLogin(self, user: UserRecord | None) -> UserRecord:
        if user is None:
            raise unauthorized()
        return user

    def requireApproved(self, user: UserRecord | None) -> UserRecord:
        user = self.requireLogin(user)
        if user.status != UserStatus.APPROVED:
            code, message, status_code = STATUS_MESSAGES[user.status.value]
            raise AppError(code=code, message=message, status_code=status_code)
        return user

    def requireAdmin(self, user: UserRecord | None) -> UserRecord:
        user = self.requireLogin(user)
        if user.role != UserRole.ADMIN:
            raise forbidden()
        return user

    def canUseFeature(
        self,
        userId: str,
        featureType: FeatureType,
        payload: dict[str, object] | None = None,
    ) -> FeatureAccess:
        store = self._require_store()
        user = store.get_user(userId)
        estimated_cost = (
            self._tokens.estimateFeatureCost(featureType, payload) if self._tokens else 0
        )
        try:
            self.requireApproved(user)
        except AppError as exc:
            return FeatureAccess(
                allowed=False,
                feature_type=featureType,
                estimated_cost=estimated_cost,
                remaining_tokens=0,
                lowTokenWarning=False,
                error_code=exc.code,
            )

        balance = self._tokens.getBalance(userId) if self._tokens else 0
        low = self._tokens.isLowBalance(userId) if self._tokens else False
        if balance < estimated_cost:
            return FeatureAccess(
                allowed=False,
                feature_type=featureType,
                estimated_cost=estimated_cost,
                remaining_tokens=balance,
                lowTokenWarning=low,
                error_code="INSUFFICIENT_TOKENS",
            )
        return FeatureAccess(
            allowed=True,
            feature_type=featureType,
            estimated_cost=estimated_cost,
            remaining_tokens=balance,
            lowTokenWarning=low,
        )

    def _require_store(self) -> InMemoryStore:
        if self._store is None:
            raise RuntimeError("AccessControlService was not configured with an in-memory store.")
        return self._store


access_control_service = AccessControlService()
