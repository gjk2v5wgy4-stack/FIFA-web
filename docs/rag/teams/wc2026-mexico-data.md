# Mexico 2026 World Cup RAG Data

## RAG Metadata

```json
{
  "documentId": "wc2026_team_mexico_data_001",
  "sourceType": "analysis",
  "title": "Mexico 2026 World Cup public data package",
  "teamId": "team_mex",
  "competition": "2026 FIFA World Cup",
  "publishedAt": "2026-06-11T00:00:00+08:00",
  "url": "docs/rag/teams/wc2026-mexico-data.md",
  "reliability": "medium_public_sources",
  "language": "zh-CN"
}
```

## 球队历史表现数据

墨西哥是世界杯长期参赛队，也是 1970、1986 和 2026 世界杯主办国之一。公开历史资料显示，墨西哥在本土举办的 1970 和 1986 世界杯均进入八强，近届赛事长期具备小组出线竞争力。该结论用于历史稳定性和主场环境建模，不构成确定性赛果判断。

## 球员多维数据

公开名单和俱乐部表现跟踪应重点关注 Santiago Gimenez 的终结效率、Edson Alvarez 的中场防守覆盖、Luis Chavez 的定位球与推进能力。若赛前最终名单、伤停或停赛公告更新，应以墨西哥足协、FIFA Match Centre 和球队发布会为准。

## 球队战术和阵型数据

墨西哥常见模型输入包括边路推进、前场压迫、中场拦截和定位球二点保护。对手若采用低位防守，模型应提高控球转化效率和禁区触球质量权重；若对手反击速度高，应提高防线身后空间风险权重。

## 比赛环境和外部因素

墨西哥城比赛环境需要记录高海拔、气温、湿度、草皮状态、旅途距离和休息天数。主场熟悉度可以作为适应性变量，但不能替代球队真实状态、阵容健康和对手强度。

## 外部来源和数据覆盖

推荐来源包括 FIFA 官方球队页面、墨西哥足协公告、FIFA Match Centre、公开赛程、Open-Meteo 天气、球场资料和授权数据商。xG、跑动、冲刺和高级事件数据若无授权来源，应标记为 coverageStatus=requires_licensed_provider。
