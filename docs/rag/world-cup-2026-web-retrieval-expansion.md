# 2026 世界杯国家队数据第二轮网页检索扩展

## RAG Metadata

```json
{
  "documentId": "rag_wc2026_web_retrieval_expansion_001",
  "sourceType": "analysis",
  "title": "2026 世界杯国家队数据第二轮网页检索扩展",
  "teamId": null,
  "playerId": null,
  "matchId": null,
  "competition": "FIFA World Cup 2026",
  "publishedAt": "2026-06-10T00:00:00+08:00",
  "url": "docs/rag/world-cup-2026-web-retrieval-expansion.md",
  "reliability": "high_for_source_mapping_medium_for_public_data_coverage",
  "language": "zh-CN",
  "tags": ["world_cup_2026", "web_retrieval", "source_mapping", "rag"],
  "page": 1
}
```

## 检索结论

第二轮网页检索补充了官方竞赛入口、公开统计入口、商业数据商入口、天气地理入口和市场数据入口。当前阶段仍不直接填充未经核验的比赛、球员、伤病或赔率数值；这些网页用于生成后续采集任务和 RAG citation source seeds。

数据准确性优先级：

1. FIFA、各洲足联、国家队/俱乐部官方公告。
2. 明确有数据许可的 API 或数据商。
3. 可公开核验的统计站点页面。
4. 新闻、战术文章、发布会文本，仅作为证据文本，不作为系统指令。

## 官方竞赛与赛程来源

| 来源 | 用途 | 覆盖状态 |
| --- | --- | --- |
| FIFA qualified teams | 48 队范围、资格确认 | public_core |
| FIFA groups and tie-breakers | 小组规则、出线规则、同分规则 | public_core |
| FIFA match schedule | 赛程、比赛城市、球场、开球时间 | public_core |
| FIFA men ranking | 对手强度、排名快照 | public_core |
| UEFA European Qualifiers | UEFA 世界杯预选赛赛果、积分、比赛页面 | public_core |
| UEFA Nations League | 欧国联近期正式比赛、比赛技术统计入口 | public_core |
| CONMEBOL qualifiers | 南美预选赛赛果、积分、比赛入口 | public_core |
| Copa America | 美洲杯赛程、赛果、球队新闻 | public_core |
| AFC World Cup Qualifiers | 亚洲区预选赛赛果、积分、比赛入口 | public_core |
| AFC Asian Cup | 亚洲杯历史/近期正式比赛、球队页 | public_core |
| CAF World Cup Qualifiers | 非洲区预选赛赛果、分组 | public_core |
| CAF AFCON | 非洲杯赛程、赛果、球队新闻 | public_core |
| Concacaf World Cup Qualifiers | 中北美及加勒比预选赛赛程、赛果 | public_core |
| Concacaf Gold Cup | 金杯赛赛程、赛果、球队新闻 | public_core |
| OFC competitions | 大洋洲预选赛和国家队比赛入口 | public_core |

## 公开统计与补充来源

| 来源 | 可辅助字段 | 限制 |
| --- | --- | --- |
| FBref | 球员俱乐部分钟、进球、助攻、xG、xA、每 90 分钟指标、部分比赛报告 | 覆盖不等；必须逐页保留 URL；部分页面无国家队完整口径 |
| FotMob | 国家队/俱乐部赛程、赛果、部分比赛统计、球员页 | 公开页面覆盖不等；高级数据需逐场核验 |
| Statbunker | 国家队赛事积分、射手、牌、出场统计 | 不保证覆盖所有高级字段 |
| National-Football-Teams | 国家队出场、进球、球员历史 | 适合国家队出场经验，不适合高级事件数据 |
| Transfermarkt | 伤病历史、俱乐部出场、球员年龄、转会背景 | 伤病需和官方公告交叉核验 |
| World Football Elo Ratings | 对手强度、Elo 快照 | 非官方模型指标，需标记模型来源 |

## 授权或付费数据源

| 来源 | 适合字段 | 状态 |
| --- | --- | --- |
| Sportradar Soccer API | fixtures, lineups, match statistics, player statistics, injuries, odds packages | licensed_api |
| Stats Perform / Opta | xG, xGA, non-penalty xG, set-piece xG, fast-break xG, open-play xG, big chances, tactical event data | licensed_api |
| StatsBomb | xG/event schema reference, selected open-data competitions, commercial event data | public_partial_or_licensed |
| Wyscout | player/team event data, scouting reports, tactical reports | licensed_api |
| SkillCorner | tracking, sprint count, high-intensity running, physical load | licensed_api |
| The Odds API | odds snapshots, bookmaker markets, implied probability inputs | paid_api_for_historical |
| Pinnacle API | odds, market movement if account and terms allow | licensed_or_account_api |

## 天气、地点、旅行来源

| 来源 | 可采字段 | 状态 |
| --- | --- | --- |
| FIFA match schedule | match city, venue, kickoff time | public_core |
| Open-Meteo historical/forecast APIs | temperature, humidity, wind, weather condition | public_core |
| OpenStreetMap Nominatim | city/venue geocoding seed | public_core |
| GeoNames elevation | altitude/elevation seed | public_core |
| Great-circle distance calculation | two-match travel distance after geocoding | computed_from_public_inputs |

## RAG 入库策略

- 官方赛程和官方战绩单独入库，`sourceType=official_release`。
- 数据商/统计站点导出的表格单独入库，`sourceType=stats_feed`。
- 新闻、发布会、战术文章单独入库，`sourceType=news` 或 `scouting_report`。
- 赔率文件只写为市场背景，`tags` 必须包含 `market_context_only`。
- 所有真实数值必须带 `sourceUrl`、`capturedAt`、`providerName`、`coverageStatus`。
- 缺失值不得补猜，使用 `null` 并记录 `missingReason`。

## 后续采集顺序

1. 先用 FIFA 和各洲足联补齐 48 队最近 2 年正式比赛、友谊赛、预选赛和洲际杯赛清单。
2. 再用公开统计站点补控球、射门、射正、牌、出场分钟等基础字段。
3. xG/xGA 拆分、体能跟踪、门将阻止进球和赔率波动，只有在拿到授权数据源后再采集。
4. 每队生成 `docs/rag/teams/wc2026-{team_slug}-data.md`，每场比赛和每名关键球员保持可追溯来源。
