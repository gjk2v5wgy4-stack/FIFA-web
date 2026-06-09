export * from "../shared/rag-types.js";

export declare function estimateTokenCount(text: string): number;
export declare function tokenize(text: string): string[];
export declare function embedTextDeterministic(text: string, options?: { dimensions?: number }): number[];
export declare function cosineSimilarity(left: number[], right: number[]): number;
export declare function buildSafetySystemText(): string;

export declare function chunkDocument(
  document: {
    documentId: string;
    sourceType?: string;
    title?: string;
    content: string;
    metadata?: Record<string, unknown>;
    [key: string]: unknown;
  },
  options?: { chunkSize?: number; overlap?: number }
): import("../shared/rag-types.js").DocumentChunk[];

export declare class MemoryVectorStoreAdapter implements import("../shared/rag-types.js").VectorStoreAdapter {
  constructor(options?: { name?: string });
  upsert(chunks: import("../shared/rag-types.js").DocumentChunk[]): Promise<void>;
  search(
    queryEmbedding: number[],
    filters?: Record<string, unknown>,
    topK?: number
  ): Promise<import("../shared/rag-types.js").VectorSearchResult[]>;
  deleteByDocumentId(documentId: string): Promise<number>;
  getById(chunkId: string): Promise<import("../shared/rag-types.js").DocumentChunk | null>;
}

export declare class ChromaVectorStoreAdapter implements import("../shared/rag-types.js").VectorStoreAdapter {
  constructor(options?: Record<string, unknown>);
  upsert(chunks: import("../shared/rag-types.js").DocumentChunk[]): Promise<void>;
  search(
    queryEmbedding: number[],
    filters?: Record<string, unknown>,
    topK?: number
  ): Promise<import("../shared/rag-types.js").VectorSearchResult[]>;
  deleteByDocumentId(documentId: string): Promise<number>;
  getById(chunkId: string): Promise<import("../shared/rag-types.js").DocumentChunk | null>;
}

export declare class QdrantVectorStoreAdapter implements import("../shared/rag-types.js").VectorStoreAdapter {
  constructor(options?: Record<string, unknown>);
  upsert(chunks: import("../shared/rag-types.js").DocumentChunk[]): Promise<void>;
  search(
    queryEmbedding: number[],
    filters?: Record<string, unknown>,
    topK?: number
  ): Promise<import("../shared/rag-types.js").VectorSearchResult[]>;
  deleteByDocumentId(documentId: string): Promise<number>;
  getById(chunkId: string): Promise<import("../shared/rag-types.js").DocumentChunk | null>;
}

export declare function retrieveContext(args: {
  query: string;
  matchId?: string;
  teamId?: string;
  playerId?: string;
  topK?: number;
  filters?: Record<string, unknown>;
  vectorStore: import("../shared/rag-types.js").VectorStoreAdapter;
  embedder?: unknown;
}): Promise<{
  chunks: import("../shared/rag-types.js").DocumentChunk[];
  sources: import("../shared/rag-types.js").RagSourceCitation[];
  retrievalDiagnostics: import("../shared/rag-types.js").RetrievalDiagnostics;
}>;

export declare function estimateRagUsage(args: {
  question: string;
  topK?: number;
  contextLength?: number;
  model?: string;
}): import("../shared/rag-types.js").RagUsage;

export declare function askWithRag(args: {
  question: string;
  matchId?: string;
  teamId?: string;
  playerId?: string;
  topK?: number;
  filters?: Record<string, unknown>;
  model?: string;
  vectorStore: import("../shared/rag-types.js").VectorStoreAdapter;
  embedder?: unknown;
}): Promise<{
  answer: string;
  sources: import("../shared/rag-types.js").RagSourceCitation[];
  retrievalDiagnostics: import("../shared/rag-types.js").RetrievalDiagnostics;
  usage: import("../shared/rag-types.js").RagUsage;
}>;
