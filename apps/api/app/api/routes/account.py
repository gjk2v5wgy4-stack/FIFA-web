from fastapi import APIRouter
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.api.serializers import access_status_contract, token_status_for_user, usage_contract
from app.models import AIUsageLog

router = APIRouter(prefix="/account", tags=["account"])


@router.get("/access-status")
def access_status(user: CurrentUser) -> dict[str, object]:
    return {"data": access_status_contract(user)}


@router.get("/status")
def status_alias(user: CurrentUser) -> dict[str, object]:
    return {"data": access_status_contract(user)}


@router.get("/tokens")
def tokens(user: CurrentUser, session: DbSession) -> dict[str, object]:
    return {"data": token_status_for_user(session, user)}


@router.get("/usage")
def usage(user: CurrentUser, session: DbSession) -> dict[str, object]:
    rows = session.scalars(
        select(AIUsageLog)
        .where(AIUsageLog.user_id == user.id)
        .order_by(AIUsageLog.created_at.desc())
    )
    return {"data": [usage_contract(row) for row in rows]}
