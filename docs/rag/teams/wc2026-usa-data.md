# 美国 2026 世界杯 RAG 数据样本

## RAG Metadata

```json
{
  "documentId": "wc2026_team_usa_data_001",
  "sourceType": "analysis",
  "title": "美国 2026 世界杯公开数据样本",
  "teamId": "team_usa",
  "playerId": null,
  "matchId": null,
  "competition": "2026 FIFA 世界杯",
  "publishedAt": "2026-06-10T00:00:00+08:00",
  "url": "docs/rag/teams/wc2026-usa-data.md",
  "reliability": "中等：公开来源已交叉核验",
  "language": "zh-CN",
  "tags": ["world_cup_2026", "team_profile", "usa", "public_data", "美国"],
  "page": 1
}
```

## 来源边界

本文档是网页检索后的美国队 RAG 样本，不等同于完整授权数据集。已写入的数据来自美国足协 U.S. Soccer、ESPN、FBref、FotMob、公开统计页和中文公开报道可核验入口。xG 拆分、体能跟踪、门将阻止进球、赔率历史波动等字段仍需授权数据源。

## 基础信息

| 字段 | 值 | 来源 |
| --- | --- | --- |
| teamId | team_usa | 项目内部标识 |
| 国家队 | 美国男子国家队 | 美国足协 U.S. Soccer |
| 主教练 | 毛里西奥·波切蒂诺 | 美国足协阵容公告 |
| 2026 世界杯小组 | D 组 | 美国足协阵容公告 |
| 小组对手 | 巴拉圭、澳大利亚、土耳其 | 美国足协阵容公告 |
| 小组比赛地点 | 洛杉矶、西雅图、洛杉矶 | 美国足协阵容公告 |
| 备战基地 | 加利福尼亚州尔湾 | 美国足协训练营报道 |

## 最近 10 场公开赛果

| 日期 | 比赛 | 比分 | 类型 | 来源 |
| --- | --- | --- | --- | --- |
| 2026-06-06 | 美国 vs 德国 | 1-2 | 友谊赛 | 美国足协 / ESPN |
| 2026-05-31 | 美国 vs 塞内加尔 | 3-2 | 友谊赛 | 美国足协 / ESPN |
| 2026-03-31 | 美国 vs 葡萄牙 | 0-2 | 友谊赛 | 美国足协 / ESPN |
| 2026-03-28 | 美国 vs 比利时 | 2-5 | 友谊赛 | 美国足协 / ESPN |
| 2025-11-18 | 美国 vs 乌拉圭 | 5-1 | 友谊赛 | ESPN |
| 2025-11-15 | 美国 vs 巴拉圭 | 2-1 | 友谊赛 | ESPN |
| 2025-10-14 | 美国 vs 澳大利亚 | 2-1 | 友谊赛 | ESPN |
| 2025-10-10 | 美国 vs 厄瓜多尔 | 1-1 | 友谊赛 | ESPN |
| 2025-09-09 | 美国 vs 日本 | 2-0 | 友谊赛 | ESPN |
| 2025-09-06 | 美国 vs 韩国 | 0-2 | 友谊赛 | ESPN |

最近 10 场公开赛果汇总：5 胜、1 平、4 负，进 18 球、失 17 球。该汇总由上表比分计算得到，后续采集器应保留逐场来源 URL。

## 最近 4 场热身赛技术统计

| 对手 | 比分 | 美国射门 | 对手射门 | 美国射正 | 对手射正 | 美国角球 | 对手角球 | 来源 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 比利时 | 2-5 | 12 | 21 | 5 | 10 | 6 | 6 | 美国足协战报 |
| 葡萄牙 | 0-2 | 12 | 11 | 3 | 5 | 2 | 8 | 美国足协战报 |
| 塞内加尔 | 3-2 | 15 | 7 | 5 | 3 | 4 | 7 | 美国足协战报 |
| 德国 | 1-2 | 16 | 12 | 4 | 4 | 10 | 2 | 美国足协战报 |

四场汇总：美国射门 55 次、射正 17 次、角球 22 次；对手射门 51 次、射正 22 次、角球 23 次。公开战报能支持“进攻能持续制造射门，但防守端被高质量对手打穿次数偏多”的风险描述。

## 阵容与核心球员公开信息

| 字段 | 值 | 来源 |
| --- | --- | --- |
| 世界杯名单人数 | 26 | 美国足协阵容公告 |
| 2022 世界杯经验 | 13 人参加过 2022 世界杯 | 美国足协阵容公告 |
| 全名单国家队出场次数 | 505 | 美国足协阵容公告 |
| 平均国家队出场次数 | 35 | 美国足协阵容公告 |
| 俱乐部赛季进球补充 | 巴洛贡、佩皮、哈吉·赖特赛季合计 56 球 | 美国足协阵容公告 |
| 普利西奇国家队数据 | 86 次出场、33 球、20 助攻 | 美国足协阵容页 |

## 公开球员俱乐部数据采集入口

| 球员 | 推荐检索入口 | 可采字段 | 限制 |
| --- | --- | --- | --- |
| 克里斯蒂安·普利西奇 | FBref、FotMob、俱乐部官方 | 出场时间、进球、助攻、xG、xA、每 90 分钟指标 | 需逐页核验赛季和赛事范围 |
| 福拉林·巴洛贡 | FBref、FotMob、摩纳哥官方 | 出场时间、进球、xG、射门 | 需核验最近 6 个月窗口 |
| 里卡多·佩皮 | FBref、FotMob、PSV 官方 | 出场时间、进球、xG、替补使用情况 | 需核验伤病和出场窗口 |
| 哈吉·赖特 | FBref、FotMob、考文垂官方 | 出场时间、进球、助攻、xG | 需核验赛事口径 |
| 泰勒·亚当斯 | FBref、FotMob、伯恩茅斯官方 | 出场时间、首发、防守动作 | 健康和负荷需官方/俱乐部交叉核验 |
| 安东尼·罗宾逊 | FBref、FotMob、富勒姆官方 | 出场时间、助攻、推进传球 | 伤病状态需官方来源 |
| 塞尔吉尼奥·德斯特 | FBref、FotMob、PSV 官方 | 出场时间、首发、推进带球 | 伤病恢复和连续首发需官方来源 |

## 风险分析

- 进攻端：最近 4 场热身赛总射门 55 次，说明球队能通过边路推进和中前场个人能力制造机会。
- 防守端：最近 4 场热身赛失 11 球，对比利时和塞内加尔的比赛暴露转换防守、禁区保护和个人失误后的二次保护问题。
- 纪律端：2024 美洲杯对巴拿马的红牌改变比赛走势，该类风险应作为淘汰赛或高压比赛的情境变量。
- 赛程端：小组赛在洛杉矶、西雅图、洛杉矶，备战基地在尔湾，公开信息显示旅行压力相对可控。

## 往年世界杯对战补充

历史世界杯对战数据已单独写入：

- `docs/rag/historical/world-cup-historical-matchups.md`
- `docs/rag/historical/world-cup-historical-matchups-seeds.json`

美国队与 2026 小组对手的世界杯正赛直接交锋中，当前可核验样本是 1930 年美国 3-0 巴拉圭。澳大利亚和土耳其的历史交锋应先在 FIFA 档案中核验；若只找到友谊赛、联合会杯或全部赛事历史交锋，不得写入世界杯正赛历史交锋表。

## 需要授权数据源的字段

| 字段 | 状态 | 推荐来源 |
| --- | --- | --- |
| xG / xGA 全量逐场 | 需授权数据源 | Opta、StatsBomb、Sportradar |
| 非点球 xG、定位球 xG、反击 xG、开放战 xG | 需授权数据源 | Opta、StatsBomb |
| 被创造大机会、禁区触球、失误导致射门 | 需授权数据源 | Opta、StatsBomb、Wyscout |
| 冲刺次数、高强度跑动、恢复负荷 | 需授权数据源 | SkillCorner |
| 门将阻止进球能力 | 需授权数据源 | StatsBomb、Opta、FBref 部分公开数据 |
| 赛前 24 小时市场波动 | 历史数据需付费 API | The Odds API、Sportradar 赔率数据 |

## 来源 URL

- 美国足协 U.S. Soccer 球队页: https://www.ussoccer.com/teams/usmnt
- 美国足协 U.S. Soccer 阵容页: https://www.ussoccer.com/teams/usmnt/roster
- 美国足协 U.S. Soccer 2026 世界杯名单公告: https://ussoccer.com/stories/2026/05/usmnt/us-mens-national-team-head-coach-mauricio-pochettino-names-26-player-roster-for-fifa-world-cup-2026
- 美国足协 U.S. Soccer 德国战报: https://www.ussoccer.com/stories/2026/06/usmnt/match-recap-antonee-robinson-goal-highlights-vs-germany
- 美国足协 U.S. Soccer 塞内加尔战报: https://ussoccer.com/stories/2026/05/usmnt/match-recap-goals-highlights-vs-senegal
- 美国足协 U.S. Soccer 比利时战报: https://ussoccer.com/stories/2026/03/usmnt/match-recap-highlights-vs-belgium-march-atlanta-georgia
- ESPN 美国队赛果: https://www.espn.com/soccer/team/results/_/id/660/united-states
- FBref: https://fbref.com/
- FotMob: https://www.fotmob.com/
