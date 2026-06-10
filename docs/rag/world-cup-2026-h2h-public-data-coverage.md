# 2026 世界杯一对一公开数据覆盖补充

## RAG Metadata

```json
{
  "documentId": "rag_wc2026_h2h_public_data_coverage_001",
  "sourceType": "analysis",
  "title": "2026世界杯一对一公开数据覆盖补充",
  "teamId": null,
  "playerId": null,
  "matchId": null,
  "competition": "2026 FIFA 世界杯",
  "publishedAt": "2026-06-10T00:00:00+08:00",
  "url": "docs/rag/world-cup-2026-h2h-public-data-coverage.md",
  "reliability": "中等：公开H2H摘要已检索；最近五场和未来五场仍需继续补齐",
  "language": "zh-CN",
  "tags": ["world_cup_2026", "head_to_head", "h2h", "一对一", "public_data"],
  "page": 1
}
```

## 处理结论

本地 RAG 已有美国队样本、美国队世界杯历史交锋样本、盘口市场背景和104场盘口覆盖状态；这些文件本轮不改动。仓库尚没有除美国队和墨西哥 vs 南非截图样本以外的全队一对一类目覆盖，因此新增本文件和同名 JSON，作为 RAG 检索数据库的补充文档。

本轮只补充可公开核验的首轮24场 H2H 摘要。最近五场、状态百分比、未来五场、历史最大胜利、平均积分和平均进球仍未形成全48队统一结构化覆盖，后续需要继续从 FIFA、ESPN、Sky Sports、365Scores、Flashscore、各足协官网和中文媒体入口补齐。

## 安全边界

- 本文档只用于球队历史交锋、赛前背景、检索引用和数据完整性分析。
- 不提供投注建议、追分建议、跟单、加仓、保证命中或收益承诺。
- 盘口和赔率类数据只能作为 `market_context_only` 市场背景；本文件为 `match_context_only`。

## 一对一类目状态

| 类目 | 当前状态 | 说明 |
| --- | --- | --- |
| 球队基础对比 | 部分已覆盖 | 分组、赛程可由央视、FIFA、ESPN、worldfootball等公开页面核验；球场字段还未全量结构化。 |
| 联赛排名或实况状态 | 未全队覆盖 | m510截图仅有墨西哥 vs 南非页面状态；其他队伍需接FIFA排名或统一状态模型。 |
| 最近五场比赛 | 未全队覆盖 | 墨西哥和南非已有截图样本；其他队伍需逐队采集。 |
| 过往对赛 | 本轮已补充首轮24场 | 采用worldfootball公开H2H摘要；0场次表示公开页面未列出两队成年国家队既往交锋。 |
| 历史最大胜利 | 未全队覆盖 | 公开H2H页面可作为入口，但本轮未逐场展开。 |
| 平均分与平均进球 | 未全队统一计算 | 可由逐场明细计算；为避免站点口径混用，本轮只记录源摘要。 |
| 未来五场比赛 | 未全队覆盖 | m510截图只露出首场部分未来赛程，需后续从FIFA/ESPN/各足协官网补齐。 |

## 首轮 24 场公开 H2H 摘要

| 场次 | 小组 | 对阵 | H2H场次 | 主队胜 | 平 | 客队胜 | 总比分 | 来源 |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| 1 | A组 | 墨西哥 vs 南非 | 4 | 2 | 1 | 1 | 10:5 | worldfootball |
| 2 | A组 | 韩国 vs 捷克 | 3 | 1 | 1 | 1 | 4:8 | worldfootball |
| 3 | B组 | 加拿大 vs 波黑 | 0 | 0 | 0 | 0 | 0:0 | worldfootball |
| 4 | D组 | 美国 vs 巴拉圭 | 9 | 6 | 2 | 1 | 12:4 | worldfootball |
| 5 | B组 | 卡塔尔 vs 瑞士 | 1 | 1 | 0 | 0 | 1:0 | worldfootball |
| 6 | C组 | 巴西 vs 摩洛哥 | 3 | 2 | 0 | 1 | 6:2 | worldfootball |
| 7 | C组 | 海地 vs 苏格兰 | 0 | 0 | 0 | 0 | 0:0 | worldfootball |
| 8 | D组 | 澳大利亚 vs 土耳其 | 2 | 0 | 0 | 2 | 1:4 | worldfootball |
| 9 | E组 | 德国 vs 库拉索 | 0 | 0 | 0 | 0 | 0:0 | worldfootball |
| 10 | F组 | 荷兰 vs 日本 | 3 | 2 | 1 | 0 | 6:2 | worldfootball |
| 11 | E组 | 科特迪瓦 vs 厄瓜多尔 | 0 | 0 | 0 | 0 | 0:0 | worldfootball |
| 12 | F组 | 瑞典 vs 突尼斯 | 4 | 2 | 1 | 1 | 3:2 | worldfootball |
| 13 | H组 | 西班牙 vs 佛得角 | 0 | 0 | 0 | 0 | 0:0 | worldfootball |
| 14 | G组 | 比利时 vs 埃及 | 4 | 1 | 0 | 3 | 4:7 | worldfootball |
| 15 | H组 | 沙特阿拉伯 vs 乌拉圭 | 3 | 1 | 1 | 1 | 4:4 | worldfootball |
| 16 | G组 | 伊朗 vs 新西兰 | 2 | 1 | 1 | 0 | 3:0 | worldfootball |
| 17 | I组 | 法国 vs 塞内加尔 | 1 | 0 | 0 | 1 | 0:1 | worldfootball |
| 18 | I组 | 伊拉克 vs 挪威 | 0 | 0 | 0 | 0 | 0:0 | worldfootball |
| 19 | J组 | 阿根廷 vs 阿尔及利亚 | 1 | 1 | 0 | 0 | 4:3 | worldfootball |
| 20 | J组 | 奥地利 vs 约旦 | 0 | 0 | 0 | 0 | 0:0 | worldfootball |
| 21 | K组 | 葡萄牙 vs 刚果民主共和国 | 0 | 0 | 0 | 0 | 0:0 | worldfootball |
| 22 | L组 | 英格兰 vs 克罗地亚 | 11 | 6 | 2 | 3 | 22:13 | worldfootball |
| 23 | L组 | 加纳 vs 巴拿马 | 0 | 0 | 0 | 0 | 0:0 | worldfootball |
| 24 | K组 | 乌兹别克斯坦 vs 哥伦比亚 | 0 | 0 | 0 | 0 | 0:0 | worldfootball |

## 墨西哥 vs 南非截图样本

m510 一对一截图补充的页面样本如下，口径与 worldfootball 全部交锋摘要不同，因此保留为“盘口页截图口径”：

| 队伍 | 最近五场 |
| --- | --- |
| 墨西哥 | 5:1胜塞尔维亚、1:0胜澳大利亚、2:0胜加拿大、1:1平比利时、0:0平葡萄牙 |
| 南非 | 1:1平牙买加、0:0平尼加拉瓜、1:2负巴拿马、1:1平巴哈马、1:2负喀麦隆 |

截图口径历史交锋：

| 日期 | 赛事 | 比分 |
| --- | --- | --- |
| 2010-06-11 | 世界杯小组赛A组 | 南非 1:1 墨西哥 |
| 2005-07-09 | 美洲金杯C组 | 南非 2:1 墨西哥 |

## 已补充和未完成

已补充：

- 首轮24场小组赛公开 H2H 摘要。
- 墨西哥 vs 南非的一对一截图样本，包含最近五场和截图口径历史交锋。
- 中文赛程/赛制核验入口：央视体育、懂球帝、新浪体育。

未完成：

- 全48队最近五场正式比赛和友谊赛。
- 全48队页面状态或统一状态评分。
- 全48队未来五场赛程。
- H2H逐场明细、历史最大胜利、平均积分、平均进球。
- 比赛城市、球场、天气、旅行距离与休息天数结构化字段。

## 来源

- worldfootball H2H 页面：见 `docs/rag/world-cup-2026-h2h-public-data-coverage.json` 每场 `来源URL`。
- 央视体育赛程分组：https://sports.cctv.com/2026/04/01/ARTIdkDLAd4VoNMm6ZfWrmxW260401.shtml
- 懂球帝赛制说明：https://m.dongqiudi.com/article/3323569.html
- 新浪体育赛程说明：https://sports.sina.cn/2026-06-09/detail-iniavshp1673339.d.html?vt=4
