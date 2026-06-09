export declare const VECTOR_COLLECTION_NAME = "worldcup_document_chunks";

export declare const RAG_METADATA_FIELDS: readonly [
  "chunkId",
  "documentId",
  "sourceType",
  "title",
  "teamId",
  "playerId",
  "matchId",
  "competition",
  "publishedAt",
  "url",
  "reliability",
  "language",
  "tags",
  "page"
];

export declare const RAG_USAGE_SOURCE_ESTIMATED = "estimated";

export type RagUsageSource = typeof RAG_USAGE_SOURCE_ESTIMATED;

export type RagSourceType =
  | "news"
  | "scouting_report"
  | "injury_report"
  | "stats_feed"
  | "official_release"
  | "analysis"
  | string;

export interface DocumentChunkMetadata {
  chunkId: string;
  documentId: string;
  sourceType: RagSourceType;
  title: string;
  teamId?: string | null;
  playerId?: string | null;
  matchId?: string | null;
  competition?: string | null;
  publishedAt?: string | null;
  url?: string | null;
  reliability?: string | null;
  language?: string | null;
  tags: string[];
  page?: number | null;
  source_type: RagSourceType;
  source_name: string;
  source_url?: string | null;
  published_at?: string | null;
  team_ids: string[];
  player_ids: string[];
  match_ids: string[];
  tournament_stage?: string | null;
  chunk_index: number;
  checksum?: string | null;
  [key: string]: unknown;
}

export interface DocumentChunk {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  embedding?: number[];
  metadata: DocumentChunkMetadata;
}

export interface VectorSearchResult {
  chunk: DocumentChunk;
  score: number;
}

export interface VectorStoreAdapter {
  upsert(chunks: DocumentChunk[]): Promise<void>;
  search(
    queryEmbedding: number[],
    filters?: Record<string, unknown>,
    topK?: number
  ): Promise<VectorSearchResult[]>;
  deleteByDocumentId(documentId: string): Promise<number>;
  getById(chunkId: string): Promise<DocumentChunk | null>;
}

export interface RagSourceCitation {
  index: number;
  chunkId: string;
  documentId: string;
  sourceType: RagSourceType;
  title: string;
  sourceName: string;
  url?: string | null;
  sourceUrl?: string | null;
  publishedAt?: string | null;
  reliability?: string | null;
  language?: string | null;
  page?: number | null;
  metadata: DocumentChunkMetadata;
}

export interface RetrievalDiagnostics {
  requestedTopK: number;
  returnedCount: number;
  filtersApplied: Record<string, unknown>;
  retrievalStatus: "ok" | "no_results" | "blocked_by_safety";
  vectorStore: string;
  embeddingDimensions: number;
  scores: Array<{ chunkId: string; score: number }>;
}

export interface RagUsage {
  promptTokens: number;
  completionTokens: number;
  embeddingTokens: number;
  totalProviderTokens: number;
  estimatedCost: number;
  model: string;
  usageSource: RagUsageSource;
}
