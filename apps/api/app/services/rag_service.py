from __future__ import annotations

from app.models import RagProviderUsage, RagServiceResult
from app.store import InMemoryStore


class RagService:
    """Minimal adapter for Thread 2 RAG responses.

    The RAG service returns answer content and provider usage only. Token deduction
    is intentionally handled by TokenMeteringService.
    """

    def __init__(self, store: InMemoryStore) -> None:
        self._store = store

    def ask(
        self,
        *,
        question: str,
        usage: RagProviderUsage,
        context: dict[str, object] | None = None,
    ) -> RagServiceResult:
        rag_query_id = self._store.next_id("ragq")
        context_note = ""
        if context and context.get("matchId"):
            context_note = f" Match context: {context['matchId']}."
        return RagServiceResult(
            rag_query_id=rag_query_id,
            answer=(
                "这是基于赛前情报、数据分析和模型依据生成的风险因素摘要。"
                " 预测结果存在不确定性，仅用于赛前情报分析。"
                f"{context_note} Question: {question}"
            ),
            confidence=0.72,
            citations=[],
            usage=usage,
        )
