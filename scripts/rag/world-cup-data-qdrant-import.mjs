import { readFile } from "node:fs/promises";

import {
  QdrantVectorStoreAdapter,
  embedTextDeterministic,
  ingestDocument
} from "../../packages/rag-core/index.js";

const vectorDim = Number(process.env.VECTOR_DIM ?? process.env.QDRANT_VECTOR_SIZE ?? 1536);
const collectionName = process.env.QDRANT_COLLECTION ?? "worldcup_document_chunks";
const qdrantHost = process.env.QDRANT_HOST ?? "127.0.0.1";
const qdrantPort = Number(process.env.QDRANT_PORT ?? 6333);

const embedder = {
  embedText: (text) => embedTextDeterministic(text, { dimensions: vectorDim }),
  embedQuery: (text) => embedTextDeterministic(text, { dimensions: vectorDim })
};

const store = new QdrantVectorStoreAdapter({
  host: qdrantHost,
  port: qdrantPort,
  collectionName,
  vectorDim
});

const manifest = JSON.parse(await readFile("docs/rag/world-cup-2026-source-manifest.json", "utf8"));

const documents = [
  {
    path: "docs/rag/world-cup-2026-national-team-data-rag.md",
    documentId: "rag_wc2026_national_team_data_requirements_001",
    title: "2026 World Cup national-team RAG data requirements",
    tags: ["world_cup_2026", "rag", "data_requirements", "national_teams"],
    chunkSize: 220,
    overlap: 30
  },
  {
    path: "docs/rag/teams/wc2026-usa-data.md",
    documentId: "wc2026_team_usa_data_001",
    title: "USA 2026 World Cup public data sample",
    teamId: "team_usa",
    tags: ["world_cup_2026", "team_profile", "usa", "public_data"],
    chunkSize: 180,
    overlap: 25
  },
  {
    path: "docs/rag/historical/world-cup-historical-matchups.md",
    documentId: "rag_world_cup_historical_matchups_001",
    title: "World Cup historical matchup sample",
    tags: ["world_cup", "historical_matchups", "head_to_head", "usa"],
    chunkSize: 180,
    overlap: 25
  },
  {
    path: "docs/rag/world-cup-2026-provider-endpoint-directory.md",
    documentId: "rag_wc2026_provider_endpoint_directory_001",
    title: "2026 World Cup RAG provider endpoint directory",
    tags: ["world_cup_2026", "provider_directory", "source_mapping", "rag"],
    chunkSize: 220,
    overlap: 30
  },
  {
    path: "docs/rag/world-cup-2026-h2h-public-data-coverage.md",
    documentId: "rag_wc2026_h2h_public_data_coverage_001",
    title: "2026 World Cup head-to-head public data coverage",
    tags: ["world_cup_2026", "head_to_head", "h2h", "public_data"],
    chunkSize: 220,
    overlap: 30
  },
  {
    path: "docs/rag/qdrant-vector-db-integration.md",
    documentId: "rag_qdrant_vector_db_integration_001",
    title: "Qdrant vector database integration notes",
    tags: ["rag", "qdrant", "vector_store", "integration"],
    chunkSize: 200,
    overlap: 25
  }
];

await store.ensureCollection();

const results = [];
for (const source of documents) {
  const content = await readFile(source.path, "utf8");
  const result = await ingestDocument({
    vectorStore: store,
    embedder,
    document: {
      documentId: source.documentId,
      sourceType: "analysis",
      title: source.title,
      content,
      metadata: {
        sourceType: "analysis",
        title: source.title,
        teamId: source.teamId,
        competition: "2026 FIFA World Cup",
        publishedAt: manifest.generatedAt,
        url: source.path,
        reliability: "medium",
        language: "zh-CN",
        tags: source.tags,
        page: 1
      }
    },
    chunkOptions: {
      chunkSize: source.chunkSize,
      overlap: source.overlap
    }
  });
  results.push(result.diagnostics);
}

const totalChunks = results.reduce((sum, item) => sum + item.chunkCount, 0);
console.log(
  JSON.stringify(
    {
      ok: true,
      collectionName,
      qdrantHost,
      qdrantPort,
      vectorDim,
      documentCount: results.length,
      totalChunks,
      documents: results
    },
    null,
    2
  )
);
