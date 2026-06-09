from __future__ import annotations

from app.errors import validation_error
from app.models import (
    ApiUsageLog,
    ApprovalResult,
    PaginatedUsers,
    StatusChangeResult,
    TokenLedgerEntry,
    UserRecord,
    UserStatus,
)
from app.services.access_control import AccessControlService
from app.services.token_quota import TokenQuotaService
from app.store import InMemoryStore, utc_now


class AdminUserService:
    def __init__(
        self,
        store: InMemoryStore,
        access: AccessControlService,
        tokens: TokenQuotaService,
    ) -> None:
        self._store = store
        self._access = access
        self._tokens = tokens

    def listUsers(
        self,
        status: UserStatus | None = None,
        search: str | None = None,
        pagination: dict[str, int | str | None] | None = None,
    ) -> PaginatedUsers:
        users = list(self._store.users.values())
        if status is not None:
            users = [user for user in users if user.status == status]
        if search:
            query = search.lower()
            users = [
                user
                for user in users
                if query in user.email.lower() or query in user.display_name.lower()
            ]
        users.sort(key=lambda user: user.created_at)

        limit = int((pagination or {}).get("limit") or 50)
        cursor = (pagination or {}).get("cursor")
        start_index = int(cursor) if isinstance(cursor, str) and cursor.isdigit() else 0
        page = users[start_index : start_index + limit]
        next_index = start_index + len(page)
        has_more = next_index < len(users)
        return PaginatedUsers(
            users=page,
            next_cursor=str(next_index) if has_more else None,
            has_more=has_more,
        )

    def listPendingUsers(self) -> list[UserRecord]:
        return self.listUsers(status=UserStatus.PENDING_APPROVAL).users

    def approveUser(
        self,
        adminId: str,
        userId: str,
        initialTokens: int,
        lowThreshold: int,
        note: str,
    ) -> ApprovalResult:
        admin = self._store.get_user(adminId)
        self._access.requireAdmin(admin)
        if initialTokens < 0:
            raise validation_error("Initial token grant cannot be negative.")
        if lowThreshold < 0:
            raise validation_error("Low balance threshold cannot be negative.")

        user = self._store.get_user(userId)
        now = utc_now()
        user.status = UserStatus.APPROVED
        user.approved_at = now
        user.approved_by = adminId
        user.status_reason = note
        user.low_balance_threshold = lowThreshold
        user.updated_at = now

        action = self._store.add_admin_action(
            admin_user_id=adminId,
            target_user_id=userId,
            action="approve_user",
            reason=note,
            metadata={"initialTokens": initialTokens, "lowThreshold": lowThreshold},
        )
        ledger = self._tokens.recordInitialGrant(
            adminId=adminId,
            userId=userId,
            amount=initialTokens,
            relatedEntityId=action.id,
            reason=note,
        )
        return ApprovalResult(
            user_id=userId,
            status=user.status,
            admin_action_id=action.id,
            token_ledger_id=ledger.id if ledger else None,
            token_balance=self._tokens.getBalance(userId),
        )

    def rejectUser(self, adminId: str, userId: str, reason: str) -> StatusChangeResult:
        return self._change_status(adminId, userId, UserStatus.REJECTED, "reject_user", reason)

    def suspendUser(self, adminId: str, userId: str, reason: str) -> StatusChangeResult:
        return self._change_status(adminId, userId, UserStatus.SUSPENDED, "suspend_user", reason)

    def reactivateUser(self, adminId: str, userId: str, reason: str) -> StatusChangeResult:
        return self._change_status(adminId, userId, UserStatus.APPROVED, "reactivate_user", reason)

    def getUserUsage(self, adminId: str, userId: str) -> list[ApiUsageLog]:
        admin = self._store.get_user(adminId)
        self._access.requireAdmin(admin)
        self._store.get_user(userId)
        return [usage for usage in self._store.api_usage_logs if usage.user_id == userId]

    def getUserTokenLedger(self, adminId: str, userId: str) -> list[TokenLedgerEntry]:
        admin = self._store.get_user(adminId)
        self._access.requireAdmin(admin)
        return self._tokens.listLedger(userId)

    def _change_status(
        self,
        adminId: str,
        userId: str,
        status: UserStatus,
        action_name: str,
        reason: str,
    ) -> StatusChangeResult:
        admin = self._store.get_user(adminId)
        self._access.requireAdmin(admin)
        user = self._store.get_user(userId)
        now = utc_now()
        user.status = status
        user.status_reason = reason
        user.updated_at = now
        action = self._store.add_admin_action(
            admin_user_id=adminId,
            target_user_id=userId,
            action=action_name,
            reason=reason,
        )
        return StatusChangeResult(user_id=userId, status=status, admin_action_id=action.id)
