import hashlib
import sys
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.core.config import get_settings
from app.core.errors import ApiException
from app.schemas.rag import RagQueryRequest

FORBIDDEN_RAG_TERMS = (
    "投注",
    "下注",
    "\u8ddf\u5355",
    "追分",
    "加仓",
    "盘口",
    "赔率推荐",
    "\u5fc5\u80dc",
    "\u7a33\u8d5a",
    "\u5305\u4e2d",
    "bet",
    "wager",
    "stake",
    "parlay",
    "chase losses",
)


@dataclass(frozen=True)
class RagProviderUsageEstimate:
    model: str
    prompt_tokens: int
    completion_tokens: int
    embedding_tokens: int
    total_provider_tokens: int
    estimated_cost: float

    def to_contract(self) -> dict[str, object]:
        return {
            "provider": "estimated",
            "model": self.model,
            "promptTokens": self.prompt_tokens,
            "completionTokens": self.completion_tokens,
            "embeddingTokens": self.embedding_tokens,
            "totalProviderTokens": self.total_provider_tokens,
            "estimatedCost": self.estimated_cost,
            "tokensDeducted": 0,
        }


class RagQueryService:
    """FastAPI integration boundary for Thread 3 RAG/Qdrant retrieval.

    This service returns provider usage estimates only. Thread 5 owns final token
    deduction, ledger writes, idempotency, and admin/token business policy.
    """

    def __init__(self, vector_store_factory: Callable[[], Any] | None = None) -> None:
        self.vector_store_factory = vector_store_factory

    def query(self, payload: RagQueryRequest) -> dict[str, object]:
        usage = self._estimate_usage(payload)
        safety_answer = self._safety_boundary_answer(payload.question)
        if safety_answer is not None:
            return {
                "answer": safety_answer,
                "sources": [],
                "retrievalDiagnostics": {
                    "status": "safety_boundary",
                    "resultCount": 0,
                    "filtersApplied": self._filters(payload),
                    "provider": "none",
                },
                "usage": usage.to_contract(),
            }

        filters = self._filters(payload)
        try:
            store = self._vector_store()
            results = store.search(
                query_embedding=self._embed_question(payload.question),
                filters=filters,
                top_k=payload.top_k,
            )
        except Exception as exc:
            raise ApiException(
                "RAG_RETRIEVAL_UNAVAILABLE",
                "RAG retrieval backend is unavailable.",
                503,
                {"reason": str(exc)},
            ) from exc

        sources = [self._source_contract(result) for result in results]
        if not sources:
            return {
                "answer": None,
                "sources": [],
                "retrievalDiagnostics": {
                    "status": "no_results",
                    "resultCount": 0,
                    "filtersApplied": filters,
                    "provider": "qdrant",
                },
                "usage": usage.to_contract(),
            }

        return {
            "answer": self._answer_from_sources(payload.question, sources),
            "sources": sources,
            "retrievalDiagnostics": {
                "status": "ok",
                "resultCount": len(sources),
                "filtersApplied": filters,
                "provider": "qdrant",
                "collection": get_settings().qdrant_collection,
            },
            "usage": usage.to_contract(),
        }

    def _vector_store(self) -> Any:
        if self.vector_store_factory is not None:
            return self.vector_store_factory()

        settings = get_settings()
        self._ensure_rag_core_python_path()
        from worldcup_rag_qdrant import QdrantVectorStoreAdapter

        return QdrantVectorStoreAdapter(
            host=settings.qdrant_host,
            port=settings.qdrant_port,
            api_key=settings.qdrant_api_key,
            collection_name=settings.qdrant_collection,
            vector_dim=settings.vector_dim,
        )

    def _ensure_rag_core_python_path(self) -> None:
        repo_root = Path(__file__).resolve().parents[4]
        rag_python_path = repo_root / "packages" / "rag-core" / "python"
        if rag_python_path.exists():
            sys.path.insert(0, str(rag_python_path))

    def _filters(self, payload: RagQueryRequest) -> dict[str, Any]:
        filters = dict(payload.filters)
        legacy_context = payload.context
        match_id = payload.match_id or legacy_context.get("matchId")
        team_id = payload.team_id or legacy_context.get("teamId")
        player_id = payload.player_id or legacy_context.get("playerId")
        if team_id is None and legacy_context.get("teamIds"):
            team_id = legacy_context["teamIds"]
        if player_id is None and legacy_context.get("playerIds"):
            player_id = legacy_context["playerIds"]
        if match_id is not None:
            filters["matchId"] = match_id
        if team_id is not None:
            filters["teamId"] = team_id
        if player_id is not None:
            filters["playerId"] = player_id
        return filters

    def _embed_question(self, question: str) -> list[float]:
        vector_dim = get_settings().vector_dim
        digest = hashlib.sha256(question.encode("utf-8")).digest()
        return [float(digest[index % len(digest)]) / 255.0 for index in range(vector_dim)]

    def _source_contract(self, result: dict[str, Any]) -> dict[str, object]:
        chunk = result.get("chunk") or {}
        metadata = chunk.get("metadata") or {}
        source_url = metadata.get("sourceUrl") or metadata.get("source_url") or metadata.get("url")
        source_type = metadata.get("sourceType") or metadata.get("source_type")
        published_at = metadata.get("publishedAt") or metadata.get("published_at")
        title = metadata.get("title") or metadata.get("sourceName") or metadata.get("source_name")
        content = str(chunk.get("content") or "")
        return {
            "chunkId": chunk.get("chunkId") or metadata.get("chunkId") or metadata.get("chunk_id"),
            "documentId": chunk.get("documentId")
            or metadata.get("documentId")
            or metadata.get("document_id"),
            "score": float(result.get("score") or 0.0),
            "contentPreview": content[:240],
            "metadata": metadata,
            "citation": {
                "title": title,
                "sourceType": source_type,
                "sourceUrl": source_url,
                "publishedAt": published_at,
                "language": metadata.get("language"),
            },
        }

    def _answer_from_sources(self, question: str, sources: list[dict[str, object]]) -> str:
        previews = [
            str(source.get("contentPreview") or "").strip()
            for source in sources[:3]
            if source.get("contentPreview")
        ]
        evidence = "；".join(previews)
        return (
            "基于已检索到的资料，以下回答仅用于概率预测、数据分析和风险因素说明，"
            f"不构成确定性结论。问题：{question}。模型依据：{evidence}"
        )

    def _estimate_usage(self, payload: RagQueryRequest) -> RagProviderUsageEstimate:
        prompt_tokens = max(1, len(payload.question) // 2)
        embedding_tokens = max(1, get_settings().vector_dim)
        completion_tokens = 120
        total = prompt_tokens + embedding_tokens + completion_tokens
        return RagProviderUsageEstimate(
            model=payload.model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            embedding_tokens=embedding_tokens,
            total_provider_tokens=total,
            estimated_cost=round(total * 0.000001, 6),
        )

    def _safety_boundary_answer(self, question: str) -> str | None:
        normalized = question.lower()
        if not any(term in normalized for term in FORBIDDEN_RAG_TERMS):
            return None
        return (
            "本系统不提供下注、追分、复制他人操作、加仓、盘口方向或资金安排内容，"
            "也不保证预测命中。可以提供的是赛前情报、概率预测、风险因素、"
            "不确定性和模型依据分析。"
        )


rag_query_service = RagQueryService()
