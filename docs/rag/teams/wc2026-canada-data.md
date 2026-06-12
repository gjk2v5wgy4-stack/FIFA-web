# Canada 2026 World Cup RAG Data

## RAG Metadata

```json
{
  "documentId": "wc2026_team_canada_data_001",
  "sourceType": "analysis",
  "title": "Canada 2026 World Cup public data package",
  "teamId": "team_can",
  "matchId": "match_003",
  "competition": "2026 FIFA World Cup",
  "publishedAt": "2026-06-12T00:00:00+08:00",
  "url": "docs/rag/teams/wc2026-canada-data.md",
  "reliability": "medium_public_sources",
  "language": "zh-CN",
  "tags": ["world_cup_2026", "team_profile", "canada", "match_003", "public_data"]
}
```

## 球队历史表现数据

加拿大是 2026 世界杯联合东道主之一，近年来在 CONCACAF 竞争力持续提升。球队在 2022 世界杯重返正赛后积累了大赛经验，2026 周期的公开赛程和积分赛样本显示，加拿大整体风格更偏高强度压迫、快速推进和边路冲击。项目模型基线显示 Canada 的 Elo 为 1748，进攻 xG/90 为 1.36，防守 xGA/90 为 1.28，属于小组中具备主动权但仍需要控制转换风险的球队。

近十场公开结果可概括为防守稳定、平局比例偏高、运动战效率需要持续核验。公开报道曾指出加拿大近期运动战进球效率并不稳定，因此分析时不能只看主场和排名优势，还需要结合首发边路推进、禁区终结质量和定位球质量。该结论只用于概率预测、数据分析和风险因素说明，不构成确定性赛果判断。

## 球员多维数据

加拿大公开核心球员包括 Alphonso Davies、Jonathan David、Stephen Eustaquio、Cyle Larin、Tajon Buchanan、Ismael Kone、Moise Bombito 等。项目结构化球员表当前重点记录 Alphonso Davies、Jonathan David 和 Stephen Eustaquio：

- Alphonso Davies：左后卫/边路推进核心，具备高速带球、边路推进和回追覆盖能力。若赛前伤病状态或出场限制存在变化，应显著下调加拿大左路推进和防线回追权重。
- Jonathan David：前锋，负责禁区终结、反越位跑动和前场压迫触发。若加拿大中场推进受阻，David 的触球质量会直接影响 xG 转化。
- Stephen Eustaquio：中场，负责攻防转换、二点球保护和中路出球。面对波黑中路身体对抗时，其抗压出球和回防位置感是关键变量。
- Cyle Larin 与 Tajon Buchanan 可作为禁区支点和边路冲击补充，但最终使用方式应以官方首发和赛前发布会为准。

球员多维字段应展示出场可用性、预计分钟数、进攻影响、防守影响和可用性影响；若缺少授权体能数据，应显示 coverageStatus=requires_licensed_provider，而不是补造跑动距离或冲刺次数。

## 球队战术和阵型数据

加拿大常见分析输入包括高位压迫、边路快速推进、前场纵向冲刺和二点球压迫。面对波黑时，加拿大需要控制两类风险：

- 高位压迫后身后空间暴露，尤其在边后卫前插后被波黑长传和支点回做打穿。
- 阵地战缺少 Davies 或左路爆点时，进攻可能更依赖中路 David/Larin 的终结和定位球。

模型应提高主场熟悉度和节奏主动权权重，但同时保留“不确定性”：如果加拿大运动战效率偏低，比赛容易变成低比分胶着局。

## 比赛环境和外部因素

match_003 为 Canada vs Bosnia & Herzegovina。项目赛程把比赛地点标记为 Toronto，前端环境模块可使用 Toronto/BMO Field 周边天气、草皮、旅行距离、休息天数和时区适应作为环境变量。加拿大具备主场和旅行压力较低的环境优势；波黑跨洲旅行和时区适应成本更高。

环境因素只用于解释体能分配、压迫持续性和战术执行不确定性，不作为单独胜负结论。天气、湿度、风速和草皮状态应优先从 Open-Meteo、球场资料、FIFA Match Centre 或官方赛前信息读取。

## 外部来源和数据覆盖

推荐来源包括 FIFA Match Centre、Canada Soccer、CONCACAF、公开赛程、公开比赛报告、Open-Meteo、球场资料和授权数据商。高级事件数据、球员冲刺次数、高强度跑动、疲劳恢复和完整 xG 拆分若无授权来源，应标记为 coverageStatus=requires_licensed_provider。

来源 URL：

- FIFA Match Centre: https://www.fifa.com/
- Canada Soccer matches and results: https://canadasoccer.com/matches-results/
- Canada Soccer national team: https://canadasoccer.com/national-team/
- Guardian Canada World Cup coverage: https://www.theguardian.com/football/2026/jun/11/canada-world-cup-opening-game-jesse-marsch
- SI Canada injury update: https://www.si.com/soccer/jesse-marsch-alphonso-davies-injury-update-canada-world-cup-opener
- Open-Meteo: https://open-meteo.com/
