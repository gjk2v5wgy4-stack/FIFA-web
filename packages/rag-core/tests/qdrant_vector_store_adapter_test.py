import pathlib
import sys
import unittest


PYTHON_PACKAGE_ROOT = pathlib.Path(__file__).resolve().parents[1] / "python"
sys.path.insert(0, str(PYTHON_PACKAGE_ROOT))

from worldcup_rag_qdrant.qdrant_vector_store_adapter import QdrantVectorStoreAdapter, normalize_source_type


class QdrantVectorStoreAdapterTest(unittest.TestCase):
    def setUp(self):
        self.store = QdrantVectorStoreAdapter(
            location=":memory:",
            collection_name="worldcup_documents",
            vector_dim=4,
        )
        self.store.recreate_collection()

    def tearDown(self):
        self.store.drop_collection()

    def test_upsert_search_get_and_delete_with_metadata_filters(self):
        chunks = [
            {
                "chunkId": "doc_usa:chunk:0",
                "documentId": "doc_usa",
                "content": "美国队边路防守转换和高位压迫风险。",
                "embedding": [1.0, 0.0, 0.0, 0.0],
                "metadata": {
                    "teamId": "team_usa",
                    "matchId": "match_usa_paraguay",
                    "sourceType": "scouting_report",
                    "publishedAt": "2026-06-01T00:00:00Z",
                    "url": "https://source.example.com/usa",
                    "language": "zh-CN",
                    "tags": ["pressing", "risk"],
                    "title": "美国队球探报告",
                },
            },
            {
                "chunkId": "doc_mexico:chunk:0",
                "documentId": "doc_mexico",
                "content": "墨西哥队历史交锋摘要。",
                "embedding": [0.0, 1.0, 0.0, 0.0],
                "metadata": {
                    "teamId": "team_mexico",
                    "matchId": "match_mexico_south_africa",
                    "sourceType": "historical_analysis",
                    "publishedAt": "2026-06-01T00:00:00Z",
                    "url": "https://source.example.com/mexico",
                    "language": "zh-CN",
                    "tags": ["h2h"],
                    "title": "墨西哥历史交锋",
                },
            },
        ]

        self.store.upsert(chunks)

        search_result = self.store.search(
            query_embedding=[1.0, 0.0, 0.0, 0.0],
            filters={"teamId": "team_usa", "sourceType": "scouting_report"},
            top_k=3,
        )

        self.assertEqual(len(search_result), 1)
        self.assertEqual(search_result[0]["chunk"]["chunkId"], "doc_usa:chunk:0")
        self.assertEqual(search_result[0]["chunk"]["metadata"]["teamId"], "team_usa")
        self.assertGreater(search_result[0]["score"], 0.99)

        fetched = self.store.get_by_id("doc_usa:chunk:0")
        self.assertIsNotNone(fetched)
        self.assertEqual(fetched["documentId"], "doc_usa")
        self.assertEqual(fetched["metadata"]["source_url"], "https://source.example.com/usa")

        deleted = self.store.delete_by_document_id("doc_usa")
        self.assertEqual(deleted, 1)
        self.assertIsNone(self.store.get_by_id("doc_usa:chunk:0"))
        self.assertIsNotNone(self.store.get_by_id("doc_mexico:chunk:0"))

    def test_source_type_aliases_match_collection_schema(self):
        self.assertEqual(normalize_source_type("analysis"), "historical_analysis")
        self.assertEqual(normalize_source_type("official_release"), "official_notice")
        self.assertEqual(normalize_source_type("unknown_source"), "scouting_report")


if __name__ == "__main__":
    unittest.main()
