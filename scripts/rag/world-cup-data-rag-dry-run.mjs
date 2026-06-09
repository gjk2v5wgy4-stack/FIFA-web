import { readFile } from "node:fs/promises";

import { ingestDocument } from "../../packages/rag-core/index.js";

const [ragDocument, usaDocument, historicalDocument, manifest] = await Promise.all([
  readFile("docs/rag/world-cup-2026-national-team-data-rag.md", "utf8"),
  readFile("docs/rag/teams/wc2026-usa-data.md", "utf8"),
  readFile("docs/rag/historical/world-cup-historical-matchups.md", "utf8"),
  readFile("docs/rag/world-cup-2026-source-manifest.json", "utf8")
]);
const expandedSeeds = JSON.parse(
  await readFile("docs/rag/world-cup-2026-expanded-web-source-seeds.json", "utf8")
);
const usaSeeds = JSON.parse(await readFile("docs/rag/teams/wc2026-usa-search-seeds.json", "utf8"));
const historicalSeeds = JSON.parse(
  await readFile("docs/rag/historical/world-cup-historical-matchups-seeds.json", "utf8")
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

const usaResult = await ingestDocument({
  dryRun: true,
  document: {
    documentId: "wc2026_team_usa_data_001",
    sourceType: "analysis",
    title: "USA 2026 World Cup public data sample",
    content: usaDocument,
    metadata: {
      sourceType: "analysis",
      title: "USA 2026 World Cup public data sample",
      teamId: "team_usa",
      competition: "FIFA World Cup 2026",
      publishedAt: parsedManifest.generatedAt,
      url: "docs/rag/teams/wc2026-usa-data.md",
      reliability: "medium_public_sources_cross_checked",
      language: "zh-CN",
      tags: ["world_cup_2026", "team_profile", "usa", "public_data"],
      page: 1
    }
  },
  chunkOptions: {
    chunkSize: 180,
    overlap: 25
  }
});

const historicalResult = await ingestDocument({
  dryRun: true,
  document: {
    documentId: "rag_world_cup_historical_matchups_001",
    sourceType: "analysis",
    title: "World Cup historical matchups sample",
    content: historicalDocument,
    metadata: {
      sourceType: "analysis",
      title: "World Cup historical matchups sample",
      competition: "FIFA World Cup historical finals",
      publishedAt: parsedManifest.generatedAt,
      url: "docs/rag/historical/world-cup-historical-matchups.md",
      reliability: "medium_public_sources_cross_checked",
      language: "zh-CN",
      tags: ["world_cup", "historical_matchups", "head_to_head", "usa"],
      page: 1
    }
  },
  chunkOptions: {
    chunkSize: 180,
    overlap: 25
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
      usaChunkCount: usaResult.diagnostics.chunkCount,
      usaOfficialSourceCount: usaSeeds.officialSources.length,
      usaPublicStatsSourceCount: usaSeeds.publicStatsSources.length,
      historicalChunkCount: historicalResult.diagnostics.chunkCount,
      historicalUsaGroupDWorldCupH2HCount: historicalSeeds.usaGroupDWorldCupHeadToHead.length,
      historicalUsaAnchorMatchCount: historicalSeeds.usaHistoricalAnchorMatches.length,
      firstChunkMetadata: result.chunks[0]?.metadata
    },
    null,
    2
  )
);
