import { readFile } from "node:fs/promises";

import { ingestDocument } from "../../packages/rag-core/index.js";

const [ragDocument, manifest] = await Promise.all([
  readFile("docs/rag/world-cup-2026-national-team-data-rag.md", "utf8"),
  readFile("docs/rag/world-cup-2026-source-manifest.json", "utf8")
]);
const expandedSeeds = JSON.parse(
  await readFile("docs/rag/world-cup-2026-expanded-web-source-seeds.json", "utf8")
);

const parsedManifest = JSON.parse(manifest);

const result = await ingestDocument({
  dryRun: true,
  document: {
    documentId: "rag_wc2026_national_team_data_requirements_001",
    sourceType: "analysis",
    title: "2026 世界杯国家队数据 RAG 采集说明",
    content: ragDocument,
    metadata: {
      sourceType: "analysis",
      title: "2026 世界杯国家队数据 RAG 采集说明",
      competition: "FIFA World Cup 2026",
      publishedAt: parsedManifest.generatedAt,
      url: "docs/rag/world-cup-2026-national-team-data-rag.md",
      reliability: "high_for_schema_medium_for_source_availability",
      language: "zh-CN",
      tags: ["world_cup_2026", "rag", "data_requirements", "national_teams"],
      page: 1
    }
  },
  chunkOptions: {
    chunkSize: 220,
    overlap: 30
  }
});

console.log(
  JSON.stringify(
    {
      documentId: result.diagnostics.documentId,
      dryRun: result.diagnostics.dryRun,
      chunkCount: result.diagnostics.chunkCount,
      qualifiedTeamCount: parsedManifest.qualifiedTeams.length,
      sourceCount: parsedManifest.sourceCatalog.length,
      expandedOfficialSourceCount: expandedSeeds.officialCompetitionSources.length,
      expandedPublicStatsSourceCount: expandedSeeds.publicStatisticsSources.length,
      expandedLicensedSourceCount: expandedSeeds.licensedDataSources.length,
      firstChunkMetadata: result.chunks[0]?.metadata
    },
    null,
    2
  )
);
