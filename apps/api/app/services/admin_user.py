from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import ApiException
from app.core.ids import new_id
from app.models import AdminActionLog, User
from app.services.token_quota import token_quota_service


class AdminUserService:
    """Thread 2 admin scaffold.

    Thread 5 will deepen audit metadata, request idempotency, and token ledger workflows.
    """

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
            metadata_json={"source": "admin_user_service_stub"},
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
        target = self.get_user_or_404(session, target_user_id)
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


admin_user_service = AdminUserService()

