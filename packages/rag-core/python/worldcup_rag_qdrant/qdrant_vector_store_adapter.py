from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any

try:
    from qdrant_client import QdrantClient
    from qdrant_client.http import models
except ModuleNotFoundError as exc:  # pragma: no cover - exercised when dependency is absent
    raise ModuleNotFoundError(
        "qdrant-client is required for QdrantVectorStoreAdapter. "
        "Install it with: python -m pip install -r requirements.txt"
    ) from exc


DEFAULT_COLLECTION_NAME = "worldcup_documents"
DEFAULT_VECTOR_DIM = 1536
POINT_NAMESPACE = uuid.UUID("09a61f7e-c311-4e4b-a841-6e1ec63f3d48")

SOURCE_TYPES = {
    "tactical_report",
    "injury_news",
    "press_conference",
    "scouting_report",
    "historical_analysis",
    "official_notice",
}

SOURCE_TYPE_ALIASES = {
    "analysis": "historical_analysis",
    "stats_feed": "scouting_report",
    "official_release": "official_notice",
    "injury_report": "injury_news",
    "news": "press_conference",
}

FILTER_FIELD_ALIASES = {
    "documentId": "document_id",
    "document_id": "document_id",
    "teamId": "metadata.team_id",
    "team_id": "metadata.team_id",
    "playerId": "metadata.player_id",
    "player_id": "metadata.player_id",
    "matchId": "metadata.match_id",
    "match_id": "metadata.match_id",
    "sourceType": "metadata.source_type",
    "source_type": "metadata.source_type",
    "publishedAt": "metadata.published_at",
    "published_at": "metadata.published_at",
    "url": "metadata.source_url",
    "source_url": "metadata.source_url",
    "language": "metadata.language",
    "tags": "metadata.tags",
}


class QdrantVectorStoreAdapter:
    def __init__(
        self,
        *,
        host: str | None = None,
        port: int | str | None = None,
        api_key: str | None = None,
        collection_name: str | None = None,
        vector_dim: int | str | None = None,
        location: str | None = None,
        prefer_grpc: bool = False,
        client: QdrantClient | None = None,
    ) -> None:
        self.collection_name = collection_name or os.getenv("QDRANT_COLLECTION") or DEFAULT_COLLECTION_NAME
        self.vector_dim = int(vector_dim or os.getenv("VECTOR_DIM") or DEFAULT_VECTOR_DIM)

        if client is not None:
            self.client = client
        elif location is not None:
            self.client = QdrantClient(location=location)
        else:
            resolved_host = host or os.getenv("QDRANT_HOST") or "localhost"
            resolved_port = int(port or os.getenv("QDRANT_PORT") or 6333)
            resolved_api_key = api_key if api_key is not None else os.getenv("QDRANT_API_KEY")
            self.client = QdrantClient(
                host=resolved_host,
                port=resolved_port,
                api_key=resolved_api_key or None,
                prefer_grpc=prefer_grpc,
            )

    def ensure_collection(self) -> None:
        if self.client.collection_exists(self.collection_name):
            return

        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=models.VectorParams(size=self.vector_dim, distance=models.Distance.COSINE),
        )
        self._create_payload_indexes()

    def recreate_collection(self) -> None:
        if self.client.collection_exists(self.collection_name):
            self.client.delete_collection(self.collection_name)
        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=models.VectorParams(size=self.vector_dim, distance=models.Distance.COSINE),
        )
        self._create_payload_indexes()

    def drop_collection(self) -> bool:
        if not self.client.collection_exists(self.collection_name):
            return False
        self.client.delete_collection(self.collection_name)
        return True

    def upsert(self, chunks: list[dict[str, Any]]) -> None:
        self.ensure_collection()
        points = [self._chunk_to_point(chunk) for chunk in chunks]
        if not points:
            return
        self.client.upsert(collection_name=self.collection_name, points=points, wait=True)

    def search(
        self,
        query_embedding: list[float],
        filters: dict[str, Any] | None = None,
        top_k: int = 8,
    ) -> list[dict[str, Any]]:
        self._validate_embedding(query_embedding)
        query_filter = self._build_filter(filters or {})
        response = self.client.query_points(
            collection_name=self.collection_name,
            query=query_embedding,
            query_filter=query_filter,
            limit=max(1, int(top_k)),
            with_payload=True,
            with_vectors=True,
        )
        points = getattr(response, "points", response)
        return [self._point_to_search_result(point) for point in points]

    def delete_by_document_id(self, document_id: str) -> int:
        count_filter = models.Filter(
            must=[models.FieldCondition(key="document_id", match=models.MatchValue(value=document_id))]
        )
        deleted_count = self.client.count(
            collection_name=self.collection_name,
            count_filter=count_filter,
            exact=True,
        ).count
        if deleted_count:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.FilterSelector(filter=count_filter),
                wait=True,
            )
        return int(deleted_count)

    def get_by_id(self, chunk_id: str) -> dict[str, Any] | None:
        points = self.client.retrieve(
            collection_name=self.collection_name,
            ids=[self._point_id(chunk_id)],
            with_payload=True,
            with_vectors=True,
        )
        if not points:
            return None
        return self._point_to_chunk(points[0])

    def _create_payload_indexes(self) -> None:
        index_specs = [
            ("document_id", models.PayloadSchemaType.KEYWORD),
            ("chunk_id", models.PayloadSchemaType.KEYWORD),
            ("metadata.team_id", models.PayloadSchemaType.KEYWORD),
            ("metadata.player_id", models.PayloadSchemaType.KEYWORD),
            ("metadata.match_id", models.PayloadSchemaType.KEYWORD),
            ("metadata.source_type", models.PayloadSchemaType.KEYWORD),
            ("metadata.published_at", models.PayloadSchemaType.DATETIME),
            ("metadata.source_url", models.PayloadSchemaType.KEYWORD),
            ("metadata.retrieved_at", models.PayloadSchemaType.DATETIME),
            ("metadata.language", models.PayloadSchemaType.KEYWORD),
            ("metadata.tags", models.PayloadSchemaType.KEYWORD),
        ]
        for field_name, schema_type in index_specs:
            try:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name=field_name,
                    field_schema=schema_type,
                )
            except Exception:
                # Qdrant local/in-memory and repeated creation can be permissive or noisy
                # depending on client version. Indexes are an optimization, not data loss.
                continue

    def _chunk_to_point(self, chunk: dict[str, Any]) -> models.PointStruct:
        chunk_id = _required_string(chunk, "chunkId")
        embedding = chunk.get("embedding")
        self._validate_embedding(embedding)
        metadata = normalize_metadata(chunk)
        payload = {
            "chunk_id": chunk_id,
            "document_id": _required_string(chunk, "documentId", fallback=metadata.get("documentId")),
            "text": str(chunk.get("content") or ""),
            "metadata": metadata,
        }
        return models.PointStruct(
            id=self._point_id(chunk_id),
            vector=[float(value) for value in embedding],
            payload=payload,
        )

    def _point_to_search_result(self, point: Any) -> dict[str, Any]:
        return {
            "chunk": self._point_to_chunk(point),
            "score": float(getattr(point, "score", 0.0) or 0.0),
        }

    def _point_to_chunk(self, point: Any) -> dict[str, Any]:
        payload = getattr(point, "payload", None) or {}
        metadata = payload.get("metadata") or {}
        chunk_id = payload.get("chunk_id") or metadata.get("chunkId")
        document_id = payload.get("document_id") or metadata.get("documentId")
        vector = getattr(point, "vector", None)
        if isinstance(vector, dict):
            vector = vector.get("") or next(iter(vector.values()), [])
        return {
            "chunkId": chunk_id,
            "documentId": document_id,
            "content": payload.get("text") or "",
            "embedding": vector or [],
            "metadata": metadata,
        }

    def _build_filter(self, filters: dict[str, Any]) -> models.Filter | None:
        conditions = []
        for key, value in filters.items():
            if value is None or value == "":
                continue
            qdrant_key = FILTER_FIELD_ALIASES.get(key, f"metadata.{key}")
            values = value if isinstance(value, list) else [value]
            if len(values) == 1:
                conditions.append(
                    models.FieldCondition(key=qdrant_key, match=models.MatchValue(value=str(values[0])))
                )
            else:
                conditions.append(
                    models.FieldCondition(key=qdrant_key, match=models.MatchAny(any=[str(item) for item in values]))
                )
        return models.Filter(must=conditions) if conditions else None

    def _validate_embedding(self, embedding: Any) -> None:
        if not isinstance(embedding, list) or not embedding:
            raise TypeError("embedding must be a non-empty list")
        if len(embedding) != self.vector_dim:
            raise ValueError(f"embedding dimension {len(embedding)} does not match VECTOR_DIM {self.vector_dim}")

    def _point_id(self, chunk_id: str) -> str:
        return str(uuid.uuid5(POINT_NAMESPACE, chunk_id))


def normalize_metadata(chunk: dict[str, Any]) -> dict[str, Any]:
    source = dict(chunk.get("metadata") or {})
    document_id = chunk.get("documentId") or source.get("documentId") or source.get("document_id")
    chunk_id = chunk.get("chunkId") or source.get("chunkId") or source.get("chunk_id")
    original_source_type = source.get("sourceType") or source.get("source_type")
    source_type = normalize_source_type(original_source_type)

    team_id = source.get("teamId") or source.get("team_id")
    player_id = source.get("playerId") or source.get("player_id")
    match_id = source.get("matchId") or source.get("match_id")
    source_url = source.get("url") or source.get("source_url")
    published_at = source.get("publishedAt") or source.get("published_at")
    retrieved_at = source.get("retrievedAt") or source.get("retrieved_at") or _now_iso()
    tags = source.get("tags") or []
    if not isinstance(tags, list):
        tags = [tags]

    normalized = {
        **source,
        "chunkId": chunk_id,
        "chunk_id": chunk_id,
        "documentId": document_id,
        "document_id": document_id,
        "sourceType": source_type,
        "source_type": source_type,
        "original_source_type": original_source_type,
        "teamId": team_id,
        "team_id": team_id,
        "playerId": player_id,
        "player_id": player_id,
        "matchId": match_id,
        "match_id": match_id,
        "publishedAt": published_at,
        "published_at": published_at,
        "url": source_url,
        "source_url": source_url,
        "retrievedAt": retrieved_at,
        "retrieved_at": retrieved_at,
        "language": source.get("language") or "zh-CN",
        "tags": [str(tag) for tag in tags],
    }
    return {key: value for key, value in normalized.items() if value is not None}


def _required_string(source: dict[str, Any], key: str, fallback: Any = None) -> str:
    value = source.get(key) or fallback
    if not value:
        raise ValueError(f"{key} is required")
    return str(value)


def normalize_source_type(source_type: Any) -> str:
    if source_type in SOURCE_TYPES:
        return str(source_type)
    return SOURCE_TYPE_ALIASES.get(str(source_type), "scouting_report")


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()
