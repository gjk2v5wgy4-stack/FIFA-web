import { chunkDocument } from "../chunking/index.js";
import { deterministicEmbedder } from "../embeddings/index.js";

export async function ingestDocument({
  document,
  chunkOptions = {},
  vectorStore,
  embedder = deterministicEmbedder,
  dryRun = false
}) {
  const chunks = chunkDocument(document, chunkOptions);
  const embeddedChunks = [];

  for (const chunk of chunks) {
    embeddedChunks.push({
      ...chunk,
      embedding: await embedText(embedder, chunk.content)
    });
  }

  if (!dryRun) {
    if (!vectorStore) {
      throw new TypeError("vectorStore is required unless dryRun is true");
    }
    await vectorStore.upsert(embeddedChunks);
  }

  return {
    chunks: embeddedChunks,
    diagnostics: {
      documentId: document.documentId,
      chunkCount: embeddedChunks.length,
      dryRun,
      vectorStore: dryRun ? null : vectorStore?.name ?? vectorStore?.constructor?.name ?? "unknown"
    }
  };
}

async function embedText(embedder, text) {
  if (typeof embedder === "function") {
    return embedder(text);
  }
  if (typeof embedder?.embedText === "function") {
    return embedder.embedText(text);
  }
  if (typeof embedder?.embedQuery === "function") {
    return embedder.embedQuery(text);
  }
  throw new TypeError("embedder must be a function or expose embedText/embedQuery");
}
