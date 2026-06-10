import json
import pathlib
import sys
from typing import Any


ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "packages" / "rag-core" / "python"))

from worldcup_rag_qdrant import QdrantVectorStoreAdapter


def main() -> int:
    request = json.load(sys.stdin)
    options = request.get("options") or {}
    store = QdrantVectorStoreAdapter(**options)
    operation = request.get("operation")

    if operation == "ensure_collection":
        store.ensure_collection()
        response: Any = {"ok": True, "collectionName": store.collection_name}
    elif operation == "upsert":
        store.upsert(request.get("chunks") or [])
        response = {"ok": True}
    elif operation == "search":
        response = {
            "results": store.search(
                query_embedding=request["queryEmbedding"],
                filters=request.get("filters") or {},
                top_k=request.get("topK") or 8,
            )
        }
    elif operation == "deleteByDocumentId":
        response = {"deleted": store.delete_by_document_id(request["documentId"])}
    elif operation == "getById":
        response = {"chunk": store.get_by_id(request["chunkId"])}
    else:
        raise ValueError(f"unsupported operation: {operation}")

    json.dump(response, sys.stdout, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
