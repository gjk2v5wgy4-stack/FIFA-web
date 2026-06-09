# USA 2026 世界杯 RAG 数据样本

## RAG Metadata

```json
{
  "documentId": "wc2026_team_usa_data_001",
  "sourceType": "analysis",
  "title": "USA 2026 世界杯公开数据样本",
  "teamId": "team_usa",
  "playerId": null,
  "matchId": null,
  "competition": "FIFA World Cup 2026",
  "publishedAt": "2026-06-10T00:00:00+08:00",
  "url": "docs/rag/teams/wc2026-usa-data.md",
  "reliability": "medium_public_sources_cross_checked",
  "language": "zh-CN",
  "tags": ["world_cup_2026", "team_profile", "usa", "public_data"],
  "page": 1
}
```

## 来源边界

本文档是网页检索后的美国队 RAG 样本，不等同于完整授权数据集。已写入的数据来自 U.S. Soccer、ESPN、FBref/FotMob/公开统计页和中文公开报道可核验入口。xG 拆分、体能跟踪、门将阻止进球、赔率历史波动等字段仍需授权数据源。

## 基础信息

| 字段 | 值 | 来源 |
| --- | --- | --- |
| teamId | team_usa | 项目内部标识 |
| 国家队 | USA / United States men's national team | U.S. Soccer |
| 主教练 | Mauricio Pochettino | U.S. Soccer 阵容公告 |
| 2026 世界杯小组 | D 组 | U.S. Soccer 阵容公告 |
| 小组对手 | Paraguay, Australia, Türkiye | U.S. Soccer 阵容公告 |
| 小组比赛地点 | Los Angeles, Seattle, Los Angeles | U.S. Soccer 阵容公告 |
| 备战 base camp | Irvine, California | U.S. Soccer camp report |

## 最近 10 场公开赛果

| 日期 | 比赛 | 比分 | 类型 | 来源 |
| --- | --- | --- | --- | --- |
| 2026-06-06 | USA vs Germany | 1-2 | 友谊赛 | U.S. Soccer / ESPN |
| 2026-05-31 | USA vs Senegal | 3-2 | 友谊赛 | U.S. Soccer / ESPN |
| 2026-03-31 | USA vs Portugal | 0-2 | 友谊赛 | U.S. Soccer / ESPN |
| 2026-03-28 | USA vs Belgium | 2-5 | 友谊赛 | U.S. Soccer / ESPN |
| 2025-11-18 | USA vs Uruguay | 5-1 | 友谊赛 | ESPN |
| 2025-11-15 | USA vs Paraguay | 2-1 | 友谊赛 | ESPN |
| 2025-10-14 | USA vs Australia | 2-1 | 友谊赛 | ESPN |
| 2025-10-10 | USA vs Ecuador | 1-1 | 友谊赛 | ESPN |
| 2025-09-09 | USA vs Japan | 2-0 | 友谊赛 | ESPN |
| 2025-09-06 | USA vs Korea Republic | 0-2 | 友谊赛 | ESPN |

最近 10 场公开赛果汇总：5 胜、1 平、4 负，进 18 球、失 17 球。该汇总由上表比分计算得到，后续采集器应保留逐场来源 URL。

## 最近 4 场热身赛技术统计

| 对手 | 比分 | USA 射门 | 对手射门 | USA 射正 | 对手射正 | USA 角球 | 对手角球 | 来源 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Belgium | 2-5 | 12 | 21 | 5 | 10 | 6 | 6 | U.S. Soccer match recap |
| Portugal | 0-2 | 12 | 11 | 3 | 5 | 2 | 8 | U.S. Soccer match recap |
| Senegal | 3-2 | 15 | 7 | 5 | 3 | 4 | 7 | U.S. Soccer match recap |
| Germany | 1-2 | 16 | 12 | 4 | 4 | 10 | 2 | U.S. Soccer match recap |

四场汇总：USA 射门 55 次、射正 17 次、角球 22 次；对手射门 51 次、射正 22 次、角球 23 次。公开战报能支持“进攻能持续制造射门，但防守端被高质量对手打穿次数偏多”的风险描述。

## 阵容与核心球员公开信息

| 字段 | 值 | 来源 |
| --- | --- | --- |
| 世界杯名单人数 | 26 | U.S. Soccer 阵容公告 |
| 2022 世界杯经验 | 13 人参加过 2022 世界杯 | U.S. Soccer 阵容公告 |
| 全名单国家队 caps | 505 | U.S. Soccer 阵容公告 |
| 平均 caps | 35 | U.S. Soccer 阵容公告 |
| 俱乐部赛季进球补充 | Balogun、Pepi、Haji Wright 赛季合计 56 球 | U.S. Soccer 阵容公告 |
| Pulisic 国家队数据 | 86 caps、33 goals、20 assists | U.S. Soccer roster page |

## 公开球员俱乐部数据采集入口

| 球员 | 推荐检索入口 | 可采字段 | 限制 |
| --- | --- | --- | --- |
| Christian Pulisic | FBref, FotMob, club official | minutes, goals, assists, xG, xA, per90 | 需逐页核验赛季和赛事范围 |
| Folarin Balogun | FBref, FotMob, Monaco official | minutes, goals, xG, shots | 需核验最近 6 个月窗口 |
| Ricardo Pepi | FBref, FotMob, PSV official | minutes, goals, xG, substitute usage | 需核验伤病和出场窗口 |
| Haji Wright | FBref, FotMob, Coventry official | minutes, goals, assists, xG | 需核验赛事口径 |
| Tyler Adams | FBref, FotMob, Bournemouth official | minutes, starts, defensive actions | 健康和负荷需官方/俱乐部交叉核验 |
| Antonee Robinson | FBref, FotMob, Fulham official | minutes, assists, progressive passes | 伤病状态需官方来源 |
| Sergiño Dest | FBref, FotMob, PSV official | minutes, starts, progressive carries | 伤病恢复和连续首发需官方来源 |

## 风险分析

- 进攻端：最近 4 场热身赛总射门 55 次，说明球队能通过边路推进和中前场个人能力制造机会。
- 防守端：最近 4 场热身赛失 11 球，对 Belgium 和 Senegal 的比赛暴露转换防守、禁区保护和个人失误后的二次保护问题。
- 纪律端：2024 Copa America 对 Panama 的红牌改变比赛走势，该类风险应作为淘汰赛或高压比赛的情境变量。
- 赛程端：小组赛在 Los Angeles、Seattle、Los Angeles，base camp 在 Irvine，公开信息显示旅行压力相对可控。

## 往年世界杯对战补充

历史世界杯对战数据已单独写入：

- `docs/rag/historical/world-cup-historical-matchups.md`
- `docs/rag/historical/world-cup-historical-matchups-seeds.json`

美国队与 2026 小组对手的世界杯正赛直接交锋中，当前可核验样本是 1930 年 USA 3-0 Paraguay。Australia 和 Türkiye 的历史交锋应先在 FIFA archive 中核验；若只找到友谊赛、联合会杯或全部赛事 head-to-head，不得写入 World Cup finals head-to-head 表。

## 需要授权数据源的字段

| 字段 | 状态 | 推荐来源 |
| --- | --- | --- |
| xG / xGA 全量逐场 | requires_licensed_provider | Opta, StatsBomb, Sportradar |
| 非点球 xG、定位球 xG、反击 xG、开放战 xG | requires_licensed_provider | Opta, StatsBomb |
| 被创造大机会、禁区触球、失误导致射门 | requires_licensed_provider | Opta, StatsBomb, Wyscout |
| 冲刺次数、高强度跑动、恢复负荷 | requires_licensed_provider | SkillCorner |
| 门将阻止进球能力 | requires_licensed_provider | StatsBomb, Opta, FBref partial |
| 赛前 24 小时市场波动 | paid_api_for_historical | The Odds API, Sportradar Odds |

## 来源 URL

- U.S. Soccer USMNT team page: https://www.ussoccer.com/teams/usmnt
- U.S. Soccer USMNT roster: https://www.ussoccer.com/teams/usmnt/roster
- U.S. Soccer 2026 World Cup roster announcement: https://ussoccer.com/stories/2026/05/usmnt/us-mens-national-team-head-coach-mauricio-pochettino-names-26-player-roster-for-fifa-world-cup-2026
- U.S. Soccer Germany recap: https://www.ussoccer.com/stories/2026/06/usmnt/match-recap-antonee-robinson-goal-highlights-vs-germany
- U.S. Soccer Senegal recap: https://ussoccer.com/stories/2026/05/usmnt/match-recap-goals-highlights-vs-senegal
- U.S. Soccer Belgium recap: https://ussoccer.com/stories/2026/03/usmnt/match-recap-highlights-vs-belgium-march-atlanta-georgia
- ESPN USA results: https://www.espn.com/soccer/team/results/_/id/660/united-states
- FBref: https://fbref.com/
- FotMob: https://www.fotmob.com/
