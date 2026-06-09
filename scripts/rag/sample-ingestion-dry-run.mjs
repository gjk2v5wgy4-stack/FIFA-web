import { ingestDocument } from "../../packages/rag-core/index.js";

const result = await ingestDocument({
  dryRun: true,
  document: {
    documentId: "sample_doc_001",
    sourceType: "scouting_report",
    title: "Sample match intelligence",
    content:
      "High pressing can create chances, but wide defensive transitions remain a risk factor. " +
      "Player workload and humidity should be treated as uncertainty inputs before the match.",
    metadata: {
      sourceType: "scouting_report",
      title: "Sample match intelligence",
      teamId: "team_usa",
      playerId: "player_001",
      matchId: "match_001",
      competition: "group",
      publishedAt: "2026-06-01T00:00:00Z",
      url: "https://source.example.com/sample",
      reliability: "medium",
      language: "en",
      tags: ["sample", "risk"],
      page: 1
    }
  },
  chunkOptions: {
    chunkSize: 32,
    overlap: 4
  }
});

console.log(
  JSON.stringify(
    {
      documentId: result.diagnostics.documentId,
      dryRun: result.diagnostics.dryRun,
      chunkCount: result.diagnostics.chunkCount,
      firstChunk: {
        chunkId: result.chunks[0]?.chunkId,
        tokenCount: result.chunks[0]?.tokenCount,
        metadata: result.chunks[0]?.metadata
      }
    },
    null,
    2
  )
);
