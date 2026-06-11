# Wales 2026 World Cup RAG Data

## RAG Metadata

```json
{
  "documentId": "wc2026_team_wales_data_001",
  "sourceType": "analysis",
  "title": "Wales 2026 World Cup public data package",
  "teamId": "team_wal",
  "competition": "2026 FIFA World Cup",
  "publishedAt": "2026-06-11T00:00:00+08:00",
  "url": "docs/rag/teams/wc2026-wales-data.md",
  "reliability": "medium_public_sources",
  "language": "zh-CN"
}
```

## 球队历史表现数据

威尔士公开世界杯样本包括 1958 年进入八强和 2022 年重返世界杯正赛。历史样本数量较少，因此模型应更多依赖近期正式比赛、阵容健康、对手强度和比赛环境。

## 球员多维数据

公开跟踪重点包括 Brennan Johnson 的速度和纵深冲击、Harry Wilson 的定位球与传球、Ben Davies 的防守稳定性。球员可用性应以威尔士足协、俱乐部公告和 FIFA 阵容页为准。

## 球队战术和阵型数据

威尔士常见分析变量包括低位防守紧凑度、反击推进、边路传中、定位球和门将保护。面对高控球对手时，应重点记录防线压力和反击第一脚质量。

## 比赛环境和外部因素

北美赛程下应记录旅行距离、休息天数、时区适应、当地天气和草皮。环境因素只解释执行质量和体能风险，不输出确定性判断。

## 外部来源和数据覆盖

推荐来源包括 FIFA、威尔士足协、UEFA、公开比赛报告、Open-Meteo 和授权数据商。缺少授权的 xG、冲刺和体能数据应标记为缺失。
