import { VectorStoreAdapter } from "./vector-store-adapter.js";

export class ChromaVectorStoreAdapter extends VectorStoreAdapter {
  constructor(options = {}) {
    super();
    this.options = options;
  }

  async upsert(_chunks) {
    throw notConfigured("upsert");
  }

  async search(_queryEmbedding, _filters = {}, _topK = 8) {
    throw notConfigured("search");
  }

  async deleteByDocumentId(_documentId) {
    throw notConfigured("deleteByDocumentId");
  }

  async getById(_chunkId) {
    throw notConfigured("getById");
  }
}

function notConfigured(method) {
  return new Error(`ChromaVectorStoreAdapter.${method} is a connection stub for MVP integration`);
}
