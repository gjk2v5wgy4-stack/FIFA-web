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
  teamId: "team_usa",
  topK: 3,
  vectorStore
});

assert.equal(retrieval.chunks.length > 0, true);
assert.equal(retrieval.sources.length > 0, true);
assert.equal(retrieval.chunks[0].metadata.matchId, "match_001");
assert.equal(retrieval.chunks[0].metadata.teamId, "team_usa");

const fetchedBeforeDelete = await vectorStore.getById(retrieval.chunks[0].chunkId);
assert.equal(fetchedBeforeDelete?.chunkId, retrieval.chunks[0].chunkId);

const answer = await askWithRag({
  question: "What are the main risk factors?",
  matchId: "match_001",
  topK: 3,
  vectorStore
});

assert.equal(answer.sources.length > 0, true);
assert.equal(answer.usage.usageSource, "estimated");

const deletedCount = await vectorStore.deleteByDocumentId("smoke_doc_001");
const fetchedAfterDelete = await vectorStore.getById(retrieval.chunks[0].chunkId);
assert.equal(deletedCount > 0, true);
assert.equal(fetchedAfterDelete, null);

console.log(
  JSON.stringify(
    {
      retrievalStatus: retrieval.retrievalDiagnostics.retrievalStatus,
      returnedCount: retrieval.retrievalDiagnostics.returnedCount,
      upsertOk: Boolean(fetchedBeforeDelete),
      getByIdOk: fetchedBeforeDelete?.chunkId === retrieval.chunks[0].chunkId,
      metadataFilterOk:
        retrieval.chunks[0].metadata.matchId === "match_001" && retrieval.chunks[0].metadata.teamId === "team_usa",
      sourceCount: answer.sources.length,
      citationExample: answer.sources[0],
      deleteByDocumentIdOk: deletedCount > 0 && fetchedAfterDelete === null,
      usage: answer.usage
    },
    null,
    2
  )
);
