import assert from "node:assert/strict";

import {
  MemoryVectorStoreAdapter,
  askWithRag,
  ingestDocument,
  retrieveContext
} from "../../packages/rag-core/index.js";

const vectorStore = new MemoryVectorStoreAdapter({ name: "smoke-memory" });

await ingestDocument({
  vectorStore,
  document: {
    documentId: "smoke_doc_001",
    sourceType: "analysis",
    title: "Smoke test report",
    content:
      "The match context highlights transition defense risk and player availability uncertainty. " +
      "The model basis should cite sources and describe uncertainty instead of certainty.",
    metadata: {
      sourceType: "analysis",
      title: "Smoke test report",
      teamId: "team_usa",
      playerId: "player_001",
      matchId: "match_001",
      competition: "group",
      publishedAt: "2026-06-02T00:00:00Z",
      url: "https://source.example.com/smoke",
      reliability: "high",
      language: "en",
      tags: ["smoke", "uncertainty"],
      page: 2
    }
  },
  chunkOptions: {
    chunkSize: 40,
    overlap: 4
  }
});

const retrieval = await retrieveContext({
  query: "transition defense risk",
  matchId: "match_001",
  topK: 3,
  vectorStore
});

assert.equal(retrieval.chunks.length > 0, true);
assert.equal(retrieval.sources.length > 0, true);

const answer = await askWithRag({
  question: "What are the main risk factors?",
  matchId: "match_001",
  topK: 3,
  vectorStore
});

assert.equal(answer.sources.length > 0, true);
assert.equal(answer.usage.usageSource, "estimated");

console.log(
  JSON.stringify(
    {
      retrievalStatus: retrieval.retrievalDiagnostics.retrievalStatus,
      returnedCount: retrieval.retrievalDiagnostics.returnedCount,
      sourceCount: answer.sources.length,
      usage: answer.usage
    },
    null,
    2
  )
);
