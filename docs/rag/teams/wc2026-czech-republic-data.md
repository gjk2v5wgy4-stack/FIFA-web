# Czech Republic 2026 World Cup RAG Data

## RAG Metadata

```json
{
  "documentId": "wc2026_team_czech_republic_data_001",
  "sourceType": "analysis",
  "title": "Czech Republic 2026 World Cup public data package",
  "teamId": "team_cze",
  "competition": "2026 FIFA World Cup",
  "publishedAt": "2026-06-11T00:00:00+08:00",
  "url": "docs/rag/teams/wc2026-czech-republic-data.md",
  "reliability": "medium_public_sources",
  "language": "zh-CN"
}
```

## 球队历史表现数据

捷克共和国现代世界杯公开样本包括 2006 年参赛；历史语境中也常引用捷克斯洛伐克时期 1934 和 1962 年世界杯亚军记录。模型展示时应区分现代捷克队与历史继承语境，避免把历史荣誉直接等同于当前实力。

## 球员多维数据

公开跟踪重点包括 Patrik Schick 的禁区终结、Tomas Soucek 的空中对抗和中场覆盖、Adam Hlozek 的前场衔接。最终名单、伤停和停赛应以捷克足协、FIFA 阵容页和俱乐部公告为准。

## 球队战术和阵型数据

捷克模型输入应关注高点争抢、定位球、二点球、边路传中和中场身体对抗。面对韩国的高强度转换时，应记录回防速度、边后卫身后空间和中卫横移风险。

## 比赛环境和外部因素

Zapopan 比赛环境应记录温度、湿度、风速、草皮、旅途距离和休息天数。若赛前天气较热或湿度较高，应把节奏下降和换人窗口作为不确定性解释。

## 外部来源和数据覆盖

推荐来源包括 FIFA、捷克足协、UEFA、FIFA Match Centre、Open-Meteo、球场资料和授权数据商。高级事件数据和体能数据若无授权，应只显示 coverageStatus，不生成虚假数值。
