export class VectorStoreAdapter {
  async upsert(_chunks) {
    throw new Error("VectorStoreAdapter.upsert must be implemented by a concrete adapter");
  }

  async search(_queryEmbedding, _filters = {}, _topK = 8) {
    throw new Error("VectorStoreAdapter.search must be implemented by a concrete adapter");
  }

  async deleteByDocumentId(_documentId) {
    throw new Error("VectorStoreAdapter.deleteByDocumentId must be implemented by a concrete adapter");
  }

  async getById(_chunkId) {
    throw new Error("VectorStoreAdapter.getById must be implemented by a concrete adapter");
  }
}
