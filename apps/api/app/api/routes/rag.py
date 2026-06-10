from typing import Any

from fastapi import APIRouter, Request

from app.api.deps import CurrentUser
from app.models.access_contracts import RagProviderUsage, UserRecord
from app.schemas.rag import RagQueryRequest, RagUsageEstimateRequest
from app.services.access_control import access_control_service
from app.services.rag_service import rag_query_service

router = APIRouter(prefix="/rag", tags=["rag"])


@router.post("/query")
def query_rag(payload: RagQueryRequest, user: CurrentUser) -> dict[str, object]:
    _ensure_rag_access(user)
    return {"data": rag_query_service.query(payload)}


@router.post("/ask")
def ask_rag(payload: RagQueryRequest, request: Request, user: CurrentUser) -> dict[str, object]:
    _ensure_rag_access(user)
    if isinstance(user, UserRecord) and payload.request_id:
        return {"data": _ask_metered_compat(payload, request, user)}
    return {"data": rag_query_service.query(payload)}


def _ensure_rag_access(user: CurrentUser) -> None:
    if isinstance(user, UserRecord):
        access_control_service.requireApproved(user)
        return
    access_control_service.ensure_metered_access(user)


def _ask_metered_compat(
    payload: RagQueryRequest,
    request: Request,
    user: UserRecord,
) -> dict[str, Any]:
    services = request.app.state.compat_services
    services.metering.ensureCanStartAiConversation(user.id)
    usage = _provider_usage(payload.mock_usage)
    rag_query_id = services.store.next_id("ragq")
    metering = services.metering.chargeRagUsage(
        userId=user.id,
        requestId=payload.request_id or rag_query_id,
        relatedEntityId=rag_query_id,
        usage=usage,
    )
    return {
        "ragQueryId": rag_query_id,
        "answer": (
            "This RAG summary is based on pre-match intelligence, data analysis, "
            "risk factors, uncertainty, and model evidence."
        ),
        "confidence": 0.72,
        "citations": [],
        "usage": {
            "tokensCharged": metering.tokens_charged,
            "remainingTokens": metering.remaining_tokens,
            "lowBalance": metering.lowTokenWarning,
            "lowTokenWarning": metering.lowTokenWarning,
            "tokenLedgerId": metering.token_ledger_id,
            "apiUsageLogId": metering.api_usage_log_id,
            "duplicate": metering.duplicate,
            "providerUsage": _provider_usage_payload(usage),
        },
    }


def _provider_usage(payload: RagUsageEstimateRequest | None) -> RagProviderUsage:
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

