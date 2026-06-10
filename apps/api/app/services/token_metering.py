from __future__ import annotations

from app.errors import insufficient_tokens, validation_error
from app.models.access_contracts import FeatureType, RagProviderUsage, TokenConsumptionResult
from app.services.access_control import AccessControlService
from app.services.token_quota import TokenQuotaService
from app.store import InMemoryStore

RAG_INTERNAL_TOKEN_MULTIPLIER = 2


class TokenMeteringService:
    def __init__(
        self,
        store: InMemoryStore,
        access: AccessControlService,
        tokens: TokenQuotaService,
    ) -> None:
        self._store = store
        self._access = access
        self._tokens = tokens

    def chargeRagUsage(
        self,
        *,
        userId: str,
        requestId: str,
        relatedEntityId: str,
        usage: RagProviderUsage | dict[str, object],
    ) -> TokenConsumptionResult:
        if not requestId:
            raise validation_error("requestId is required for RAG metering.")
        provider_usage = self._normalize_rag_usage(usage)
        internal_tokens = self._internal_tokens_for_rag(provider_usage)

        user = self._store.get_user(userId)
        self._access.requireApproved(user)

        existing = self._store.find_ledger_by_idempotency_key(
            user_id=userId,
            idempotency_key=requestId,
            feature_type=FeatureType.RAG_QUERY,
        )
        if existing is not None:
            existing_usage = self._store.find_usage_by_ledger_id(existing.id)
            if existing_usage is None:
                raise validation_error("Existing token ledger entry is missing usage log.")
            return TokenConsumptionResult(
                user_id=userId,
                token_ledger_id=existing.id,
                api_usage_log_id=existing_usage.id,
                tokens_charged=abs(existing.amount_tokens),
                remaining_tokens=self._tokens.getBalance(userId),
                lowTokenWarning=self._tokens.isLowBalance(userId),
                duplicate=True,
            )

        available = self._tokens.getBalance(userId)
        if available < internal_tokens:
            raise insufficient_tokens(
                required_tokens=internal_tokens,
                available_tokens=available,
                include_contact_admin=True,
            )

        ledger = self._store.add_token_ledger_entry(
            user_id=userId,
            admin_user_id=None,
            amount_tokens=-internal_tokens,
            reason=FeatureType.RAG_QUERY.value,
            related_entity_type="rag_query",
            related_entity_id=relatedEntityId,
            idempotency_key=requestId,
            metadata={
                "usageType": "rag",
                "totalProviderTokens": provider_usage.total_provider_tokens,
            },
        )
        usage_log = self._store.add_api_usage_log(
            user_id=userId,
            feature_type=FeatureType.RAG_QUERY,
            usage_type="rag",
            model=provider_usage.model,
            model_version=provider_usage.model_version,
            request_id=requestId,
            prompt_tokens=provider_usage.prompt_tokens,
            completion_tokens=provider_usage.completion_tokens,
            embedding_tokens=provider_usage.embedding_tokens,
            total_provider_tokens=provider_usage.total_provider_tokens,
            estimated_cost=provider_usage.estimated_cost,
            internal_tokens_charged=internal_tokens,
            token_ledger_id=ledger.id,
            related_entity_type="rag_query",
            related_entity_id=relatedEntityId,
        )
        return TokenConsumptionResult(
            user_id=userId,
            token_ledger_id=ledger.id,
            api_usage_log_id=usage_log.id,
            tokens_charged=internal_tokens,
            remaining_tokens=self._tokens.getBalance(userId),
            lowTokenWarning=self._tokens.isLowBalance(userId),
            duplicate=False,
        )

    def ensureCanStartAiConversation(self, userId: str) -> None:
        user = self._store.get_user(userId)
        self._access.requireApproved(user)
        available = self._tokens.getBalance(userId)
        if available <= 0:
            raise insufficient_tokens(
                required_tokens=1,
                available_tokens=available,
                include_contact_admin=True,
            )

    def _internal_tokens_for_rag(self, usage: RagProviderUsage) -> int:
        return max(1, usage.total_provider_tokens * RAG_INTERNAL_TOKEN_MULTIPLIER)

    def _normalize_rag_usage(self, usage: RagProviderUsage | dict[str, object]) -> RagProviderUsage:
        if isinstance(usage, RagProviderUsage):
            return usage
        return RagProviderUsage(
            model=str(usage.get("model") or "unknown-rag-model"),
            model_version=_optional_str(usage.get("modelVersion") or usage.get("model_version")),
            prompt_tokens=_int_field(usage, "promptTokens", "prompt_tokens"),
            completion_tokens=_int_field(usage, "completionTokens", "completion_tokens"),
            embedding_tokens=_int_field(usage, "embeddingTokens", "embedding_tokens"),
            total_provider_tokens=_int_field(
                usage,
                "totalProviderTokens",
                "total_provider_tokens",
            ),
            estimated_cost=_float_field(usage, "estimatedCost", "estimated_cost"),
        )


def _int_field(payload: dict[str, object], camel: str, snake: str) -> int:
    value = payload.get(camel, payload.get(snake, 0))
    if isinstance(value, bool) or not isinstance(value, int):
        raise validation_error(f"{camel} must be an integer.")
    if value < 0:
        raise validation_error(f"{camel} cannot be negative.")
    return value


def _float_field(payload: dict[str, object], camel: str, snake: str) -> float:
    value = payload.get(camel, payload.get(snake, 0.0))
    if isinstance(value, bool) or not isinstance(value, int | float):
        raise validation_error(f"{camel} must be numeric.")
    if value < 0:
        raise validation_error(f"{camel} cannot be negative.")
    return float(value)


def _optional_str(value: object) -> str | None:
    if value is None:
        return None
    return str(value)
