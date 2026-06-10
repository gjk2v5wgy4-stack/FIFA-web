# API Contract

## Purpose

This is the integration contract for `worldcup-ai-prediction`. Frontend and backend work must use this document as the source of truth.

The MVP uses admin approval and token quota. It does not implement Stripe, checkout, public recharge, subscriptions, or self-service paid plans.

## Common Rules

- Base path: `/api`
- Content type: `application/json`
- IDs are opaque strings.
- Timestamps use ISO 8601 UTC.
- Protected AI/RAG/prediction/report APIs require account status `approved`.
- Token balance is derived from `token_ledger`.
- Metered responses include `tokensCharged`, `remainingTokens`, and `lowBalance`.
- Provider usage logs record `prompt_tokens`, `completion_tokens`, `embedding_tokens`, `total_provider_tokens`, and `estimated_cost`.

## Error Shape

```json
{
  "error": {
    "code": "INSUFFICIENT_TOKENS",
    "message": "Not enough tokens for this action.",
    "details": {
      "requiredTokens": 1200,
      "availableTokens": 300
    },
    "requestId": "req_001"
  }
}
```

Common codes:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `ACCOUNT_PENDING_APPROVAL`
- `ACCOUNT_REJECTED`
- `ACCOUNT_SUSPENDED`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `INSUFFICIENT_TOKENS`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

## Auth And Account

### POST /api/auth/register

Request:

```json
{
  "email": "user@example.com",
  "password": "replace-with-secure-password",
  "displayName": "世界杯分析用户"
}
```

Response `201`:

```json
{
  "data": {
    "userId": "user_001",
    "email": "user@example.com",
    "displayName": "世界杯分析用户",
    "status": "pending_approval"
  }
}
```

### POST /api/auth/login

Request:

```json
{
  "email": "user@example.com",
  "password": "replace-with-secure-password"
}
```

Response `200`:

```json
{
  "data": {
    "accessToken": "session_token",
    "user": {
      "userId": "user_001",
      "email": "user@example.com",
      "displayName": "世界杯分析用户",
      "role": "user",
      "status": "approved"
    }
  }
}
```

### GET /api/account/status

Response `200`:

```json
{
  "data": {
    "userId": "user_001",
    "status": "approved",
    "canUseProtectedApis": true,
    "message": "Account approved.",
    "updatedAt": "2026-06-10T10:00:00Z"
  }
}
```

### GET /api/account/tokens

Response `200`:

```json
{
  "data": {
    "userId": "user_001",
    "balanceTokens": 78000,
    "totalConsumedTokens": 22000,
    "lowBalance": false,
    "lowBalanceThreshold": 10000,
    "contactAdminMessage": "账号余额不足，请联系管理员充值。",
    "ledger": [
      {
        "ledgerId": "tl_001",
        "amountTokens": -1200,
        "reason": "rag_query",
        "relatedEntityType": "rag_query",
        "relatedEntityId": "ragq_001",
        "createdAt": "2026-06-10T10:00:00Z"
      }
    ]
  }
}
```

## Football Data

### GET /api/matches

Query parameters: `stage`, `group`, `teamId`, `status`, `from`, `to`, `limit`, `cursor`.

Response `200`:

```json
{
  "data": [
    {
      "matchId": "match_001",
      "stage": "group",
      "group": "A",
      "status": "scheduled",
      "kickoffAt": "2026-06-12T20:00:00Z",
      "venue": {
        "venueId": "venue_001",
        "name": "MetLife Stadium",
        "city": "East Rutherford",
        "country": "USA"
      },
      "homeTeam": {
        "teamId": "team_usa",
        "name": "United States",
        "code": "USA"
      },
      "awayTeam": {
        "teamId": "team_wal",
        "name": "Wales",
        "code": "WAL"
      },
      "latestPrediction": {
        "predictionId": "pred_001",
        "homeWinProbability": 0.43,
        "drawProbability": 0.28,
        "awayWinProbability": 0.29
      }
    }
  ],
  "pagination": {
    "nextCursor": null,
    "hasMore": false
  }
}
```

### GET /api/matches/:matchId

Response `200`:

```json
{
  "data": {
    "matchId": "match_001",
    "stage": "group",
    "group": "A",
    "status": "scheduled",
    "kickoffAt": "2026-06-12T20:00:00Z",
    "homeTeam": {
      "teamId": "team_usa",
      "name": "United States",
      "elo": 1824,
      "recentForm": ["W", "D", "W", "L", "W"]
    },
    "awayTeam": {
      "teamId": "team_wal",
      "name": "Wales",
      "elo": 1762,
      "recentForm": ["D", "W", "L", "D", "W"]
    },
    "availability": {
      "injuries": [],
      "suspensions": []
    },
    "oddsContext": {
      "enabled": true,
      "note": "Odds are shown only as market context, not betting advice."
    }
  }
}
```

### GET /api/teams/:teamId

Response `200`:

```json
{
  "data": {
    "teamId": "team_usa",
    "name": "United States",
    "code": "USA",
    "confederation": "CONCACAF",
    "group": "A",
    "modelProfile": {
      "elo": 1824,
      "xgFor90": 1.72,
      "xgAgainst90": 1.08,
      "pathDifficulty": 0.61
    },
    "players": [
      {
        "playerId": "player_001",
        "name": "Example Player",
        "position": "FW",
        "availabilityStatus": "available"
      }
    ]
  }
}
```

### GET /api/players/:playerId

Response `200`:

```json
{
  "data": {
    "playerId": "player_001",
    "teamId": "team_usa",
    "name": "Example Player",
    "position": "FW",
    "availabilityStatus": "available",
    "modelImpact": {
      "availabilityImpact": 0.08,
      "attackContribution": 0.12,
      "defenseContribution": 0.02,
      "minutesProjection": 74
    }
  }
}
```

## Weather Forecast

### GET /api/weather/forecast

Query parameters:

- `region`: Optional region name, such as `beijing`, `shanghai`, or `new york`.
- `latitude`: Optional latitude. Must be provided with `longitude`.
- `longitude`: Optional longitude. Must be provided with `latitude`.
- `days`: Forecast horizon from 1 to 7 days. Default is 3.

At least one of `region` or `latitude`/`longitude` is required.

Response `200`:

```json
{
  "data": {
    "region": "Beijing",
    "latitude": 39.9042,
    "longitude": 116.4074,
    "timezone": "Asia/Shanghai",
    "current": {
      "observedAt": "2026-06-10T10:00:00Z",
      "temperatureC": 24,
      "apparentTemperatureC": 25,
      "humidityPct": 62,
      "windKph": 12,
      "weatherCode": 2,
      "condition": "Partly cloudy"
    },
    "daily": [
      {
        "date": "2026-06-10",
        "maxTemperatureC": 26,
        "minTemperatureC": 17,
        "precipitationProbabilityPct": 20,
        "weatherCode": 2,
        "condition": "Partly cloudy"
      }
    ],
    "source": "open-meteo",
    "updatedAt": "2026-06-10T10:00:00Z"
  }
}
```

## RAG

### POST /api/rag/query

`POST /api/rag/ask` is also supported as a backward-compatible alias.

Protected account access is required. This endpoint returns provider usage estimates for later
token metering, but this Thread 2 integration does not directly deduct tokens, write
`token_ledger`, or write `ai_usage_logs`.

Request:

```json
{
  "question": "What are the main risk factors for the United States in this match?",
  "matchId": "match_001",
  "teamId": "team_usa",
  "playerId": null,
  "topK": 8,
  "filters": {
    "sourceType": "scouting_report",
    "language": "zh-CN"
  },
  "model": "worldcup-rag-qdrant"
}
```

Legacy request fields `context` and `retrieval` are accepted for compatibility.

Response `200` with results:

```json
{
  "data": {
    "answer": "Based on retrieved sources, the main risk factors are transition defense and pressing stability.",
    "sources": [
      {
        "chunkId": "chunk_001",
        "documentId": "doc_001",
        "score": 0.91,
        "contentPreview": "United States transition defense and pressing stability report.",
        "metadata": {
          "sourceType": "scouting_report",
          "teamId": "team_usa",
          "matchId": "match_001",
          "language": "zh-CN"
        },
        "citation": {
          "title": "Team scouting report",
          "sourceType": "scouting_report",
          "sourceUrl": "https://source.example.com/report",
          "publishedAt": "2026-06-01T00:00:00Z",
          "language": "zh-CN"
        }
      }
    ],
    "retrievalDiagnostics": {
      "status": "ok",
      "resultCount": 1,
      "filtersApplied": {
        "sourceType": "scouting_report",
        "language": "zh-CN",
        "matchId": "match_001",
        "teamId": "team_usa"
      },
      "provider": "qdrant",
      "collection": "worldcup_documents"
    },
    "usage": {
      "provider": "estimated",
      "model": "worldcup-rag-qdrant",
      "promptTokens": 40,
      "completionTokens": 120,
      "embeddingTokens": 1536,
      "totalProviderTokens": 1696,
      "estimatedCost": 0.001696,
      "tokensDeducted": 0
    }
  }
}
```

Response `200` with no results:

```json
{
  "data": {
    "answer": null,
    "sources": [],
    "retrievalDiagnostics": {
      "status": "no_results",
      "resultCount": 0,
      "filtersApplied": {
        "teamId": "team_unknown"
      },
      "provider": "qdrant"
    },
    "usage": {
      "provider": "estimated",
      "tokensDeducted": 0
    }
  }
}
```

If Qdrant is unavailable, the API returns `503` with error code `RAG_RETRIEVAL_UNAVAILABLE`.
Requests asking for betting, chasing losses, copy trading, stake sizing, or guaranteed outcomes
return a safety-boundary answer instead of retrieval results.

### Deprecated legacy POST /api/rag/ask example

The legacy example below is retained for historical context only. The active response shape is
defined by `POST /api/rag/query` above, and RAG usage is not directly deducted in Thread 2.

Request:

```json
{
  "question": "这场比赛美国队的主要风险因素是什么？",
  "context": {
    "matchId": "match_001",
    "teamIds": ["team_usa", "team_wal"],
    "playerIds": [],
    "tournamentStage": "group"
  },
  "retrieval": {
    "topK": 8,
    "useReranking": true,
    "language": "zh-CN"
  }
}
```

Response `200`:

```json
{
  "data": {
    "ragQueryId": "ragq_001",
    "answer": "主要风险来自边路防守转换和关键前锋健康状态，模型依据见引用来源。",
    "confidence": 0.74,
    "citations": [
      {
        "documentId": "doc_001",
        "chunkId": "chunk_001",
        "sourceName": "Team scouting report",
        "sourceUrl": "https://source.example.com/report",
        "publishedAt": "2026-06-01T00:00:00Z",
        "metadata": {
          "source_type": "scouting_report",
          "source_name": "Team scouting report",
          "source_url": "https://source.example.com/report",
          "published_at": "2026-06-01T00:00:00Z",
          "team_ids": ["team_usa", "team_wal"],
          "player_ids": [],
          "match_ids": ["match_001"],
          "tournament_stage": "group",
          "language": "zh-CN",
          "chunk_index": 4,
          "checksum": "sha256:example"
        }
      }
    ],
    "usage": {
      "tokensCharged": 1200,
      "remainingTokens": 76800,
      "lowBalance": false,
      "providerUsage": {
        "prompt_tokens": 1200,
        "completion_tokens": 280,
        "embedding_tokens": 450,
        "total_provider_tokens": 1930,
        "estimated_cost": 0.0125
      }
    }
  }
}
```

RAG metering rule:

- The RAG service returns `usage.providerUsage`.
- The API metering layer converts `usage.providerUsage.totalProviderTokens` to internal token
  quota with a 2x multiplier for MVP:
  `internalTokensCharged = totalProviderTokens * 2`.
- Successful RAG calls write `token_ledger.reason = rag_query`.
- Successful RAG calls write `ai_usage_logs.usage_type = rag`.
- Retryable RAG requests must use `requestId` as the idempotency key so the same request is not
  charged twice.
- If the account is not approved or token balance is insufficient, the API returns the common
  error shape and does not write a RAG usage log.
- If the token balance is zero, AI/RAG interaction is stopped before the answer is generated and
  the API returns `账号余额不足，请联系管理员充值。`.

## Prediction And Simulation

### POST /api/predictions/match

Request:

```json
{
  "matchId": "match_001",
  "options": {
    "includeScoreDistribution": true,
    "includeExplanations": true,
    "persist": true
  }
}
```

Response `200`:

```json
{
  "data": {
    "predictionId": "pred_001",
    "matchId": "match_001",
    "modelVersion": "football-models-0.1.0",
    "prediction": {
      "homeWinProbability": 0.43,
      "drawProbability": 0.28,
      "awayWinProbability": 0.29,
      "expectedGoals": {
        "home": 1.42,
        "away": 1.16
      },
      "scorelineProbabilities": [
        {
          "score": "1-1",
          "probability": 0.12
        }
      ],
      "confidence": "medium",
      "riskFactors": [
        "Draw probability is material and raises scenario uncertainty."
      ],
      "keyDrivers": [
        "xG profile projects the home side at 1.42 and the away side at 1.16 expected goals.",
        "Elo and Poisson score probabilities are blended for a probability estimate."
      ]
    },
    "metering": {
      "featureType": "match_full_prediction",
      "complexity": "standard",
      "estimatedInternalTokens": 800
    },
    "usage": {
      "tokensCharged": 800,
      "remainingTokens": 76000,
      "lowBalance": false
    }
  }
}
```

### POST /api/predictions/what-if

Request:

```json
{
  "matchId": "match_001",
  "scenario": {
    "homeLineupChanges": [
      {
        "playerId": "player_001",
        "availabilityStatus": "out"
      }
    ],
    "awayLineupChanges": []
  }
}
```

Response `200`:

```json
{
  "data": {
    "scenarioId": "scenario_001",
    "baseline": {
      "homeWin": 0.43,
      "draw": 0.28,
      "awayWin": 0.29
    },
    "adjusted": {
      "homeWin": 0.36,
      "draw": 0.3,
      "awayWin": 0.34
    },
    "delta": {
      "homeWin": -0.07,
      "draw": 0.02,
      "awayWin": 0.05
    },
    "metering": {
      "featureType": "what_if_simulation",
      "complexity": "standard",
      "estimatedInternalTokens": 1000
    },
    "usage": {
      "tokensCharged": 1000,
      "remainingTokens": 75000,
      "lowBalance": false
    }
  }
}
```

### POST /api/simulations/group

Request:

```json
{
  "group": "A",
  "fixedResults": [
    {
      "matchId": "match_001",
      "homeGoals": 2,
      "awayGoals": 1
    }
  ],
  "options": {
    "iterations": 10000
  }
}
```

Response `200`:

```json
{
  "data": {
    "simulationId": "sim_group_A_001",
    "group": "A",
    "modelVersion": "football-models-0.1.0",
    "iterations": 10000,
    "table": [
      {
        "teamId": "team_usa",
        "projectedPoints": 6.4,
        "qualifyProbability": 0.78,
        "groupWinnerProbability": 0.42
      }
    ],
    "metering": {
      "featureType": "group_simulation",
      "complexity": "standard",
      "estimatedInternalTokens": 1500
    },
    "usage": {
      "tokensCharged": 1500,
      "remainingTokens": 73500,
      "lowBalance": false
    }
  }
}
```

## Reports

### POST /api/reports/generate

Request:

```json
{
  "reportType": "single_match",
  "context": {
    "matchId": "match_001",
    "teamIds": ["team_usa", "team_wal"]
  },
  "format": "pdf",
  "language": "zh-CN",
  "options": {
    "includeRagCitations": true,
    "includePredictionModelDetails": true
  }
}
```

Response `202`:

```json
{
  "data": {
    "reportId": "report_001",
    "status": "queued",
    "estimatedReadyAt": "2026-06-10T10:05:00Z",
    "usage": {
      "tokensCharged": 3000,
      "remainingTokens": 70500,
      "lowBalance": false
    }
  }
}
```

## Admin

Admin endpoints require `role=admin`.

### GET /api/admin/users

Response `200`:

```json
{
  "data": [
    {
      "userId": "user_001",
      "email": "user@example.com",
      "displayName": "世界杯分析用户",
      "status": "pending_approval",
      "tokenBalance": 0
    }
  ],
  "pagination": {
    "nextCursor": null,
    "hasMore": false
  }
}
```

### POST /api/admin/users/:userId/approve

Request:

```json
{
  "reason": "Approved for MVP access.",
  "initialTokenGrant": 100000
}
```

Response `200`:

```json
{
  "data": {
    "userId": "user_001",
    "status": "approved",
    "adminActionId": "admin_action_001",
    "tokenLedgerId": "tl_002",
    "tokenBalance": 100000
  }
}
```

### POST /api/admin/users/:userId/reject

Request:

```json
{
  "reason": "Access request rejected."
}
```

Response `200`:

```json
{
  "data": {
    "userId": "user_001",
    "status": "rejected",
    "adminActionId": "admin_action_002"
  }
}
```

### POST /api/admin/users/:userId/suspend

Request:

```json
{
  "reason": "Temporary access review."
}
```

Response `200`:

```json
{
  "data": {
    "userId": "user_001",
    "status": "suspended",
    "adminActionId": "admin_action_003"
  }
}
```

### POST /api/admin/users/:userId/reactivate

Request:

```json
{
  "reason": "Access restored."
}
```

Response `200`:

```json
{
  "data": {
    "userId": "user_001",
    "status": "approved",
    "adminActionId": "admin_action_004"
  }
}
```

### POST /api/admin/users/:userId/tokens/grant

Request:

```json
{
  "amountTokens": 50000,
  "reason": "Manual quota grant."
}
```

Response `200`:

```json
{
  "data": {
    "userId": "user_001",
    "adminActionId": "admin_action_005",
    "tokenLedgerId": "tl_003",
    "amountTokens": 50000,
    "tokenBalance": 150000
  }
}
```

### POST /api/admin/users/:userId/tokens/adjust

Request:

```json
{
  "amountTokens": -5000,
  "reason": "Manual correction."
}
```

Response `200`:

```json
{
  "data": {
    "userId": "user_001",
    "adminActionId": "admin_action_006",
    "tokenLedgerId": "tl_004",
    "amountTokens": -5000,
    "tokenBalance": 145000
  }
}
```

### POST /api/admin/users/:userId/tokens/revoke

Request:

```json
{
  "amountTokens": 10000,
  "reason": "Revoke unused quota."
}
```

Response `200`:

```json
{
  "data": {
    "userId": "user_001",
    "adminActionId": "admin_action_007",
    "tokenLedgerId": "tl_005",
    "amountTokens": -10000,
    "tokenBalance": 135000
  }
}
```
