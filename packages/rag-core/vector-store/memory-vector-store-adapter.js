import { cosineSimilarity } from "../embeddings/index.js";
import { matchesMetadataFilters } from "./filters.js";
import { VectorStoreAdapter } from "./vector-store-adapter.js";

export class MemoryVectorStoreAdapter extends VectorStoreAdapter {
  constructor(options = {}) {
    super();
    this.name = options.name ?? "memory";
    this.items = new Map();
  }

  async upsert(chunks) {
    if (!Array.isArray(chunks)) {
      throw new TypeError("chunks must be an array");
    }

    for (const chunk of chunks) {
      if (!chunk?.chunkId) {
        throw new TypeError("chunk.chunkId is required");
      }
      if (!Array.isArray(chunk.embedding)) {
        throw new TypeError(`chunk ${chunk.chunkId} is missing embedding`);
      }
      this.items.set(chunk.chunkId, cloneChunk(chunk));
    }
  }

  async search(queryEmbedding, filters = {}, topK = 8) {
    if (!Array.isArray(queryEmbedding)) {
      throw new TypeError("queryEmbedding must be an array");
    }

    return [...this.items.values()]
      .filter((chunk) => matchesMetadataFilters(chunk.metadata, filters))
      .map((chunk) => ({
        chunk: cloneChunk(chunk),
        score: cosineSimilarity(queryEmbedding, chunk.embedding)
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, topK);
  }

  async deleteByDocumentId(documentId) {
    let deleted = 0;
    for (const [chunkId, chunk] of this.items.entries()) {
      if (chunk.documentId === documentId || chunk.metadata?.documentId === documentId) {
        this.items.delete(chunkId);
        deleted += 1;
      }
    }
    return deleted;
  }

  async getById(chunkId) {
    const chunk = this.items.get(chunkId);
    return chunk ? cloneChunk(chunk) : null;
  }
}

function cloneChunk(chunk) {
  return {
    ...chunk,
    embedding: [...chunk.embedding],
    metadata: {
      ...chunk.metadata,
      tags: [...(chunk.metadata?.tags ?? [])],
      team_ids: [...(chunk.metadata?.team_ids ?? [])],
      player_ids: [...(chunk.metadata?.player_ids ?? [])],
      match_ids: [...(chunk.metadata?.match_ids ?? [])]
    }
  };
}
