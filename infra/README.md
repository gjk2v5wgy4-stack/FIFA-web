# DevOps Local Scaffolding

This folder owns local infrastructure for `worldcup-ai-prediction`.

## Services

| Service | Container | Host port | Purpose |
| --- | --- | ---: | --- |
| web | `worldcup-web` | `3000` | Next.js placeholder target until `apps/web` is implemented |
| api | `worldcup-api` | `8000` | FastAPI placeholder target until `apps/api` is implemented |
| postgres | `worldcup-postgres` | `5432` | MVP relational data and token ledger |
| redis | `worldcup-redis` | `6379` | sessions, rate limits, cache, jobs |
| qdrant | `worldcup-qdrant` | `6333`, `6334` | RAG vector collection |

## Local Commands

```powershell
npm run dev:up
npm run dev:health
npm run dev:init
npm run dev:down
```

The scripts use `.env` when present and fall back to `.env.example`.
Do not store real secrets in `.env.example`.

## Initialization

- PostgreSQL schema is mounted from `infra/postgres/initdb`.
- Qdrant collection setup uses `infra/qdrant/init-collection.json`.
- `infra/scripts/dev-init.ps1` can re-apply idempotent initialization to running containers.

## CI/CD Stub

`infra/scripts/ci-deploy-stub.ps1` is an automation placeholder. It validates the intended entry point without performing deployment.

