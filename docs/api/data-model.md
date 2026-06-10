# Data Model

## Purpose

This document defines the PostgreSQL, Redis, and vector database model baseline for the MVP.

MVP access uses admin approval and `token_ledger`. It does not use Stripe, checkout, public recharge, subscriptions, or self-service paid plans.

## Storage Direction

| Storage | Use |
| --- | --- |
| PostgreSQL | Users, token ledger, football data, reports, predictions, document metadata |
| Redis | Sessions, rate limits, short-lived cache, job status cache |
| Chroma or Qdrant | RAG vector embeddings and similarity search |

## PostgreSQL Tables

### users

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `email` | text | Unique |
| `password_hash` | text | Hashed secret |
| `display_name` | text | User-facing name |
| `role` | text | `user`, `admin`, `analyst` |
| `status` | text | `pending_approval`, `approved`, `rejected`, `suspended` |
| `approved_at` | timestamptz | Nullable |
| `approved_by` | uuid/string | Nullable admin user ID |
| `status_reason` | text | Nullable |
| `created_at` | timestamptz | Required |
| `updated_at` | timestamptz | Required |

### admin_action_logs

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `admin_user_id` | uuid/string | Admin actor |
| `target_user_id` | uuid/string | Target user |
| `action` | text | `approve_user`, `reject_user`, `suspend_user`, `reactivate_user`, `grant_tokens`, `adjust_tokens`, `revoke_tokens` |
| `reason` | text | Required |
| `metadata` | jsonb | Request context |
| `created_at` | timestamptz | Required |

### token_ledger

`token_ledger` is the only authoritative source for internal token quota movement and balance.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `user_id` | uuid/string | Target user |
| `admin_user_id` | uuid/string | Nullable admin actor |
| `amount_tokens` | integer | Positive grant, negative usage/revocation |
| `reason` | text | `admin_initial_grant`, `admin_grant`, `admin_adjustment`, `admin_revoke`, `rag_query`, `match_prediction`, `what_if_prediction`, `group_simulation`, `report_generation` |
| `related_entity_type` | text | Entity type |
| `related_entity_id` | uuid/string | Entity ID |
| `idempotency_key` | text | Unique when present |
| `metadata` | jsonb | Audit metadata |
| `created_at` | timestamptz | Required |

Never overwrite a stored balance without a ledger entry. Balance is `sum(amount_tokens)` by `user_id`.

### ai_usage_logs

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `user_id` | uuid/string | User |
| `usage_type` | text | `rag`, `prediction`, `simulation`, `report` |
| `model` | text | Provider/model |
| `model_version` | text | Version |
| `prompt_tokens` | integer | Provider usage |
| `completion_tokens` | integer | Provider usage |
| `embedding_tokens` | integer | Provider usage |
| `total_provider_tokens` | integer | Provider usage |
| `estimated_cost` | numeric | Estimated provider cost |
| `internal_tokens_charged` | integer | Token quota deducted |
| `token_ledger_id` | uuid/string | Nullable ledger entry |
| `related_entity_type` | text | Entity type |
| `related_entity_id` | uuid/string | Entity ID |
| `created_at` | timestamptz | Required |

For RAG requests, `usage_type = rag`, `related_entity_type = rag_query`, and
`related_entity_id` points to the RAG query ID returned by the RAG service. The RAG service returns
provider usage; the API metering layer writes `ai_usage_logs` and `token_ledger`.

### teams

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `name` | text | Team name |
| `code` | text | FIFA-style code |
| `confederation` | text | Confederation |
| `coach_name` | text | Nullable |
| `group_code` | text | Nullable |
| `flag_url` | text | Nullable |
| `metadata` | jsonb | Extra profile |
| `created_at` | timestamptz | Required |
| `updated_at` | timestamptz | Required |

### players

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `team_id` | uuid/string | Team |
| `name` | text | Player name |
| `position` | text | `GK`, `DF`, `MF`, `FW` |
| `shirt_number` | integer | Nullable |
| `availability_status` | text | `available`, `doubtful`, `out`, `suspended`, `unknown` |
| `metadata` | jsonb | Extra profile |
| `created_at` | timestamptz | Required |
| `updated_at` | timestamptz | Required |

### fixtures

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `external_fixture_id` | text | Provider ID |
| `provider` | text | Data provider |
| `stage` | text | Tournament stage |
| `group_code` | text | Nullable |
| `scheduled_at` | timestamptz | Kickoff |
| `status` | text | Schedule status |
| `metadata` | jsonb | Source payload |

### matches

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `fixture_id` | uuid/string | Fixture |
| `home_team_id` | uuid/string | Team |
| `away_team_id` | uuid/string | Team |
| `venue_id` | uuid/string | Venue |
| `stage` | text | Tournament stage |
| `group_code` | text | Nullable |
| `status` | text | `scheduled`, `live`, `finished`, `postponed`, `cancelled` |
| `kickoff_at` | timestamptz | Kickoff |
| `home_score` | integer | Nullable |
| `away_score` | integer | Nullable |
| `metadata` | jsonb | Extra fields |

### venues

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `name` | text | Venue |
| `city` | text | City |
| `country` | text | Country |
| `capacity` | integer | Nullable |
| `timezone` | text | IANA timezone |
| `metadata` | jsonb | Extra fields |

### weather

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `match_id` | uuid/string | Match |
| `venue_id` | uuid/string | Venue |
| `provider` | text | Weather provider |
| `observed_at` | timestamptz | Forecast/observation time |
| `temperature_c` | numeric | Celsius |
| `humidity_pct` | integer | Humidity |
| `wind_kph` | numeric | Wind |
| `condition` | text | Weather condition |

### team_match_stats

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `match_id` | uuid/string | Match |
| `team_id` | uuid/string | Team |
| `xg` | numeric | Expected goals |
| `xga` | numeric | Expected goals against |
| `shots` | integer | Shots |
| `shots_on_target` | integer | Shots on target |
| `possession_pct` | numeric | Possession |
| `metadata` | jsonb | Provider payload |

### player_match_stats

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `match_id` | uuid/string | Match |
| `player_id` | uuid/string | Player |
| `team_id` | uuid/string | Team |
| `minutes` | integer | Minutes |
| `goals` | integer | Goals |
| `assists` | integer | Assists |
| `xg` | numeric | Expected goals |
| `xa` | numeric | Expected assists |
| `metadata` | jsonb | Provider payload |

### injuries

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `player_id` | uuid/string | Player |
| `team_id` | uuid/string | Team |
| `status` | text | `doubtful`, `out`, `recovering`, `available` |
| `description` | text | Injury text |
| `reported_at` | timestamptz | Report time |
| `expected_return_at` | timestamptz | Nullable |

### suspensions

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `player_id` | uuid/string | Player |
| `team_id` | uuid/string | Team |
| `match_id` | uuid/string | Nullable affected match |
| `reason` | text | Suspension reason |
| `starts_at` | timestamptz | Start |
| `ends_at` | timestamptz | End |
| `status` | text | `active`, `served`, `appealed` |

### rankings

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `team_id` | uuid/string | Team |
| `provider` | text | `fifa`, `elo`, or vendor |
| `rank` | integer | Rank |
| `points` | numeric | Points |
| `captured_at` | timestamptz | Snapshot |

### odds

Odds are stored only as market context or model features. The product must not generate betting recommendations.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `match_id` | uuid/string | Match |
| `provider` | text | Provider |
| `market` | text | Market type |
| `payload` | jsonb | Full payload |
| `captured_at` | timestamptz | Snapshot |

### documents

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `source_type` | text | `news`, `scouting_report`, `injury_report`, `stats_feed`, `official_release`, `analysis` |
| `source_name` | text | Source |
| `source_url` | text | URL |
| `title` | text | Title |
| `language` | text | Language |
| `published_at` | timestamptz | Source time |
| `ingested_at` | timestamptz | Ingestion time |
| `checksum` | text | Source checksum |
| `raw_content_uri` | text | Storage URI |
| `metadata` | jsonb | Extra source data |

### document_chunks

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `document_id` | uuid/string | Document |
| `chunk_index` | integer | Chunk order |
| `content` | text | Chunk text |
| `embedding_ref` | text | Vector DB ID/reference |
| `token_count` | integer | Token estimate |
| `metadata` | jsonb | Required citation metadata |

Required `metadata`:

```json
{
  "source_type": "scouting_report",
  "source_name": "Team scouting report",
  "source_url": "https://source.example.com/report",
  "published_at": "2026-06-01T00:00:00Z",
  "team_ids": ["team_usa"],
  "player_ids": ["player_001"],
  "match_ids": ["match_001"],
  "tournament_stage": "group",
  "language": "zh-CN",
  "chunk_index": 4,
  "checksum": "sha256:example"
}
```

### rag_queries

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `user_id` | uuid/string | User |
| `question` | text | User question |
| `answer` | text | Model answer |
| `context` | jsonb | Match/team/player context |
| `retrieval_config` | jsonb | RAG options |
| `citation_chunk_ids` | jsonb | Ordered chunk IDs |
| `confidence` | numeric | 0 to 1 |
| `ai_usage_log_id` | uuid/string | Usage log |
| `created_at` | timestamptz | Required |

### predictions

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `user_id` | uuid/string | Nullable for system predictions |
| `prediction_type` | text | `match`, `what_if`, `group_simulation`, `tournament_simulation` |
| `match_id` | uuid/string | Nullable |
| `team_ids` | jsonb | Teams |
| `input_snapshot` | jsonb | Model input |
| `result` | jsonb | Model output |
| `model_version` | text | Required |
| `ai_usage_log_id` | uuid/string | Nullable |
| `created_at` | timestamptz | Required |

### reports

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid/string | Primary key |
| `user_id` | uuid/string | User |
| `report_type` | text | `single_match`, `team`, `player`, `simulation` |
| `status` | text | `queued`, `generating`, `completed`, `failed` |
| `context` | jsonb | Report context |
| `format` | text | `pdf`, `html`, `json` |
| `language` | text | Output language |
| `output_uri` | text | Nullable |
| `citation_chunk_ids` | jsonb | Citation chunks |
| `prediction_ids` | jsonb | Prediction inputs |
| `model_versions` | jsonb | Model versions |
| `ai_usage_log_id` | uuid/string | Nullable |
| `error_message` | text | Nullable |
| `created_at` | timestamptz | Required |
| `updated_at` | timestamptz | Required |

## Redis Keys

| Pattern | Purpose |
| --- | --- |
| `session:{session_id}` | Auth session cache |
| `rate:{user_id}:{route}` | Rate limit counters |
| `job:report:{report_id}` | Report job status cache |
| `cache:match:{match_id}` | Short-lived match detail cache |

## Vector Database Collection

Collection name: `worldcup_document_chunks`

Each vector item must include:

- `chunk_id`
- `document_id`
- `embedding`
- `content_preview`
- `metadata` matching `document_chunks.metadata`

Chroma or Qdrant may be used. The chosen implementation must preserve citation metadata in search results.

## Integrity Rules

- Protected APIs require `users.status = approved`.
- Token balance is calculated from `token_ledger`.
- Admin token changes require `admin_action_logs`.
- RAG citations must reference `document_chunks`.
- Predictions must include `model_version`.
- Reports must record citations and prediction IDs when used.
- No schema should support Stripe, checkout, subscriptions, or public recharge in MVP.
