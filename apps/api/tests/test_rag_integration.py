from typing import Any

from fastapi.testclient import TestClient

from app.services.rag_service import RagQueryService
from tests.conftest import auth_headers


class FakeVectorStore:
    def __init__(self, results: list[dict[str, Any]] | None = None) -> None:
        self.results = results or []
        self.search_calls: list[dict[str, Any]] = []

    def search(
        self,
        query_embedding: list[float],
        filters: dict[str, Any] | None = None,
        top_k: int = 8,
    ) -> list[dict[str, Any]]:
        self.search_calls.append(
            {"query_embedding": query_embedding, "filters": filters or {}, "top_k": top_k}
        )
        return self.results[:top_k]


class SequenceVectorStore(FakeVectorStore):
    def __init__(self, result_batches: list[list[dict[str, Any]]]) -> None:
        super().__init__([])
        self.result_batches = result_batches

    def search(
        self,
        query_embedding: list[float],
        filters: dict[str, Any] | None = None,
        top_k: int = 8,
    ) -> list[dict[str, Any]]:
        self.search_calls.append(
            {"query_embedding": query_embedding, "filters": filters or {}, "top_k": top_k}
        )
        call_index = len(self.search_calls) - 1
        if call_index >= len(self.result_batches):
            return []
        return self.result_batches[call_index][:top_k]


def source_result(
    *,
    team_id: str = "team_usa",
    match_id: str | None = "match_001",
    source_type: str = "scouting_report",
) -> dict[str, Any]:
    return {
        "score": 0.91,
        "chunk": {
            "chunkId": "chunk_001",
            "documentId": "doc_001",
            "content": "美国队边路转换和高位压迫稳定性是主要赛前情报。",
            "metadata": {
                "title": "USA scouting report",
                "teamId": team_id,
                "matchId": match_id,
                "sourceType": source_type,
                "sourceUrl": "https://source.example.com/usa",
                "publishedAt": "2026-06-01T00:00:00Z",
                "language": "zh-CN",
            },
        },
    }


def install_fake_rag_service(monkeypatch: Any, store: FakeVectorStore) -> None:
    service = RagQueryService(vector_store_factory=lambda: store)
    monkeypatch.setattr("app.api.routes.rag.rag_query_service", service)


def test_rag_query_schema_sources_diagnostics_and_usage(
    client: TestClient,
    monkeypatch: Any,
) -> None:
    store = FakeVectorStore([source_result()])
    install_fake_rag_service(monkeypatch, store)
    headers = auth_headers(client, "approved@example.com", "Approved123!")

    response = client.post(
        "/api/rag/query",
        headers=headers,
        json={
            "question": "美国队主要风险因素是什么？",
            "matchId": "match_001",
            "teamId": "team_usa",
            "topK": 3,
            "filters": {"sourceType": "scouting_report"},
            "model": "rag-test-model",
        },
    )

    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["answer"]
    assert data["sources"][0]["chunkId"] == "chunk_001"
    assert data["sources"][0]["citation"]["sourceUrl"] == "https://source.example.com/usa"
    assert data["retrievalDiagnostics"]["status"] == "ok"
    assert data["retrievalDiagnostics"]["resultCount"] == 1
    assert data["usage"]["model"] == "rag-test-model"
    assert data["usage"]["tokensDeducted"] == 0


def test_rag_query_applies_metadata_filters(client: TestClient, monkeypatch: Any) -> None:
    store = FakeVectorStore([source_result()])
    install_fake_rag_service(monkeypatch, store)
    headers = auth_headers(client, "approved@example.com", "Approved123!")

    response = client.post(
        "/api/rag/ask",
        headers=headers,
        json={
            "question": "检索墨西哥历史交锋资料",
            "matchId": "match_mexico_south_africa",
            "teamId": "team_mexico",
            "playerId": "player_123",
            "topK": 5,
            "filters": {"sourceType": "historical_analysis", "language": "zh-CN"},
        },
    )

    assert response.status_code == 200, response.text
    assert store.search_calls[0]["top_k"] == 5
    assert store.search_calls[0]["filters"] == {
        "sourceType": "historical_analysis",
        "language": "zh-CN",
        "matchId": "match_mexico_south_africa",
        "teamId": "team_mexico",
        "playerId": "player_123",
    }


def test_rag_query_falls_back_to_team_context_when_match_filter_has_no_sources(
    client: TestClient,
    monkeypatch: Any,
) -> None:
    store = SequenceVectorStore([[], [source_result(match_id=None)]])
    install_fake_rag_service(monkeypatch, store)
    headers = auth_headers(client, "approved@example.com", "Approved123!")

    response = client.post(
        "/api/rag/query",
        headers=headers,
        json={
            "question": "USA pre-match risk factors",
            "matchId": "match_001",
            "teamId": "team_usa",
        },
    )

    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["sources"][0]["chunkId"] == "chunk_001"
    assert store.search_calls[0]["filters"] == {"matchId": "match_001", "teamId": "team_usa"}
    assert store.search_calls[1]["filters"] == {"teamId": "team_usa"}
    assert data["retrievalDiagnostics"]["fallbackFromFilters"] == {
        "matchId": "match_001",
        "teamId": "team_usa",
    }


def test_rag_query_no_results_returns_diagnostics_without_fake_answer(
    client: TestClient,
    monkeypatch: Any,
) -> None:
    store = FakeVectorStore([])
    install_fake_rag_service(monkeypatch, store)
    headers = auth_headers(client, "approved@example.com", "Approved123!")

    response = client.post(
        "/api/rag/query",
        headers=headers,
        json={"question": "不存在的资料", "teamId": "team_unknown"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["answer"] is None
    assert data["sources"] == []
    assert data["retrievalDiagnostics"]["status"] == "no_results"


def test_rag_query_usage_is_returned_but_not_deducted(
    client: TestClient,
    monkeypatch: Any,
) -> None:
    store = FakeVectorStore([source_result()])
    install_fake_rag_service(monkeypatch, store)
    headers = auth_headers(client, "approved@example.com", "Approved123!")

    response = client.post(
        "/api/rag/query",
        headers=headers,
        json={"question": "返回 usage 但不扣费", "teamId": "team_usa"},
    )
    tokens = client.get("/api/account/tokens", headers=headers)
    usage = client.get("/api/account/usage", headers=headers)

    assert response.status_code == 200, response.text
    assert response.json()["data"]["usage"]["tokensDeducted"] == 0
    assert tokens.json()["data"]["balanceTokens"] == 100_000
    assert usage.json()["data"] == []


def test_rag_query_rejects_betting_and_chasing_requests(
    client: TestClient,
    monkeypatch: Any,
) -> None:
    store = FakeVectorStore([source_result()])
    install_fake_rag_service(monkeypatch, store)
    headers = auth_headers(client, "approved@example.com", "Approved123!")

    response = client.post(
        "/api/rag/query",
        headers=headers,
        json={"question": "这场比赛下注金额多少，输了怎么追分？", "matchId": "match_001"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert "不提供下注" in data["answer"]
    assert data["sources"] == []
    assert data["retrievalDiagnostics"]["status"] == "safety_boundary"
    assert store.search_calls == []


def test_rag_query_returns_503_when_qdrant_unavailable(
    client: TestClient,
    monkeypatch: Any,
) -> None:
    def unavailable_store() -> FakeVectorStore:
        raise ConnectionError("qdrant unavailable")

    service = RagQueryService(vector_store_factory=unavailable_store)
    monkeypatch.setattr("app.api.routes.rag.rag_query_service", service)
    headers = auth_headers(client, "approved@example.com", "Approved123!")

    response = client.post(
        "/api/rag/query",
        headers=headers,
        json={"question": "美国队情报", "teamId": "team_usa"},
    )

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "RAG_RETRIEVAL_UNAVAILABLE"
