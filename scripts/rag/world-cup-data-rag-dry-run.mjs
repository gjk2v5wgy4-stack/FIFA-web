import { readFile } from "node:fs/promises";

import { ingestDocument } from "../../packages/rag-core/index.js";

const [ragDocument, usaDocument, historicalDocument, providerDirectoryDocument, h2hCoverageDocument, manifest] = await Promise.all([
  readFile("docs/rag/world-cup-2026-national-team-data-rag.md", "utf8"),
  readFile("docs/rag/teams/wc2026-usa-data.md", "utf8"),
  readFile("docs/rag/historical/world-cup-historical-matchups.md", "utf8"),
  readFile("docs/rag/world-cup-2026-provider-endpoint-directory.md", "utf8"),
  readFile("docs/rag/world-cup-2026-h2h-public-data-coverage.md", "utf8"),
  readFile("docs/rag/world-cup-2026-source-manifest.json", "utf8")
]);
const expandedSeeds = JSON.parse(
  await readFile("docs/rag/world-cup-2026-expanded-web-source-seeds.json", "utf8")
);
const usaSeeds = JSON.parse(await readFile("docs/rag/teams/wc2026-usa-search-seeds.json", "utf8"));
const historicalSeeds = JSON.parse(
  await readFile("docs/rag/historical/world-cup-historical-matchups-seeds.json", "utf8")
);
const providerDirectory = JSON.parse(
  await readFile("docs/rag/world-cup-2026-provider-endpoint-directory.json", "utf8")
);
const h2hCoverage = JSON.parse(await readFile("docs/rag/world-cup-2026-h2h-public-data-coverage.json", "utf8"));

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
      competition: "2026 FIFA 世界杯",
      publishedAt: parsedManifest.generatedAt,
      url: "docs/rag/world-cup-2026-national-team-data-rag.md",
      reliability: "高：字段口径明确；中等：来源覆盖不完整",
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
    title: "美国 2026 世界杯公开数据样本",
    content: usaDocument,
    metadata: {
      sourceType: "analysis",
      title: "美国 2026 世界杯公开数据样本",
      teamId: "team_usa",
      competition: "2026 FIFA 世界杯",
      publishedAt: parsedManifest.generatedAt,
      url: "docs/rag/teams/wc2026-usa-data.md",
      reliability: "中等：公开来源已交叉核验",
      language: "zh-CN",
      tags: ["world_cup_2026", "team_profile", "usa", "public_data", "美国"],
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
    title: "世界杯历史对战样本",
    content: historicalDocument,
    metadata: {
      sourceType: "analysis",
      title: "世界杯历史对战样本",
      competition: "FIFA 世界杯历届正赛",
      publishedAt: parsedManifest.generatedAt,
      url: "docs/rag/historical/world-cup-historical-matchups.md",
      reliability: "中等：公开来源已交叉核验",
      language: "zh-CN",
      tags: ["world_cup", "historical_matchups", "head_to_head", "usa", "美国"],
      page: 1
    }
  },
  chunkOptions: {
    chunkSize: 180,
    overlap: 25
  }
});

const providerDirectoryResult = await ingestDocument({
  dryRun: true,
  document: {
    documentId: "rag_wc2026_provider_endpoint_directory_001",
    sourceType: "analysis",
    title: "2026 世界杯 RAG 数据供应商与公开来源端点目录",
    content: providerDirectoryDocument,
    metadata: {
      sourceType: "analysis",
      title: "2026 世界杯 RAG 数据供应商与公开来源端点目录",
      competition: "2026 FIFA 世界杯",
      publishedAt: parsedManifest.generatedAt,
      url: "docs/rag/world-cup-2026-provider-endpoint-directory.md",
      reliability: "高：网页入口和授权状态明确；中等：公开站点覆盖需逐页核验",
      language: "zh-CN",
      tags: ["world_cup_2026", "provider_directory", "source_mapping", "rag"],
      page: 1
    }
  },
  chunkOptions: {
    chunkSize: 220,
    overlap: 30
  }
});

const h2hCoverageResult = await ingestDocument({
  dryRun: true,
  document: {
    documentId: "rag_wc2026_h2h_public_data_coverage_001",
    sourceType: "analysis",
    title: "2026世界杯一对一公开数据覆盖补充",
    content: h2hCoverageDocument,
    metadata: {
      sourceType: "analysis",
      title: "2026世界杯一对一公开数据覆盖补充",
      competition: "2026 FIFA 世界杯",
      publishedAt: parsedManifest.generatedAt,
      url: "docs/rag/world-cup-2026-h2h-public-data-coverage.md",
      reliability: "中等：公开H2H摘要已检索；最近五场和未来五场仍需继续补齐",
      language: "zh-CN",
      tags: ["world_cup_2026", "head_to_head", "h2h", "一对一", "public_data"],
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
      文档ID: result.diagnostics.documentId,
      是否DryRun: result.diagnostics.dryRun,
      国家队数据Chunk数量: result.diagnostics.chunkCount,
      参赛队数量: parsedManifest.qualifiedTeams.length,
      基础来源数量: parsedManifest.sourceCatalog.length,
      扩展官方来源数量: expandedSeeds.officialCompetitionSources.length,
      扩展公开统计来源数量: expandedSeeds.publicStatisticsSources.length,
      扩展授权来源数量: expandedSeeds.licensedDataSources.length,
      美国队Chunk数量: usaResult.diagnostics.chunkCount,
      美国队官方来源数量: usaSeeds.officialSources.length,
      美国队公开统计来源数量: usaSeeds.publicStatsSources.length,
      历史对战Chunk数量: historicalResult.diagnostics.chunkCount,
      美国D组世界杯历史交锋记录数量: historicalSeeds.usaGroupDWorldCupHeadToHead.length,
      美国历史世界杯锚点比赛数量: historicalSeeds.usaHistoricalAnchorMatches.length,
      信息端目录Chunk数量: providerDirectoryResult.diagnostics.chunkCount,
      商业数据与授权入口数量: providerDirectory["商业数据与授权入口"].length,
      官方赛事入口数量: providerDirectory["官方赛事入口"].length,
      公开足球数据来源数量: providerDirectory["公开足球数据来源"].length,
      天气地点球场入口数量: providerDirectory["天气地点球场入口"].length,
      新闻发布会训练入口数量: providerDirectory["新闻发布会训练入口"].length,
      一对一公开数据Chunk数量: h2hCoverageResult.diagnostics.chunkCount,
      首轮H2H覆盖场次数量: h2hCoverage["覆盖汇总"]["已补充公开H2H摘要"],
      首轮有历史交锋对阵数量: h2hCoverage["覆盖汇总"]["有既往交锋的对阵"],
      首轮无公开历史交锋对阵数量: h2hCoverage["覆盖汇总"]["公开来源未列出既往交锋的对阵"],
      首个Chunk元数据: result.chunks[0]?.metadata
    },
    null,
    2
  )
);
