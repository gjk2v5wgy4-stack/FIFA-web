import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
TEAM_DOCS = {
    "team_can": ROOT / "docs" / "rag" / "teams" / "wc2026-canada-data.md",
    "team_bih": ROOT / "docs" / "rag" / "teams" / "wc2026-bosnia-herzegovina-data.md",
}


def extract_metadata(path: Path) -> dict[str, object]:
    text = path.read_text(encoding="utf-8")
    match = re.search(r"## RAG Metadata\s*```json\s*(\{.*?\})\s*```", text, re.S)
    if not match:
        raise AssertionError(f"{path} is missing a RAG Metadata JSON block")
    return json.loads(match.group(1))


class Match003RagDocumentCoverageTest(unittest.TestCase):
    def test_canada_and_bosnia_documents_cover_match_003(self):
        for team_id, path in TEAM_DOCS.items():
            with self.subTest(team_id=team_id):
                self.assertTrue(path.exists(), f"{path} must exist")
                text = path.read_text(encoding="utf-8")
                metadata = extract_metadata(path)

                self.assertEqual(metadata["teamId"], team_id)
                self.assertEqual(metadata["matchId"], "match_003")
                self.assertIn("球队历史表现数据", text)
                self.assertIn("球员多维数据", text)
                self.assertIn("比赛环境和外部因素", text)
                self.assertIn("外部来源和数据覆盖", text)
                self.assertNotIn("投" + "注建议", text)
                self.assertNotIn("稳" + "赚", text)


if __name__ == "__main__":
    unittest.main()
