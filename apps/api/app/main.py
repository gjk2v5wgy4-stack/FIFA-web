from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any

from fastapi import Depends, FastAPI, Header, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from app.errors import AppError, unauthorized, validation_error
from app.models import (
    AdminActionLog,
    ApiUsageLog,
    FeatureType,
    RagProviderUsage,
    TokenLedgerEntry,
    UserRecord,
    UserStatus,
)
from app.services.factory import create_services
from app.services.rag_service import RagService
from app.store import InMemoryStore


class ApproveRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    initial_token_grant: int = Field(default=0, alias="initialTokenGrant")
    low_balance_threshold: int = Field(default=10_000, alias="lowBalanceThreshold")
    reason: str = "Approved for MVP access."


class ReasonRequest(BaseModel):
    reason: str


class TokenChangeRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    amount_tokens: int = Field(alias="amountTokens")
    reason: str


class MeteredConsumeRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    request_id: str = Field(alias="requestId")
    amount_tokens: int | None = Field(default=None, alias="amountTokens")
    payload: dict[str, object] = Field(default_factory=dict)


class RagUsageRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    model: str = "unknown-rag-model"
    model_version: str | None = Field(default=None, alias="modelVersion")
    prompt_tokens: int = Field(default=0, alias="promptTokens")
    completion_tokens: int = Field(default=0, alias="completionTokens")
    embedding_tokens: int = Field(default=0, alias="embeddingTokens")
    total_provider_tokens: int = Field(default=0, alias="totalProviderTokens")
    estimated_cost: float = Field(default=0.0, alias="estimatedCost")


class RagAskRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    request_id: str = Field(alias="requestId")
    question: str
    context: dict[str, object] = Field(default_factory=dict)
    retrieval: dict[str, object] = Field(default_factory=dict)
    mock_usage: RagUsageRequest | None = Field(default=None, alias="mockUsage")


def isoformat(value: datetime) -> str:
    return value.isoformat().replace("+00:00", "Z")


def serialize_ledger(entry: TokenLedgerEntry) -> dict[str, Any]:
    return {
        "ledgerId": entry.id,
        "userId": entry.user_id,
        "adminUserId": entry.admin_user_id,
        "amountTokens": entry.amount_tokens,
        "reason": entry.reason,
        "relatedEntityType": entry.related_entity_type,
        "relatedEntityId": entry.related_entity_id,
        "idempotencyKey": entry.idempotency_key,
        "createdAt": isoformat(entry.created_at),
    }


def serialize_user(user: UserRecord, token_balance: int) -> dict[str, Any]:
    return {
        "userId": user.id,
        "email": user.email,
        "displayName": user.display_name,
        "role": user.role.value,
        "status": user.status.value,
        "tokenBalance": token_balance,
        "lowBalanceThreshold": user.low_balance_threshold,
        "createdAt": isoformat(user.created_at),
        "updatedAt": isoformat(user.updated_at),
    }


def serialize_usage(log: ApiUsageLog) -> dict[str, Any]:
    return {
        "usageId": log.id,
        "userId": log.user_id,
        "featureType": log.feature_type.value,
        "usageType": log.usage_type,
        "model": log.model,
        "modelVersion": log.model_version,
        "requestId": log.request_id,
        "promptTokens": log.prompt_tokens,
        "completionTokens": log.completion_tokens,
        "embeddingTokens": log.embedding_tokens,
        "totalProviderTokens": log.total_provider_tokens,
        "estimatedCost": log.estimated_cost,
        "internalTokensCharged": log.internal_tokens_charged,
        "tokenLedgerId": log.token_ledger_id,
        "relatedEntityType": log.related_entity_type,
        "relatedEntityId": log.related_entity_id,
        "createdAt": isoformat(log.created_at),
    }


def serialize_admin_action(log: AdminActionLog) -> dict[str, Any]:
    return {
        "adminActionId": log.id,
        "adminUserId": log.admin_user_id,
        "targetUserId": log.target_user_id,
        "action": log.action,
        "reason": log.reason,
        "metadata": log.metadata,
        "createdAt": isoformat(log.created_at),
    }


def create_app(store: InMemoryStore | None = None) -> FastAPI:
    app_store = store or InMemoryStore.seed_default()
    services = create_services(app_store)
    rag_service = RagService(app_store)
    app = FastAPI(title="World Cup AI Prediction API", version="0.1.0")
    app.state.store = app_store
    app.state.services = services

    def current_user(
        x_user_id: Annotated[str | None, Header(alias="x-user-id")] = None,
    ) -> UserRecord:
        if x_user_id is None:
            raise unauthorized()
        return app_store.get_user(x_user_id)

    def current_admin(
        x_user_id: Annotated[str | None, Header(alias="x-user-id")] = None,
    ) -> UserRecord:
        user = current_user(x_user_id)
        return services.access.requireAdmin(user)

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        request_id = request.headers.get("x-request-id")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                    "requestId": request_id,
                }
            },
        )

    @app.get("/api/health")
    def health() -> dict[str, Any]:
        return {"data": {"status": "ok"}}

    @app.get("/api/account/status")
    def account_status(user: UserRecord = Depends(current_user)) -> dict[str, Any]:
        status = services.access.getAccessStatus(user.id)
        return {
            "data": {
                "userId": status.user_id,
                "status": status.status.value,
                "canUseProtectedApis": status.can_use_protected_apis,
                "message": status.message,
                "updatedAt": isoformat(status.updated_at),
            }
        }

    @app.get("/api/account/tokens")
    def account_tokens(user: UserRecord = Depends(current_user)) -> dict[str, Any]:
        balance = services.tokens.getBalance(user.id)
        return {
            "data": {
                "userId": user.id,
                "balanceTokens": balance,
                "lowBalance": services.tokens.isLowBalance(user.id),
                "lowBalanceThreshold": services.tokens.getLowThreshold(user.id),
                "contactAdminMessage": "Token balance is low. Please contact the admin.",
                "ledger": [
                    serialize_ledger(entry) for entry in services.tokens.listLedger(user.id)
                ],
            }
        }

    @app.get("/api/admin/users")
    def list_users(
        _admin: UserRecord = Depends(current_admin),
        status: str | None = None,
        search: str | None = None,
        limit: int = 50,
        cursor: str | None = None,
    ) -> dict[str, Any]:
        parsed_status = UserStatus(status) if status else None
        page = services.admin_users.listUsers(
            status=parsed_status,
            search=search,
            pagination={"limit": limit, "cursor": cursor},
        )
        return {
            "data": [
                serialize_user(user, services.tokens.getBalance(user.id)) for user in page.users
            ],
            "pagination": {"nextCursor": page.next_cursor, "hasMore": page.has_more},
        }

    @app.get("/api/admin/users/pending")
    def list_pending_users(_admin: UserRecord = Depends(current_admin)) -> dict[str, Any]:
        users = services.admin_users.listPendingUsers()
        return {
            "data": [serialize_user(user, services.tokens.getBalance(user.id)) for user in users]
        }

    @app.post("/api/admin/users/{user_id}/approve")
    def approve_user(
        user_id: str,
        body: ApproveRequest,
        admin: UserRecord = Depends(current_admin),
    ) -> dict[str, Any]:
        result = services.admin_users.approveUser(
            adminId=admin.id,
            userId=user_id,
            initialTokens=body.initial_token_grant,
            lowThreshold=body.low_balance_threshold,
            note=body.reason,
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

    @app.post("/api/admin/users/{user_id}/reject")
    def reject_user(
        user_id: str,
        body: ReasonRequest,
        admin: UserRecord = Depends(current_admin),
    ) -> dict[str, Any]:
        result = services.admin_users.rejectUser(admin.id, user_id, body.reason)
        return {
            "data": {
                "userId": result.user_id,
                "status": result.status.value,
                "adminActionId": result.admin_action_id,
            }
        }

    @app.post("/api/admin/users/{user_id}/suspend")
    def suspend_user(
        user_id: str,
        body: ReasonRequest,
        admin: UserRecord = Depends(current_admin),
    ) -> dict[str, Any]:
        result = services.admin_users.suspendUser(admin.id, user_id, body.reason)
        return {
            "data": {
                "userId": result.user_id,
                "status": result.status.value,
                "adminActionId": result.admin_action_id,
            }
        }

    @app.post("/api/admin/users/{user_id}/reactivate")
    def reactivate_user(
        user_id: str,
        body: ReasonRequest,
        admin: UserRecord = Depends(current_admin),
    ) -> dict[str, Any]:
        result = services.admin_users.reactivateUser(admin.id, user_id, body.reason)
        return {
            "data": {
                "userId": result.user_id,
                "status": result.status.value,
                "adminActionId": result.admin_action_id,
            }
        }

    @app.post("/api/admin/users/{user_id}/tokens/grant")
    def grant_tokens(
        user_id: str,
        body: TokenChangeRequest,
        admin: UserRecord = Depends(current_admin),
    ) -> dict[str, Any]:
        result = services.tokens.grantTokens(admin.id, user_id, body.amount_tokens, body.reason)
        return {"data": _token_operation_payload(result)}

    @app.post("/api/admin/users/{user_id}/tokens/adjust")
    def adjust_tokens(
        user_id: str,
        body: TokenChangeRequest,
        admin: UserRecord = Depends(current_admin),
    ) -> dict[str, Any]:
        result = services.tokens.adjustTokens(admin.id, user_id, body.amount_tokens, body.reason)
        return {"data": _token_operation_payload(result)}

    @app.post("/api/admin/users/{user_id}/tokens/revoke")
    def revoke_tokens(
        user_id: str,
        body: TokenChangeRequest,
        admin: UserRecord = Depends(current_admin),
    ) -> dict[str, Any]:
        result = services.tokens.revokeTokens(admin.id, user_id, body.amount_tokens, body.reason)
        return {"data": _token_operation_payload(result)}

    @app.get("/api/admin/users/{user_id}/usage")
    def user_usage(user_id: str, _admin: UserRecord = Depends(current_admin)) -> dict[str, Any]:
        return {
            "data": [
                serialize_usage(log)
                for log in services.admin_users.getUserUsage(_admin.id, user_id)
            ]
        }

    @app.get("/api/admin/users/{user_id}/tokens/ledger")
    def user_token_ledger(
        user_id: str,
        _admin: UserRecord = Depends(current_admin),
    ) -> dict[str, Any]:
        return {
            "data": [
                serialize_ledger(entry)
                for entry in services.admin_users.getUserTokenLedger(_admin.id, user_id)
            ]
        }

    @app.get("/api/admin/audit-logs")
    def audit_logs(_admin: UserRecord = Depends(current_admin)) -> dict[str, Any]:
        return {"data": [serialize_admin_action(log) for log in app_store.admin_action_logs]}

    @app.post("/api/features/{feature_type}/consume")
    def consume_feature_tokens(
        feature_type: str,
        body: MeteredConsumeRequest,
        user: UserRecord = Depends(current_user),
    ) -> dict[str, Any]:
        try:
            parsed_feature_type = FeatureType(feature_type)
        except ValueError as exc:
            raise validation_error(
                "Unsupported feature type.",
                details={"featureType": feature_type},
            ) from exc
        amount = body.amount_tokens or services.tokens.estimateFeatureCost(
            parsed_feature_type,
            body.payload,
        )
        result = services.tokens.consumeTokens(
            userId=user.id,
            amount=amount,
            requestId=body.request_id,
            featureType=parsed_feature_type,
        )
        return {
            "data": {
                "tokensCharged": result.tokens_charged,
                "remainingTokens": result.remaining_tokens,
                "lowBalance": result.lowTokenWarning,
                "lowTokenWarning": result.lowTokenWarning,
                "tokenLedgerId": result.token_ledger_id,
                "apiUsageLogId": result.api_usage_log_id,
                "duplicate": result.duplicate,
            }
        }

    @app.post("/api/rag/ask")
    def ask_rag(
        body: RagAskRequest,
        user: UserRecord = Depends(current_user),
    ) -> dict[str, Any]:
        services.access.requireApproved(user)
        provider_usage = _rag_provider_usage(body.mock_usage)
        rag_result = rag_service.ask(
            question=body.question,
            context=body.context,
            usage=provider_usage,
        )
        metering = services.metering.chargeRagUsage(
            userId=user.id,
            requestId=body.request_id,
            relatedEntityId=rag_result.rag_query_id,
            usage=rag_result.usage,
        )
        return {
            "data": {
                "ragQueryId": rag_result.rag_query_id,
                "answer": rag_result.answer,
                "confidence": rag_result.confidence,
                "citations": rag_result.citations,
                "usage": {
                    "tokensCharged": metering.tokens_charged,
                    "remainingTokens": metering.remaining_tokens,
                    "lowBalance": metering.lowTokenWarning,
                    "lowTokenWarning": metering.lowTokenWarning,
                    "tokenLedgerId": metering.token_ledger_id,
                    "apiUsageLogId": metering.api_usage_log_id,
                    "duplicate": metering.duplicate,
                    "providerUsage": _provider_usage_payload(rag_result.usage),
                },
            }
        }

    return app


def _token_operation_payload(result: Any) -> dict[str, Any]:
    return {
        "userId": result.user_id,
        "adminActionId": result.admin_action_id,
        "tokenLedgerId": result.token_ledger_id,
        "amountTokens": result.amount_tokens,
        "tokenBalance": result.token_balance,
    }


def _rag_provider_usage(payload: RagUsageRequest | None) -> RagProviderUsage:
    if payload is None:
        return RagProviderUsage(
            model="rag-mvp-adapter",
            prompt_tokens=700,
            completion_tokens=300,
            embedding_tokens=200,
            total_provider_tokens=1200,
            estimated_cost=0.0,
        )
    return RagProviderUsage(
        model=payload.model,
        model_version=payload.model_version,
        prompt_tokens=payload.prompt_tokens,
        completion_tokens=payload.completion_tokens,
        embedding_tokens=payload.embedding_tokens,
        total_provider_tokens=payload.total_provider_tokens,
        estimated_cost=payload.estimated_cost,
    )


def _provider_usage_payload(usage: RagProviderUsage) -> dict[str, Any]:
    return {
        "model": usage.model,
        "promptTokens": usage.prompt_tokens,
        "completionTokens": usage.completion_tokens,
        "embeddingTokens": usage.embedding_tokens,
        "totalProviderTokens": usage.total_provider_tokens,
        "estimatedCost": usage.estimated_cost,
    }


app = create_app()
