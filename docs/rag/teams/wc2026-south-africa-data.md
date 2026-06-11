# South Africa 2026 World Cup RAG Data

## RAG Metadata

```json
{
  "documentId": "wc2026_team_south_africa_data_001",
  "sourceType": "analysis",
  "title": "South Africa 2026 World Cup public data package",
  "teamId": "team_rsa",
  "competition": "2026 FIFA World Cup",
  "publishedAt": "2026-06-11T00:00:00+08:00",
  "url": "docs/rag/teams/wc2026-south-africa-data.md",
  "reliability": "medium_public_sources",
  "language": "zh-CN"
}
```

## 球队历史表现数据

南非公开世界杯履历包括 1998、2002 和 2010 年参赛经历，2010 年作为主办国参赛。历史样本显示球队在身体对抗、转换速度和主客场适应性方面波动较大，因此模型应把近期正式比赛状态和阵容完整度放在历史标签之前。

## 球员多维数据

公开资料跟踪重点包括 Percy Tau 的前场创造力、Teboho Mokoena 的中场覆盖和 Ronwen Williams 的门将稳定性。赛前应核验国家队名单、伤停公告、俱乐部出场负荷和最近 10 场国家队比赛分钟数。

## 球队战术和阵型数据

南非分析模块应关注防守阵型紧凑度、反击第一脚质量、边路回防速度和定位球防守。面对控球型对手时，模型应加入被压迫时的出球失误风险；面对高位压迫时，应加入长传落点和二点争抢质量。

## 比赛环境和外部因素

与墨西哥比赛时，应记录墨西哥城海拔、旅行距离、时区适应、赛前休息天数和训练场地条件。环境因素只用于解释体能分配和战术执行不确定性，不作为单独胜负结论。

## 外部来源和数据覆盖

推荐来源包括 FIFA、南非足协、CAF、公开比赛报告、Open-Meteo、球场资料和授权数据商。高级事件、体能和伤病历史如无明确授权来源，应以缺失字段展示。
