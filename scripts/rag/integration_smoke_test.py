import argparse
import json
import pathlib
import sys
from typing import Any


ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "packages" / "rag-core" / "python"))

from worldcup_rag_qdrant import QdrantVectorStoreAdapter


def main() -> int:
    parser = argparse.ArgumentParser(description="Qdrant vector store integration smoke test.")
    parser.add_argument(
        "--use-env",
        action="store_true",
        help="Use QDRANT_HOST/QDRANT_PORT/QDRANT_API_KEY instead of in-memory Qdrant.",
    )
    parser.add_argument("--collection", default="worldcup_documents")
    parser.add_argument("--vector-dim", type=int, default=4)
    args = parser.parse_args()

    store = QdrantVectorStoreAdapter(
        collection_name=args.collection,
        vector_dim=args.vector_dim,
        location=None if args.use_env else ":memory:",
    )

    output: dict[str, Any] = {
        "collectionName": store.collection_name,
        "mode": "env_qdrant" if args.use_env else "in_memory_dry_run",
        "writesProductionDatabase": False,
    }

    store.recreate_collection()
    output["collectionCreated"] = store.client.collection_exists(store.collection_name)

    chunks = [
        {
            "chunkId": "smoke_usa:chunk:0",
            "documentId": "smoke_usa",
            "content": "美国队边路转换风险和高位压迫稳定性报告。",
            "embedding": [1.0, 0.0, 0.0, 0.0],
            "metadata": {
                "teamId": "team_usa",
                "matchId": "match_usa_paraguay",
                "sourceType": "scouting_report",
                "publishedAt": "2026-06-10T00:00:00Z",
                "url": "https://source.example.com/smoke/usa",
                "language": "zh-CN",
                "tags": ["risk", "pressing"],
                "title": "美国队Qdrant smoke报告",
            },
        },
        {
            "chunkId": "smoke_mexico:chunk:0",
            "documentId": "smoke_mexico",
            "content": "墨西哥与南非历史交锋摘要。",
            "embedding": [0.0, 1.0, 0.0, 0.0],
            "metadata": {
                "teamId": "team_mexico",
                "matchId": "match_mexico_south_africa",
                "sourceType": "historical_analysis",
                "publishedAt": "2026-06-10T00:00:00Z",
                "url": "https://source.example.com/smoke/mexico",
                "language": "zh-CN",
                "tags": ["h2h"],
                "title": "墨西哥历史交锋smoke报告",
            },
        },
    ]

    store.upsert(chunks)
    output["upsertOk"] = store.get_by_id("smoke_usa:chunk:0") is not None

    search_results = store.search(
        query_embedding=[1.0, 0.0, 0.0, 0.0],
        filters={"teamId": "team_usa", "sourceType": "scouting_report"},
        top_k=3,
    )
    assert len(search_results) == 1, "metadata filter should return only team_usa scouting report"
    output["searchOk"] = True
    output["metadataFilterOk"] = search_results[0]["chunk"]["metadata"]["teamId"] == "team_usa"
    output["retrievalExample"] = {
        "chunkId": search_results[0]["chunk"]["chunkId"],
        "documentId": search_results[0]["chunk"]["documentId"],
        "score": round(search_results[0]["score"], 6),
        "citation": {
            "title": search_results[0]["chunk"]["metadata"].get("title"),
            "sourceType": search_results[0]["chunk"]["metadata"].get("sourceType"),
            "sourceUrl": search_results[0]["chunk"]["metadata"].get("source_url"),
            "language": search_results[0]["chunk"]["metadata"].get("language"),
        },
    }

    fetched = store.get_by_id("smoke_usa:chunk:0")
    assert fetched is not None, "get_by_id should return inserted chunk"
    output["getByIdOk"] = fetched["chunkId"] == "smoke_usa:chunk:0"

    deleted = store.delete_by_document_id("smoke_usa")
    output["deleteByDocumentIdOk"] = deleted == 1 and store.get_by_id("smoke_usa:chunk:0") is None

    cleanup_ok = store.drop_collection()
    output["collectionCleanupOk"] = cleanup_ok and not store.client.collection_exists(store.collection_name)
    output["ready"] = all(
        [
            output["collectionCreated"],
            output["upsertOk"],
            output["searchOk"],
            output["metadataFilterOk"],
            output["getByIdOk"],
            output["deleteByDocumentIdOk"],
            output["collectionCleanupOk"],
        ]
    )

    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
