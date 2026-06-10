from fastapi import APIRouter, Request
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession
from app.api.serializers import access_status_contract, token_status_for_user, usage_contract
from app.models import AIUsageLog
from app.models.access_contracts import UserRecord

router = APIRouter(prefix="/account", tags=["account"])


@router.get("/access-status")
def access_status(request: Request, user: CurrentUser) -> dict[str, object]:
    if isinstance(user, UserRecord):
        status = request.app.state.compat_services.access.getAccessStatus(user.id)
        return {
            "data": {
                "userId": status.user_id,
                "status": status.status.value,
                "canUseProtectedApis": status.can_use_protected_apis,
                "message": status.message,
                "updatedAt": status.updated_at.isoformat().replace("+00:00", "Z"),
            }
        }
    return {"data": access_status_contract(user)}


@router.get("/status")
def status_alias(request: Request, user: CurrentUser) -> dict[str, object]:
    return access_status(request, user)


@router.get("/tokens")
def tokens(request: Request, user: CurrentUser, session: DbSession) -> dict[str, object]:
    if isinstance(user, UserRecord):
        services = request.app.state.compat_services
        ledger = services.tokens.listLedger(user.id)
        return {
            "data": {
                "userId": user.id,
                "balanceTokens": services.tokens.getBalance(user.id),
                "lowBalance": services.tokens.isLowBalance(user.id),
                "lowBalanceThreshold": services.tokens.getLowThreshold(user.id),
                "contactAdminMessage": "Token balance is low. Please contact the admin.",
                "ledger": [
                    {
                        "ledgerId": entry.id,
                        "amountTokens": entry.amount_tokens,
                        "reason": entry.reason,
                        "relatedEntityType": entry.related_entity_type,
                        "relatedEntityId": entry.related_entity_id,
                        "createdAt": entry.created_at.isoformat().replace("+00:00", "Z"),
                    }
                    for entry in ledger
                ],
            }
        }
    return {"data": token_status_for_user(session, user)}


@router.get("/usage")
def usage(user: CurrentUser, session: DbSession) -> dict[str, object]:
    rows = session.scalars(
        select(AIUsageLog)
        .where(AIUsageLog.user_id == user.id)
        .order_by(AIUsageLog.created_at.desc())
    )
    return {"data": [usage_contract(row) for row in rows]}
