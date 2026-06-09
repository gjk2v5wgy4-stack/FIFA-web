from fastapi import APIRouter, Request
from sqlalchemy import select

from app.api.deps import AdminUser, DbSession
from app.api.serializers import (
    action_log_contract,
    ledger_contract,
    usage_contract,
    user_admin_contract,
)
from app.models import AdminActionLog, AIUsageLog, User
from app.models.access_contracts import UserRecord
from app.schemas.requests import ApproveUserRequest, ReasonRequest, TokenChangeRequest
from app.services.admin_user import admin_user_service
from app.services.token_quota import token_quota_service

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_db_admin(admin: AdminUser) -> User:
    if isinstance(admin, UserRecord):
        raise ValueError("Compatibility admin requests must be handled before DB service calls.")
    return admin


@router.get("/users")
def list_users(admin: AdminUser, session: DbSession) -> dict[str, object]:
    users = admin_user_service.list_users(session)
    return {
        "data": [
            user_admin_contract(user, token_quota_service.get_balance(session, user.id))
            for user in users
        ],
        "pagination": {"nextCursor": None, "hasMore": False},
    }


@router.get("/users/pending")
def list_pending_users(admin: AdminUser, session: DbSession) -> dict[str, object]:
    users = admin_user_service.list_users(session, "pending_approval")
    return {
        "data": [
            user_admin_contract(user, token_quota_service.get_balance(session, user.id))
            for user in users
        ],
        "pagination": {"nextCursor": None, "hasMore": False},
    }


@router.post("/users/{user_id}/approve")
def approve_user(
    user_id: str,
    payload: ApproveUserRequest,
    request: Request,
    admin: AdminUser,
    session: DbSession,
) -> dict[str, object]:
    if isinstance(admin, UserRecord):
        result = request.app.state.compat_services.admin_users.approveUser(
            adminId=admin.id,
            userId=user_id,
            initialTokens=payload.initial_token_grant,
            lowThreshold=payload.low_balance_threshold,
            note=payload.reason,
        )
        return {
            "data": {
                "userId": result.user_id,
                "status": result.status.value,
                "adminActionId": result.admin_action_id,
                "tokenLedgerId": result.token_ledger_id,
                "tokenBalance": result.token_balance,
            }
        }
    db_admin = _require_db_admin(admin)
    target, action, ledger_id, balance = admin_user_service.approve_user(
        session,
        db_admin,
        user_id,
        payload.reason,
        payload.initial_token_grant,
    )
    session.commit()
    return {
        "data": {
            "userId": target.id,
            "status": target.status,
            "adminActionId": action.id,
            "tokenLedgerId": ledger_id,
            "tokenBalance": balance,
        }
    }


@router.post("/users/{user_id}/reject")
def reject_user(
    user_id: str,
    payload: ReasonRequest,
    admin: AdminUser,
    session: DbSession,
) -> dict[str, object]:
    db_admin = _require_db_admin(admin)
    target, action = admin_user_service.set_status(
        session,
        db_admin,
        user_id,
        "rejected",
        "reject_user",
        payload.reason,
    )
    session.commit()
    return {"data": {"userId": target.id, "status": target.status, "adminActionId": action.id}}


@router.post("/users/{user_id}/suspend")
def suspend_user(
    user_id: str,
    payload: ReasonRequest,
    admin: AdminUser,
    session: DbSession,
) -> dict[str, object]:
    db_admin = _require_db_admin(admin)
    target, action = admin_user_service.set_status(
        session,
        db_admin,
        user_id,
        "suspended",
        "suspend_user",
        payload.reason,
    )
    session.commit()
    return {"data": {"userId": target.id, "status": target.status, "adminActionId": action.id}}


@router.post("/users/{user_id}/reactivate")
def reactivate_user(
    user_id: str,
    payload: ReasonRequest,
    admin: AdminUser,
    session: DbSession,
) -> dict[str, object]:
    db_admin = _require_db_admin(admin)
    target, action = admin_user_service.set_status(
        session,
        db_admin,
        user_id,
        "approved",
        "reactivate_user",
        payload.reason,
    )
    session.commit()
    return {"data": {"userId": target.id, "status": target.status, "adminActionId": action.id}}


@router.post("/users/{user_id}/tokens/grant")
def grant_tokens(
    user_id: str,
    payload: TokenChangeRequest,
    admin: AdminUser,
    session: DbSession,
) -> dict[str, object]:
    db_admin = _require_db_admin(admin)
    action, ledger_id, balance = admin_user_service.change_tokens(
        session,
        db_admin,
        user_id,
        payload.amount_tokens,
        payload.reason,
        "admin_grant",
        "grant_tokens",
    )
    session.commit()
    return {
        "data": {
            "userId": user_id,
            "adminActionId": action.id,
            "tokenLedgerId": ledger_id,
            "amountTokens": payload.amount_tokens,
            "tokenBalance": balance,
        }
    }


@router.post("/users/{user_id}/tokens/adjust")
def adjust_tokens(
    user_id: str,
    payload: TokenChangeRequest,
    admin: AdminUser,
    session: DbSession,
) -> dict[str, object]:
    db_admin = _require_db_admin(admin)
    action, ledger_id, balance = admin_user_service.change_tokens(
        session,
        db_admin,
        user_id,
        payload.amount_tokens,
        payload.reason,
        "admin_adjustment",
        "adjust_tokens",
    )
    session.commit()
    return {
        "data": {
            "userId": user_id,
            "adminActionId": action.id,
            "tokenLedgerId": ledger_id,
            "amountTokens": payload.amount_tokens,
            "tokenBalance": balance,
        }
    }


@router.post("/users/{user_id}/tokens/revoke")
def revoke_tokens(
    user_id: str,
    payload: TokenChangeRequest,
    admin: AdminUser,
    session: DbSession,
) -> dict[str, object]:
    amount = -abs(payload.amount_tokens)
    db_admin = _require_db_admin(admin)
    action, ledger_id, balance = admin_user_service.change_tokens(
        session,
        db_admin,
        user_id,
        amount,
        payload.reason,
        "admin_revoke",
        "revoke_tokens",
    )
    session.commit()
    return {
        "data": {
            "userId": user_id,
            "adminActionId": action.id,
            "tokenLedgerId": ledger_id,
            "amountTokens": amount,
            "tokenBalance": balance,
        }
    }


@router.get("/users/{user_id}/usage")
def user_usage(user_id: str, admin: AdminUser, session: DbSession) -> dict[str, object]:
    admin_user_service.get_user_or_404(session, user_id)
    rows = session.scalars(
        select(AIUsageLog)
        .where(AIUsageLog.user_id == user_id)
        .order_by(AIUsageLog.created_at.desc())
    )
    return {"data": [usage_contract(row) for row in rows]}


@router.get("/users/{user_id}/token-ledger")
def user_token_ledger(user_id: str, admin: AdminUser, session: DbSession) -> dict[str, object]:
    admin_user_service.get_user_or_404(session, user_id)
    return {
        "data": [
            ledger_contract(entry) for entry in token_quota_service.ledger_entries(session, user_id)
        ]
    }


@router.get("/audit-logs")
def audit_logs(admin: AdminUser, session: DbSession) -> dict[str, object]:
    rows = session.scalars(select(AdminActionLog).order_by(AdminActionLog.created_at.desc()))
    return {"data": [action_log_contract(row) for row in rows]}
