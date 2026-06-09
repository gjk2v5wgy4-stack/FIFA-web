import { buildCitations } from "../citations/index.js";
import { deterministicEmbedder } from "../embeddings/index.js";

export async function retrieveContext({
  query,
  matchId,
  teamId,
  playerId,
  topK = 8,
  filters = {},
  vectorStore,
  embedder = deterministicEmbedder
}) {
  if (!vectorStore) {
    throw new TypeError("vectorStore is required");
  }
  if (!query || typeof query !== "string") {
    throw new TypeError("query is required");
  }

  const safeTopK = Number.isInteger(topK) && topK > 0 ? topK : 8;
  const filtersApplied = {
    ...filters,
    ...(matchId ? { matchId } : {}),
    ...(teamId ? { teamId } : {}),
    ...(playerId ? { playerId } : {})
  };
  const queryEmbedding = await embedQuery(embedder, query);
  const searchResults = await vectorStore.search(queryEmbedding, filtersApplied, safeTopK);
  const chunks = searchResults.map((result) => result.chunk ?? result);
  const sources = buildCitations(chunks);

  return {
    chunks,
    sources,
    retrievalDiagnostics: {
      requestedTopK: safeTopK,
      returnedCount: chunks.length,
      filtersApplied,
      retrievalStatus: chunks.length > 0 ? "ok" : "no_results",
      vectorStore: vectorStore.name ?? vectorStore.constructor?.name ?? "unknown",
      embeddingDimensions: queryEmbedding.length,
      scores: searchResults.map((result) => ({
        chunkId: result.chunk?.chunkId ?? result.chunkId,
        score: Number((result.score ?? 0).toFixed(6))
      }))
    }
  };
}

async function embedQuery(embedder, query) {
  if (typeof embedder === "function") {
    return embedder(query);
  }
  if (typeof embedder?.embedQuery === "function") {
    return embedder.embedQuery(query);
  }
  if (typeof embedder?.embedText === "function") {
    return embedder.embedText(query);
  }
  throw new TypeError("embedder must be a function or expose embedQuery/embedText");
}
