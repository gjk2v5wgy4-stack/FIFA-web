# 2026 世界杯市场背景数据覆盖说明

## 数据范围

- 预期总场次：104 场。
- 当前 m522 赛事页实抓盘口：72 场。
- 补充占位：32 场淘汰赛。
- 覆盖文件：
  - `docs/rag/world-cup-2026-market-context-coverage-104.json`
  - `docs/rag/world-cup-2026-market-context-coverage-104.csv`

## 关键结论

m522 当前 2026 世界杯赛事页底部停在 `06月27日 22:00 约旦 vs 阿根廷` 后进入页脚，没有显示 `06月28日` 及之后的淘汰赛盘口。

因此，本批数据采用以下规则：

- 第 1-72 场：保留当前页面可见盘口。
- 第 73-104 场：补充淘汰赛赛程路径占位。
- 第 73-104 场所有盘口字段均为 `null`，不可视为真实盘口。
- 占位记录仅用于标记缺失范围，等待盘口源开放淘汰赛市场后重新抓取替换。

## 安全边界

本数据仅作市场背景和 RAG 检索上下文，不得用于：

- 投注建议。
- 追分建议。
- 跟单或加仓建议。
- 保证命中或收益承诺。

## 缺失范围

- 第 73-88 场：32 强淘汰赛。
- 第 89-96 场：16 强淘汰赛。
- 第 97-100 场：四分之一决赛。
- 第 101-102 场：半决赛。
- 第 103 场：季军赛。
- 第 104 场：决赛。

## 参考来源

- FIFA 2026 官方赛程页面：https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026
- FIFA 赛程说明页面：https://www.fifa.com/en/articles/match-schedule-fixtures-results-teams-stadiums
- Sky Sports 2026 World Cup fixtures list：https://www.skysports.com/football/news/12098/13398676/world-cup-2026-fixtures-group-stage-and-knockout-schedule-dates-venues-and-kick-off-times
