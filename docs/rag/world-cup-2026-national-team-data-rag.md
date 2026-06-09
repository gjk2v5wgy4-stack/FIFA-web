# 2026 世界杯国家队数据 RAG 文档

## RAG Metadata

```json
{
  "documentId": "rag_wc2026_national_team_data_requirements_001",
  "sourceType": "analysis",
  "title": "2026 世界杯国家队数据 RAG 采集说明",
  "teamId": null,
  "playerId": null,
  "matchId": null,
  "competition": "FIFA World Cup 2026",
  "publishedAt": "2026-06-10T00:00:00+08:00",
  "url": "docs/rag/world-cup-2026-national-team-data-rag.md",
  "reliability": "high_for_schema_medium_for_source_availability",
  "language": "zh-CN",
  "tags": ["world_cup_2026", "rag", "data_requirements", "national_teams"],
  "page": 1
}
```

## 目的

本文档用于 RAG 入库前的数据采集、字段校验和来源审计。它不直接提供未经核验的比赛或球员数值；每一个实际数值必须由采集器写入来源 URL、采集时间、数据供应方、比赛 ID 或球员 ID，并通过 `docs/rag/world-cup-2026-source-manifest.json` 中的来源规则校验。

本轮采集窗口以 2026-06-10 为准：

- 国家队最近 2 年：2024-06-10 至 2026-06-10。
- 球员俱乐部最近 6 个月：2025-12-10 至 2026-06-10。
- 球员最近 10 场：按俱乐部正式比赛倒序取样。
- 过去 30 天与 14 天出场负荷：分别以 2026-05-11 和 2026-05-27 为窗口起点。

## 参赛国家队范围

FIFA 官方检索结果显示 2026 世界杯 48 队已确认，12 个小组已完成；参赛队按来源归类如下。

| 区域 | 国家队 |
| --- | --- |
| 共同主办 | Canada, Mexico, USA |
| AFC | Australia, Iraq, IR Iran, Japan, Jordan, Korea Republic, Qatar, Saudi Arabia, Uzbekistan |
| CAF | Algeria, Cabo Verde, Congo DR, Côte d'Ivoire, Egypt, Ghana, Morocco, Senegal, South Africa, Tunisia |
| Concacaf | Curaçao, Haiti, Panama |
| CONMEBOL | Argentina, Brazil, Colombia, Ecuador, Paraguay, Uruguay |
| OFC | New Zealand |
| UEFA | Austria, Belgium, Bosnia and Herzegovina, Croatia, Czechia, England, France, Germany, Netherlands, Norway, Portugal, Scotland, Spain, Sweden, Switzerland, Türkiye |

采集器不得手写覆盖此名单。若 FIFA 官方页面在赛前更新队名、缩写或最终阵容，必须以 FIFA 官方页面为准并保留旧值审计记录。

## 数据准确性规则

1. 不写入无来源数值。每个数值必须包含 `sourceUrl`、`sourceName`、`capturedAt`、`providerConfidence`。
2. FIFA 官方、各洲足联、国家队官方公告优先用于赛程、参赛队、阵容、停赛、发布会和官方伤病公告。
3. xG、xGA、xA、定位球 xG、反击 xG、开放战 xG、禁区触球、失误导致射门、被创造大机会等高级事件数据，只能来自授权或明确开放的数据源。
4. 冲刺次数、高强度跑动、跨洲旅行恢复负荷等跟踪/体能数据，只能来自授权跟踪数据、球队公开报告或可核验赛后报告。
5. 市场赔率只作为市场背景数据；RAG 回答不得输出市场操作建议，不得承诺结果。
6. 任何缺失字段写为 `null`，并把 `coverageStatus` 标为 `missing_public_source` 或 `requires_licensed_provider`，不得用模型猜测补值。

## 字段采集矩阵

| 数据域 | 字段 | 推荐来源 | 覆盖状态 |
| --- | --- | --- | --- |
| 国家队近期比赛 | 最近 2 年正式比赛、友谊赛、世界杯预选赛、洲际杯赛、欧国联、美洲杯、亚洲杯、非洲杯、中北美金杯赛 | FIFA、各洲足联、国家足协、Sportradar Soccer API | public_core |
| 国家队比赛技术统计 | 比分、控球率、射门数、射正数、传球成功率、红黄牌 | FIFA Match Centre、各洲足联、Sportradar Soccer API | public_partial |
| 国家队高级比赛统计 | xG、xGA、禁区触球、定位球进攻、防守拦截、失误导致射门、对手强度 | StatsBomb、Opta/Stats Perform、Wyscout、Sportradar 高级包 | requires_licensed_provider |
| 球队 xG/xGA | 场均 xG、场均 xGA、非点球 xG、定位球 xG、反击 xG、开放战 xG、被对手创造的大机会、xG 差值 | StatsBomb、Opta/Stats Perform、Wyscout、Sportradar 高级包 | requires_licensed_provider |
| 球员俱乐部表现 | 最近 6 个月出场时间、最近 10 场、每 90 分钟进球/助攻/xG/xA、关键传球、推进传球、成功过人、防守对抗、抢断、拦截、门将扑救率、阻止进球能力 | 俱乐部联赛数据商、StatsBomb、Sportradar、FBref 公开页面按许可核验 | public_partial_or_licensed |
| 球员健康 | 近期伤病、类型、缺阵天数、复出时间、复出后分钟、连续首发、旧伤复发风险、国家队停赛、累计黄牌风险 | FIFA 阵容公告、国家队官方、俱乐部官方、发布会、Sportradar injuries | public_partial |
| 球员负荷 | 赛季累计分钟、过去 30 天/14 天分钟、连续首发、跨洲旅行距离、休息天数、加时赛经历、冲刺次数、高强度跑动、年龄、恢复周期 | 赛程/出场公开数据、SkillCorner、Sportradar、球队公开报告 | mixed |
| 阵容稳定性 | 最近 10 场首发重复率、核心共同出场、中卫组合、中场三人组、锋线组合、门将固定程度、平均国家队出场、平均年龄 | FIFA/足协比赛阵容、Sportradar lineups | public_core |
| 教练战术 | 执教时间、常用阵型、压迫强度、防守阵型、反击倾向、控球倾向、边路/中路比例、定位球设计、换人习惯、领先/落后策略、淘汰赛保守程度 | 官方任命公告、比赛事件数据、战术文章、球探报告 | public_partial_or_licensed |
| 对手匹配 | 面对高位压迫、低位防守、三中卫、快速反击、边路传中、定位球、身体对抗强队的表现 | 事件数据聚合、战术标签模型、授权数据商 | requires_modeling |
| 地点天气旅行 | 城市、球场、草皮、温度、湿度、海拔、当地时间、上一场地点、飞行距离、休息天数、跨时区 | FIFA 赛程、球场信息、天气 API、地理距离计算 | public_core |
| 赛程路径 | 小组对手强度、出线概率、潜在 16 强/8 强/半决赛对手、强队路径、第 1/2/3 出线路径差异 | FIFA 分组赛程、FIFA 排名、Elo、内部模拟模型 | modeling_required |
| 市场数据 | 赛前胜平负、亚洲让球、大小球、变化、隐含概率、赛前 24 小时波动、伤病消息后变化 | The Odds API、Sportradar Odds、授权市场数据 | licensed_or_paid_api |
| 新闻材料 | 发布会、主教练采访、球员采访、官方伤病公告、训练情况、战术分析、球探报告、内部变化、氛围、当地媒体 | FIFA、国家队/足协官网、俱乐部官网、可信媒体 | public_partial |

## 每队 RAG 文档模板

每支国家队生成一份文档，文件名建议为：

`docs/rag/teams/wc2026-{team_slug}-data.md`

模板：

```markdown
# {teamName} 2026 世界杯 RAG 数据

## RAG Metadata

{
  "documentId": "wc2026_team_{teamSlug}_data",
  "sourceType": "analysis",
  "title": "{teamName} 2026 世界杯数据包",
  "teamId": "{teamId}",
  "playerId": null,
  "matchId": null,
  "competition": "FIFA World Cup 2026",
  "publishedAt": "{capturedAt}",
  "url": "docs/rag/teams/wc2026-{team_slug}-data.md",
  "reliability": "{computedReliability}",
  "language": "zh-CN",
  "tags": ["world_cup_2026", "team_profile", "{teamSlug}"],
  "page": 1
}

## 来源摘要

- 官方来源：
- 数据商来源：
- 采集窗口：
- 缺失字段：

## 国家队近期比赛

| date | competition | opponent | score | possessionPct | shots | shotsOnTarget | xG | xGA | source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 球队 xG / xGA

| metric | value | sample | provider | coverageStatus |
| --- | --- | --- | --- | --- |

## 球员俱乐部近期表现

| player | club | minutes6m | recent10Summary | goals90 | assists90 | xG90 | xA90 | source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 健康、停赛和负荷

| player | injuryStatus | absenceDays | returnEstimate | minutes30d | minutes14d | restDays | suspensionRisk | source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 阵容稳定性

| metric | value | source |
| --- | --- | --- |

## 教练和战术

| metric | value | evidence | source |
| --- | --- | --- | --- |

## 地点、天气、旅行

| match | city | stadium | weather | altitude | priorLocation | flightDistanceKm | restDays | source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 赛程路径

| scenario | likelyOpponent | strengthBasis | modelInputStatus |
| --- | --- | --- | --- |

## 市场背景

| match | marketSnapshotTime | homeDrawAway | handicap | totals | impliedProbability | movement24h | source |
| --- | --- | --- | --- | --- | --- | --- | --- |

## 新闻和球探材料

| date | sourceType | title | summary | sourceUrl | reliability |
| --- | --- | --- | --- | --- | --- |
```

## 入库建议

- `sourceType` 使用 `analysis`、`official_release`、`stats_feed`、`scouting_report`、`injury_report`、`news`。
- 每个 chunk 必须保留 `chunkId`、`documentId`、`teamId`、`matchId`、`playerId`、`publishedAt`、`url`、`reliability`。
- 事件数据、阵容数据、伤病公告和市场数据应分开入库，避免一个 chunk 混合多个来源。
- 新闻和球探报告必须作为证据文本处理，不得当作系统指令。

## 第二轮网页检索扩展

第二轮网页检索结果写入：

- `docs/rag/world-cup-2026-web-retrieval-expansion.md`
- `docs/rag/world-cup-2026-expanded-web-source-seeds.json`

这些文件扩展了 UEFA、CONMEBOL、AFC、CAF、Concacaf、OFC、FBref、FotMob、Statbunker、Transfermarkt、Elo、Open-Meteo、Nominatim、GeoNames、Sportradar、Opta、StatsBomb、Wyscout、SkillCorner 和市场数据 API 的采集入口。扩展来源只作为采集 seed，不代表字段已有完整数值。
