# Qdrant 向量数据库集成说明

## RAG Metadata

```json
{
  "documentId": "rag_qdrant_vector_db_integration_001",
  "sourceType": "analysis",
  "title": "Qdrant 向量数据库集成说明",
  "teamId": null,
  "playerId": null,
  "matchId": null,
  "competition": "2026 FIFA 世界杯",
  "publishedAt": "2026-06-10T00:00:00+08:00",
  "url": "docs/rag/qdrant-vector-db-integration.md",
  "reliability": "high_for_engineering_integration",
  "language": "zh-CN",
  "tags": ["rag", "qdrant", "vector_store", "integration"],
  "page": 1
}
```

## 集成范围

本轮新增真实 Qdrant adapter，底层使用官方 Python SDK `qdrant-client`。现有 JS `QdrantVectorStoreAdapter` 通过 `scripts/rag/qdrant_adapter_cli.py` 调用 Python SDK，因此可以继续被 `retrieveContext()`、`askWithRag()` 和 citation 构建逻辑使用。

默认 smoke test 使用 Qdrant 本地内存模式 `:memory:`，不会写入生产数据库或真实向量库。连接真实 Qdrant 时，需要显式使用 `--use-env` 并提供环境变量。

## Collection

- 名称：`worldcup_documents`
- 向量距离：Cosine
- 默认维度：`VECTOR_DIM`，示例为 `1536`

Payload 结构：

| 字段 | 说明 |
| --- | --- |
| `document_id` | 文档 ID |
| `chunk_id` | chunk ID |
| `text` | chunk 文本 |
| `metadata.team_id` | 球队 ID |
| `metadata.player_id` | 球员 ID |
| `metadata.match_id` | 比赛 ID |
| `metadata.source_type` | tactical_report / injury_news / press_conference / scouting_report / historical_analysis / official_notice |
| `metadata.published_at` | 来源发布时间 |
| `metadata.source_url` | 来源 URL |
| `metadata.retrieved_at` | 入库/检索时间 |
| `metadata.language` | 语言 |
| `metadata.tags` | 标签 |

## 环境变量

```powershell
$env:QDRANT_HOST="localhost"
$env:QDRANT_PORT="6333"
$env:QDRANT_API_KEY=""
$env:VECTOR_DIM="1536"
$env:QDRANT_COLLECTION="worldcup_documents"
```

## Docker

```powershell
npm run docker:up
npm run docker:down
```

## Smoke Test

默认内存 dry-run：

```powershell
npm run rag:qdrant-smoke
```

连接本地 Docker Qdrant：

```powershell
python scripts/rag/integration_smoke_test.py --use-env --vector-dim 4
```

## 安全边界

- Adapter 只负责向量写入、检索、删除和读取。
- 不处理用户审批。
- 不扣 token。
- 不写 `token_ledger`。
- 不写 `ai_usage_logs`。
- 不提供投注、追分、跟单或保证结果建议。
