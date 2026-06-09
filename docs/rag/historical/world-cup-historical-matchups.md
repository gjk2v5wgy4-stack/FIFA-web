# 往年世界杯对战数据 RAG 文档

## RAG Metadata

```json
{
  "documentId": "rag_world_cup_historical_matchups_001",
  "sourceType": "analysis",
  "title": "往年世界杯对战数据采集说明与美国队样本",
  "teamId": null,
  "playerId": null,
  "matchId": null,
  "competition": "FIFA 世界杯历届正赛",
  "publishedAt": "2026-06-10T00:00:00+08:00",
  "url": "docs/rag/historical/world-cup-historical-matchups.md",
  "reliability": "中等：公开来源已交叉核验",
  "language": "zh-CN",
  "tags": ["world_cup", "historical_matchups", "head_to_head", "usa", "美国"],
  "page": 1
}
```

## 目的

本文档为 RAG 增加往年 FIFA 世界杯正赛对战数据口径。它只记录世界杯正赛历史交锋，不把友谊赛、洲际杯、联合会杯、预选赛或其他赛事误并入世界杯历史交锋。

## 字段模型

每一条历史世界杯对战记录建议包含：

| 字段 | 说明 |
| --- | --- |
| `matchupId` | 稳定 ID，例如 `wc_1930_usa_paraguay` |
| `tournamentYear` | 世界杯年份 |
| `round` | 小组赛、16 强、半决赛等 |
| `matchDate` | 比赛日期，能核验时使用 ISO 日期 |
| `teamAId` / `teamBId` | 项目内部球队 ID |
| `teamAName` / `teamBName` | 队名 |
| `score` | 正赛比分 |
| `resultForTeamA` | `胜` / `平` / `负` |
| `extraTime` | 是否加时 |
| `penalties` | 是否点球大战 |
| `venue` / `city` / `country` | 地点，缺失时为 `null` |
| `sourceUrls` | 至少 1 个可核验来源 |
| `reliability` | `官方` / `公开来源交叉核验` / `需要交叉核验` |
| `notes` | 历史背景，例如首个帽子戏法、爆冷等 |

## 美国队 2026 小组对手的世界杯历史交锋

| 对战 | 世界杯历史交锋 | RAG 结论 | 来源 |
| --- | --- | --- | --- |
| 美国 vs 巴拉圭 | 1930 年世界杯小组赛，美国 3-0 巴拉圭 | 这是 2026 小组对手中可核验的直接世界杯历史交锋；伯特·帕特诺德的帽子戏法具有历史价值 | FIFA 美国队资料、FIFA 美国-巴拉圭历史、ESPN 比赛页 |
| 美国 vs 澳大利亚 | 未找到两队在 FIFA 世界杯正赛的历史交锋记录；公开页面更多是全部赛事历史交锋 | 采集器不得把 2025/2026 友谊赛或其他赛事写成世界杯历史交锋 | 澳大利亚队历史交锋页、ESPN 比赛页 |
| 美国 vs 土耳其 | 未找到两队在 FIFA 世界杯正赛的历史交锋记录；2003 年 FIFA 联合会杯不属于世界杯正赛 | 可作为非世界杯背景，不进入世界杯正赛历史交锋表 | ESPN 比赛页、FIFA 档案 |

## 美国队历史世界杯锚点比赛样本

| matchupId | 年份 | 阶段 | 比赛 | 比分 | 可用于分析的意义 | 来源 |
| --- | --- | --- | --- | --- | --- | --- |
| `wc_1930_usa_belgium` | 1930 | 第 4 组 | 美国 vs 比利时 | 3-0 | 美国队世界杯首战胜利；FIFA 资料页提到美国队 1930 年以两个 3-0 领跑小组 | FIFA 美国队资料 |
| `wc_1930_usa_paraguay` | 1930 | 第 4 组 | 美国 vs 巴拉圭 | 3-0 | 与 2026 小组对手巴拉圭的历史世界杯直接交锋；帕特诺德帽子戏法 | FIFA 美国-巴拉圭历史、ESPN |
| `wc_1950_usa_england` | 1950 | 小组赛 | 美国 vs 英格兰 | 1-0 | 世界杯历史著名爆冷，可用于“低概率事件与对手强度”检索案例 | FIFA 文章、ESPN |
| `wc_2002_usa_portugal` | 2002 | 小组赛 | 美国 vs 葡萄牙 | 3-2 | 现代美国队世界杯代表性强队胜利 | FIFA 文章、ESPN |
| `wc_2002_mexico_usa` | 2002 | 16 强 | 墨西哥 vs 美国 | 0-2 | 淘汰赛区域强敌对战样本 | ESPN |
| `wc_2010_usa_ghana` | 2010 | 16 强 | 加纳 vs 美国 | 2-1 | 加时失利样本，可标记 `extraTime=true` | ESPN |

## 入库规则

- 若同一条比赛有 FIFA 和 ESPN 两类来源，`reliability` 可设为 `公开来源交叉核验`。
- 若只有百科、论坛或社媒来源，不进入正式历史对战表，只能作为待核验种子。
- 对 2026 对手匹配分析，优先查询“同对手世界杯正赛历史交锋”；若没有历史正赛交锋，再退到全部赛事历史交锋，并显式标注 `competitionScope=全部比赛`。
- 不得把赔率、博彩语言或市场推荐写入历史对战结论。

## 来源 URL

- FIFA 档案: https://www.fifa.com/en/archive
- FIFA 美国队世界杯历史: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/usa-team-profile-history
- FIFA 美国-巴拉圭历史: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/usa-paraguay-history
- FIFA 美国 vs 葡萄牙 2002: https://www.fifa.com/en/tournaments/mens/worldcup/articles/usa-portugal-2002
- FIFA 美国 vs 英格兰 1950: https://www.fifa.com/en/tournaments/mens/worldcup/articles/glorious-gaetjens-upsets-old-order
- ESPN 美国 vs 巴拉圭 1930: https://www.espn.com/soccer/match/_/gameId/197178/paraguay-united-states
- ESPN 美国 vs 英格兰 1950: https://www.espn.com/soccer/match/_/gameId/197565/england-united-states
- ESPN 美国 vs 葡萄牙 2002: https://www.espn.com/soccer/match/_/gameId/48823/portugal-united-states
- ESPN 墨西哥 vs 美国 2002: https://www.espn.com/soccer/match/_/gameId/48889/united-states-mexico
- ESPN 加纳 vs 美国 2010: https://www.espn.com/soccer/match/_/gameId/264108/ghana-united-states
