from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import ApiException
from app.core.ids import new_id
from app.errors import validation_error
from app.models import AdminActionLog, User
from app.models.access_contracts import (
    ApiUsageLog,
    ApprovalResult,
    PaginatedUsers,
    StatusChangeResult,
    TokenLedgerEntry,
    UserRecord,
    UserStatus,
)
from app.services.token_quota import TokenQuotaService, token_quota_service
from app.store import InMemoryStore, utc_now


class AdminUserService:
    def __init__(
        self,
        store: InMemoryStore | None = None,
        access: object | None = None,
        tokens: TokenQuotaService | None = None,
    ) -> None:
        self._store = store
        self._access = access
        self._tokens = tokens

    def get_user_or_404(self, session: Session, user_id: str) -> User:
        user = session.get(User, user_id)
        if user is None:
            raise ApiException("NOT_FOUND", "User not found.", 404)
        return user

    def list_users(self, session: Session, status: str | None = None) -> list[User]:
        statement = select(User).order_by(User.created_at.desc())
        if status is not None:
            statement = statement.where(User.status == status)
        return list(session.scalars(statement))

    def record_action(
        self,
        session: Session,
        admin_user: User,
        target_user: User,
        action: str,
        reason: str,
    ) -> AdminActionLog:
        log = AdminActionLog(
            id=new_id("admin_action"),
            admin_user_id=admin_user.id,
            target_user_id=target_user.id,
            action=action,
            reason=reason,
            metadata_json={"source": "admin_user_service"},
        )
        session.add(log)
        return log

    def approve_user(
        self,
        session: Session,
        admin_user: User,
        target_user_id: str,
        reason: str,
        initial_token_grant: int,
    ) -> tuple[User, AdminActionLog, str | None, int]:
        if initial_token_grant < 0:
            raise ApiException("VALIDATION_ERROR", "Initial token grant cannot be negative.", 422)
        target = self.get_user_or_404(session, target_user_id)
        target.status = "approved"
        target.approved_at = datetime.now(UTC)
        target.approved_by = admin_user.id
        target.status_reason = reason
        action = self.record_action(session, admin_user, target, "approve_user", reason)
        ledger_id: str | None = None
        if initial_token_grant > 0:
            ledger = token_quota_service.create_admin_ledger_entry(
                session,
                target.id,
                admin_user.id,
                initial_token_grant,
                "admin_initial_grant",
                "admin_action",
                action.id,
            )
            ledger_id = ledger.id
        session.flush()
        return target, action, ledger_id, token_quota_service.get_balance(session, target.id)

    def set_status(
        self,
        session: Session,
        admin_user: User,
        target_user_id: str,
        status: str,
        action_name: str,
        reason: str,
    ) -> tuple[User, AdminActionLog]:
        target = self.get_user_or_404(session, target_user_id)
        target.status = status
        target.status_reason = reason
        if status == "approved":
            target.approved_at = datetime.now(UTC)
            target.approved_by = admin_user.id
        action = self.record_action(session, admin_user, target, action_name, reason)
        session.flush()
        return target, action

    def change_tokens(
        self,
        session: Session,
        admin_user: User,
        target_user_id: str,
        amount_tokens: int,
        reason: str,
        ledger_reason: str,
        action_name: str,
    ) -> tuple[AdminActionLog, str, int]:
        if amount_tokens == 0:
            raise ApiException("VALIDATION_ERROR", "Token amount cannot be zero.", 422)
        target = self.get_user_or_404(session, target_user_id)
        balance = token_quota_service.get_balance(session, target.id)
        if amount_tokens < 0 and balance < abs(amount_tokens):
            raise ApiException(
                "INSUFFICIENT_TOKENS",
                "Not enough tokens for this action.",
                402,
                {"requiredTokens": abs(amount_tokens), "availableTokens": balance},
            )
        action = self.record_action(session, admin_user, target, action_name, reason)
        ledger = token_quota_service.create_admin_ledger_entry(
            session,
            target.id,
            admin_user.id,
            amount_tokens,
            ledger_reason,
            "admin_action",
            action.id,
        )
        session.flush()
        return action, ledger.id, token_quota_service.get_balance(session, target.id)

    def listUsers(
        self,
        status: UserStatus | None = None,
        search: str | None = None,
        pagination: dict[str, int | str | None] | None = None,
    ) -> PaginatedUsers:
        store = self._require_store()
        users = list(store.users.values())
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
        store = self._require_store()
        admin = store.get_user(adminId)
        self._require_access().requireAdmin(admin)
        if initialTokens < 0:
            raise validation_error("Initial token grant cannot be negative.")
        if lowThreshold < 0:
            raise validation_error("Low balance threshold cannot be negative.")

        user = store.get_user(userId)
        now = utc_now()
        user.status = UserStatus.APPROVED
        user.approved_at = now
        user.approved_by = adminId
        user.status_reason = note
        user.low_balance_threshold = lowThreshold
        user.updated_at = now

        action = store.add_admin_action(
            admin_user_id=adminId,
            target_user_id=userId,
            action="approve_user",
            reason=note,
            metadata={"initialTokens": initialTokens, "lowThreshold": lowThreshold},
        )
        ledger = self._require_tokens().recordInitialGrant(
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
            token_balance=self._require_tokens().getBalance(userId),
        )

    def rejectUser(self, adminId: str, userId: str, reason: str) -> StatusChangeResult:
        return self._change_status(adminId, userId, UserStatus.REJECTED, "reject_user", reason)

    def suspendUser(self, adminId: str, userId: str, reason: str) -> StatusChangeResult:
        return self._change_status(adminId, userId, UserStatus.SUSPENDED, "suspend_user", reason)

    def reactivateUser(self, adminId: str, userId: str, reason: str) -> StatusChangeResult:
        return self._change_status(adminId, userId, UserStatus.APPROVED, "reactivate_user", reason)

    def getUserUsage(self, adminId: str, userId: str) -> list[ApiUsageLog]:
        store = self._require_store()
        admin = store.get_user(adminId)
        self._require_access().requireAdmin(admin)
        store.get_user(userId)
        return [usage for usage in store.api_usage_logs if usage.user_id == userId]

    def getUserTokenLedger(self, adminId: str, userId: str) -> list[TokenLedgerEntry]:
        store = self._require_store()
        admin = store.get_user(adminId)
        self._require_access().requireAdmin(admin)
        return self._require_tokens().listLedger(userId)

    def _change_status(
        self,
        adminId: str,
        userId: str,
        status: UserStatus,
        action_name: str,
        reason: str,
    ) -> StatusChangeResult:
        store = self._require_store()
        admin = store.get_user(adminId)
        self._require_access().requireAdmin(admin)
        user = store.get_user(userId)
        now = utc_now()
        user.status = status
        user.status_reason = reason
        user.updated_at = now
        action = store.add_admin_action(
            admin_user_id=adminId,
            target_user_id=userId,
            action=action_name,
            reason=reason,
        )
        return StatusChangeResult(user_id=userId, status=status, admin_action_id=action.id)

    def _require_store(self) -> InMemoryStore:
        if self._store is None:
            raise RuntimeError("AdminUserService was not configured with an in-memory store.")
        return self._store

    def _require_access(self) -> Any:
        if self._access is None:
            raise RuntimeError("AdminUserService was not configured with access control.")
        return self._access

    def _require_tokens(self) -> TokenQuotaService:
        if self._tokens is None:
            raise RuntimeError("AdminUserService was not configured with token quota.")
        return self._tokens


admin_user_service = AdminUserService()
