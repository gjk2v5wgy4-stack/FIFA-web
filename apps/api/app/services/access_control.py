from __future__ import annotations

from typing import Protocol

from app.errors import AppError, forbidden, unauthorized
from app.models import AccessStatus, FeatureAccess, FeatureType, UserRecord, UserRole, UserStatus
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


STATUS_ERRORS: dict[UserStatus, tuple[str, str, int]] = {
    UserStatus.PENDING_APPROVAL: (
        "ACCOUNT_PENDING_APPROVAL",
        "Account is pending admin approval.",
        403,
    ),
    UserStatus.REJECTED: ("ACCOUNT_REJECTED", "Account has been rejected.", 403),
    UserStatus.SUSPENDED: ("ACCOUNT_SUSPENDED", "Account has been suspended.", 403),
}


class AccessControlService:
    def __init__(self, store: InMemoryStore) -> None:
        self._store = store
        self._tokens: TokenQuotaReader | None = None

    def bind_token_service(self, tokens: TokenQuotaReader) -> None:
        self._tokens = tokens

    def getAccessStatus(self, userId: str) -> AccessStatus:
        user = self._store.get_user(userId)
        can_use = user.status == UserStatus.APPROVED
        message = "Account approved." if can_use else STATUS_ERRORS[user.status][1]
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
            code, message, status_code = STATUS_ERRORS[user.status]
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
        user = self._store.get_user(userId)
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
