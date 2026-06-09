# Codex Branch Plan

## Purpose

This document defines how Codex threads should split work across feature branches while staying inside one Git repository.

## Global Constraints

- Use the current repository only.
- Do not create new repositories.
- Do not create independent projects.
- Do not run `git init` in subdirectories.
- Do not use Git submodules.
- Do not auto-archive.
- Do not merge to `main` without human approval.

## Branch Responsibilities

### `feature/00-architecture-contracts`

Owns:

- `AGENTS.md`
- `docs/architecture/*`
- `docs/api/*`
- `docs/product/*`
- `docs/qa/acceptance-criteria.md`

Outputs:

- Architecture overview.
- Branch strategy.
- Codex branch plan.
- API contract.
- Data model.
- Product scope.
- Access token model.
- Acceptance criteria.

### `feature/01-frontend-ui`

Owns:

- `apps/web`
- Frontend API client generated or written from `docs/api/api-contract.md`
- Chinese-first UI copy
- Responsive and accessible UI states

Must not:

- Change backend behavior without updating the API contract first.
- Calculate authoritative token balance on the client.
- Add payment, checkout, betting, or guaranteed prediction UI.

### `feature/02-backend-api`

Owns:

- `apps/api`
- FastAPI route implementation
- Authentication and validation
- PostgreSQL persistence
- Redis cache integration

Must implement `docs/api/api-contract.md`.

### `feature/03-rag-vector-pipeline`

Owns:

- `packages/rag-core`
- Document ingestion
- Chunking
- Embedding
- Vector search
- Citation metadata

Must obey `document_chunks.metadata` in `docs/api/data-model.md`.

### `feature/04-prediction-engine`

Owns:

- `packages/football-models`
- Elo, xG/xGA, Poisson, Monte Carlo, What-if

Must expose pure functions callable from FastAPI.

### `feature/05-admin-token-access`

Owns:

- Account status workflow
- Admin approval actions
- `token_ledger`
- Usage metering
- Low-token state

Must not implement Stripe, checkout, public recharge, subscriptions, or self-service paid plans in MVP.

### `feature/06-qa-integration`

Owns:

- Contract checks
- Integration tests
- Acceptance reports
- Cross-branch verification

Must verify that protected APIs require `approved` status and token balance.

### `feature/07-devops-deployment`

Owns:

- `infra`
- Docker configuration
- `.env.example`
- PostgreSQL, Redis, Chroma/Qdrant service setup

Must not store secrets in the repo.

## Codex Thread Checklist

Before work:

1. Confirm repository root contains `.git`.
2. Confirm branch name.
3. Confirm assigned files.
4. Do not create a new repository.

During work:

1. Modify only assigned files.
2. Keep API/data model changes in `feature/00-architecture-contracts` unless explicitly approved.
3. Run relevant checks.

Final response:

1. Summary.
2. Branch name.
3. Files changed.
4. Commands run.
5. Test results.
6. Known issues.
7. Merge readiness.
8. Manual verification steps.
9. `等待人工验收，未归档`
