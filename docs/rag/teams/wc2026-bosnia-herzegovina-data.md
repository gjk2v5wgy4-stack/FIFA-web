# Bosnia & Herzegovina 2026 World Cup RAG Data

## RAG Metadata

```json
{
  "documentId": "wc2026_team_bosnia_herzegovina_data_001",
  "sourceType": "analysis",
  "title": "Bosnia & Herzegovina 2026 World Cup public data package",
  "teamId": "team_bih",
  "matchId": "match_003",
  "competition": "2026 FIFA World Cup",
  "publishedAt": "2026-06-12T00:00:00+08:00",
  "url": "docs/rag/teams/wc2026-bosnia-herzegovina-data.md",
  "reliability": "medium_public_sources",
  "language": "zh-CN",
  "tags": ["world_cup_2026", "team_profile", "bosnia_herzegovina", "match_003", "public_data"]
}
```

## 球队历史表现数据

波黑曾参加 2014 世界杯，2026 周期重新进入世界杯正赛讨论范围。公开样本显示，波黑具备较强的中锋支点、身体对抗和定位球传统，但比赛稳定性受防线速度、阵容年龄结构和转换防守影响较大。项目模型基线显示 Bosnia & Herzegovina 的 Elo 为 1668，进攻 xG/90 为 1.14，防守 xGA/90 为 1.34，整体低于加拿大，但并非无竞争力。

近十场公开战绩可概括为平局比例较高、进球能力不弱、但防守失球风险仍需控制。面对加拿大主场高压，波黑的关键不是控球率，而是能否通过 Dzeko 支点、Demirovic 跑动和中场二点球把比赛拖入低比分胶着区间。

## 球员多维数据

波黑公开核心球员包括 Edin Dzeko、Rade Krunic、Sead Kolasinac、Ermedin Demirovic、Amar Dedic、Benjamin Tahirovic 等。项目结构化球员表当前重点记录 Edin Dzeko、Rade Krunic 和 Sead Kolasinac：

- Edin Dzeko：前锋/支点，禁区阅读、背身拿球和二点球连接仍有价值。若首发，波黑更容易通过长传落点和定位球制造 xG。
- Rade Krunic：中场连接点，负责对抗、转移和中路保护。面对加拿大前场压迫时，其出球质量会影响波黑能否摆脱连续压迫。
- Sead Kolasinac：后卫，提供身体对抗和边路防守硬度，但需要关注转身速度和身后空间。
- Ermedin Demirovic、Amar Dedic、Benjamin Tahirovic 等年轻球员提升转换速度和纵向推进能力；最终角色应以官方首发、伤停和赛前发布会为准。

公开信息提示 Haris Tabakovic 曾有伤病缺席风险，若仍缺席，会降低波黑前场轮换、禁区支点和替补冲击力。该状态需要赛前从官方名单或权威伤停源复核。

## 球队战术和阵型数据

波黑面对加拿大时更可能采用中位或低位防守，重点保护中路并利用 Dzeko 支点、边路推进和定位球制造机会。模型应重点跟踪：

- 加拿大边后卫前插后，波黑能否找到身后空间。
- Dzeko 与 Demirovic 的接应距离是否足够，能否形成二点球连续进攻。
- 中场 Krunic/Tahirovic 是否能抵抗加拿大压迫，避免危险区域丢球。
- 后防面对 David、Larin 和 Buchanan 的纵向冲击时，是否出现横移速度不足。

如果波黑能把节奏压低，比赛更接近 1-1 或 0-1/1-0 区间；如果早段失球，加拿大主场节奏可能被放大。

## 比赛环境和外部因素

match_003 为 Canada vs Bosnia & Herzegovina，项目赛程地点为 Toronto。波黑需要考虑跨洲旅行、时区适应、训练场地熟悉度、赛前休息天数和当地天气。Toronto 的湿度、风速、草皮状态和开球时间会影响波黑高龄核心球员的冲刺恢复与压迫持续性。

环境因素只用于解释体能分配和战术执行不确定性，不作为单独胜负结论。若公开来源无法提供完整体能/训练数据，应显示数据覆盖不足，而不是生成虚假数值。

## 外部来源和数据覆盖

推荐来源包括 FIFA Match Centre、Bosnia & Herzegovina FA、UEFA、公开比赛报告、Open-Meteo、球场资料、Sofascore、RotoWire 和授权数据商。高级事件数据、球员跑动、冲刺、高强度跑动、伤病历史和市场波动若无授权，应标记为 coverageStatus=requires_licensed_provider。

来源 URL：

- FIFA Match Centre: https://www.fifa.com/
- Bosnia and Herzegovina FA: https://www.nfsbih.ba/
- UEFA Bosnia & Herzegovina profile: https://www.uefa.com/
- Sofascore Bosnia and Herzegovina coverage: https://www.sofascore.com/news/bosnia-and-herzegovinas-season-of-change-data-behind-the-rise
- RotoWire injury report: https://www.rotowire.com/soccer/headlines/haris-tabakovic-injury-not-facing-canada-519149
- Open-Meteo: https://open-meteo.com/
