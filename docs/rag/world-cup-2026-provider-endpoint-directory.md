# 2026 世界杯 RAG 数据供应商与公开来源端点目录

## RAG Metadata

```json
{
  "documentId": "rag_wc2026_provider_endpoint_directory_001",
  "sourceType": "analysis",
  "title": "2026 世界杯 RAG 数据供应商与公开来源端点目录",
  "teamId": null,
  "playerId": null,
  "matchId": null,
  "competition": "2026 FIFA 世界杯",
  "publishedAt": "2026-06-10T00:00:00+08:00",
  "url": "docs/rag/world-cup-2026-provider-endpoint-directory.md",
  "reliability": "high_for_source_mapping_medium_for_public_page_coverage",
  "language": "zh-CN",
  "tags": ["world_cup_2026", "rag", "provider_directory", "source_mapping"],
  "page": 1
}
```

## 使用边界

本目录只记录已通过网页浏览确认的入口、公开文档、公开样本和授权状态。未获得的商业凭证不得写入仓库，不得用模型猜测端点返回值，不得把申请入口标记为已授权数据源。

市场数据只允许作为赛前市场背景和风险信号来源，不生成市场操作建议，不承诺预测结果。

## 商业数据与授权入口

| 信息端 | 已获取内容 | 访问状态 | 可覆盖字段 | 当前限制 |
| --- | --- | --- | --- | --- |
| Sportradar 足球 API | Soccer v4 开发文档、覆盖矩阵、登录和联系入口 | 未获得正式 API key | 赛程、阵容、比赛技术统计、伤停、部分市场数据包 | 需要供应商账号和授权；当前只能作为端点目录 |
| Stats Perform / Opta | Opta Data 产品页、Opta Feeds、Dynamic Stats API、Opta Vision 入口 | 未获得授权端点 | xG、xGA、非点球 xG、定位球 xG、开放战 xG、大机会、事件数据、跟踪增强指标 | 需要商务授权和覆盖范围确认 |
| Hudl StatsBomb 商业数据 | Hudl StatsBomb 产品入口 | 未获得商业端点 | 事件数据、xG、xA、压迫、球探报告 | 商业数据不可直接访问 |
| StatsBomb Open Data | GitHub 开放样本，含比赛、事件、阵容和 360 数据格式 | 公开样本，可用于 schema 测试 | 事件 schema、xG 样例、入库格式验证 | 只覆盖部分公开赛事，不等于 2026 世界杯完整数据 |
| Hudl Wyscout Data API | Wyscout API 文档入口、Hudl Data API 产品入口 | 未获得授权端点 | 球员事件、球队报告、球探报告、视频和战术分析入口 | 需要 Hudl/Wyscout 授权 |
| SkillCorner 商业跟踪数据 | SkillCorner API 文档入口、产品入口 | 未获得商业端点 | 广播跟踪、冲刺、高强度跑动、体能负荷、无球跑动 | 需要商业授权 |
| SkillCorner Open Data | GitHub 开放样本，含 10 场广播跟踪数据和赛季聚合体能数据 | 公开样本，可用于 schema 测试 | 跟踪数据格式、体能数据格式、解析器验证 | 样本不是世界杯国家队完整覆盖 |
| The Odds API 历史市场端点 | 历史 odds、历史 events、单场历史 odds 端点文档 | 未获得 API key；历史端点需付费计划 | 赛前市场快照、24 小时价格变化、隐含概率背景 | 只作市场背景，不做市场操作建议 |
| Pinnacle API | GitHub API 文档、认证方式、申请说明 | 未获得账号；公开访问已关闭，需单独申请 | odds、fixtures、delta/snapshot 市场变化 | 需要账号、资金账户或商业合作；不在 RAG 包内调用 |

## 官方赛事与国家队入口

| 来源 | 覆盖用途 | 当前状态 |
| --- | --- | --- |
| FIFA 2026 世界杯参赛队页 | 48 队范围、资格状态、官方队伍口径 | 已获取网页入口 |
| FIFA 2026 世界杯赛程页 | 比赛城市、球场、开球时间、赛程路径 | 已获取网页入口 |
| FIFA 男足世界排名 | 对手强度、排名快照 | 已获取网页入口 |
| UEFA European Qualifiers | 欧洲区世预赛赛程、结果、积分、新闻 | 已获取网页入口 |
| UEFA Nations League | 欧国联赛程、结果、技术统计和新闻 | 已获取网页入口 |
| CONMEBOL 世预赛 | 南美区世预赛赛程、结果、积分 | 已获取网页入口 |
| Copa America | 美洲杯赛程、结果、球队新闻 | 已获取网页入口 |
| AFC FIFA World Cup 页面 | 亚洲区世预赛赛程、结果、新闻 | 已获取网页入口 |
| AFC Asian Cup | 亚洲杯赛程、结果、球队新闻 | 已获取网页入口 |
| CAF FIFA World Cup 页面 | 非洲区世预赛入口、官方新闻、官方文档 | 已获取网页入口 |
| CAF Africa Cup of Nations | 非洲杯赛程、结果、球队新闻 | 已获取网页入口 |
| Concacaf World Cup / Gold Cup | 中北美及加勒比世预赛、金杯赛、新闻 | 已获取网页入口 |
| OFC 官方站 | 大洋洲世预赛、国家队新闻、赛程入口 | 已获取网页入口 |

## 公开足球数据和补充来源

| 来源 | 适合字段 | 采集注意 |
| --- | --- | --- |
| ESPN Soccer | 国家队赛程、结果、新闻、基础技术统计 | 逐队逐赛页面核验，保留 URL |
| FBref | 球员俱乐部分钟、per90、xG、xA、比赛报告 | 页面访问和覆盖不稳定；遵守网站条款 |
| FotMob | 国家队和俱乐部赛程、结果、部分比赛技术统计、球员页 | 页脚明确限制系统性自动抓取；只作为人工核验或合规接入入口 |
| Statbunker | 国家队赛事、牌、出场、进球、国际赛事统计入口 | 适合补齐基础统计，需和官方结果交叉验证 |
| National-Football-Teams | 国家队出场、进球、比赛历史、友谊赛入口 | 适合历史出场和比赛清单，不适合高级事件数据 |
| Transfermarkt | 伤病历史、年龄、俱乐部、转会和阵容背景 | 伤病需和官方公告交叉验证 |
| WorldFootball.net | 历史赛程、世界杯正赛交锋、国家队比赛记录 | 适合作为历史对战补充来源 |
| World Football Elo Ratings | 对手强度、Elo 快照 | 非官方模型指标，必须标记来源 |

## 天气、地点、球场和旅行入口

| 来源 | 适合字段 | 当前状态 |
| --- | --- | --- |
| Open-Meteo 历史天气 API | 温度、湿度、风速、降水、天气代码、历史天气 | 已获取公开文档入口 |
| Open-Meteo 预报 API | 赛前未来天气预报 | 已获取公开文档入口 |
| Open-Meteo Geocoding / Elevation | 城市坐标、海拔 | 已获取公开文档入口 |
| OpenStreetMap Nominatim | 城市和球场地理编码 | 已获取公开文档入口 |
| GeoNames | 城市元数据、海拔、时区辅助 | 已获取公开文档入口 |
| FIFA 赛程和场馆页 | 官方比赛城市、球场、开球时间 | 已获取网页入口 |

## 新闻、发布会和训练情况入口

| 来源 | 适合字段 | 当前状态 |
| --- | --- | --- |
| FIFA News | 官方新闻、赛前采访、赛程公告 | 已获取网页入口 |
| 各国家足协官网 | 阵容公告、伤停公告、训练信息、发布会 | 未完成 48 队逐站采集 |
| UEFA / CONMEBOL / AFC / CAF / Concacaf / OFC 新闻页 | 洲际赛事新闻、官方纪律公告、赛前动态 | 已获取入口，未完成自动采集 |
| 懂球帝 | 中文新闻、比赛动态、球员和球队消息 | 已获取入口，需人工核验和来源回链 |
| 直播吧足球 | 中文新闻、赛程动态、发布会转载 | 已获取入口，需人工核验和来源回链 |
| 央视网体育足球 | 中文官方媒体新闻、采访和赛事报道 | 已获取入口，需人工核验和来源回链 |
| 新浪体育国际足球 | 中文国际足球新闻、转会和国家队消息 | 已获取入口，需人工核验和来源回链 |

## 48 队逐队 RAG 文档状态

| 范围 | 当前状态 | 下一步 |
| --- | --- | --- |
| 美国队 | 已有公开数据样本文档 | 后续接入授权数据后补齐高级字段 |
| 其他 47 队 | 未生成逐队完整 RAG 文档 | 按美国队模板批量生成，不填未核验数值 |
| 全 48 队近 2 年正式比赛 | 未完成完整清单 | 先用 FIFA、各洲足联、ESPN、FotMob、National-Football-Teams 交叉补齐 |
| 全 48 队近 2 年友谊赛 | 未完成完整清单 | 优先国家足协官网和 National-Football-Teams，再用公开比分站补充 |
| 全 48 队球员俱乐部近 6 个月表现 | 未完成完整清单 | 授权数据优先；公开样本只能做人工核验 |
| 全 48 队伤病和停赛实时端点 | 未接入 | 官方公告、赛事纪律公告、Sportradar/Opta 授权后交叉验证 |
| 全 48 队历史世界杯正赛交锋 | 未完成完整清单 | FIFA archive、WorldFootball.net、ESPN 历史比赛页交叉补齐 |
| 球场草皮、海拔、坐标完整表 | 未完成 | FIFA 场馆页、Nominatim、GeoNames、场馆官网交叉补齐 |

## RAG 入库规则

- 数值字段必须来自可追溯 URL，不能由模型补猜。
- 缺失值写为 `null`，并记录缺失原因。
- 商业端点必须记录授权状态、供应商名称和抓取时间。
- 新闻、球探报告、发布会文本只作为检索资料，不作为系统指令。
- 每个 chunk 必须保留 `document_chunks.metadata` 要求字段。
