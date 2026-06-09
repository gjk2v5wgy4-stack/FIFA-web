# Cross-Thread Collaboration Rules

## Purpose

This document defines how independent implementation threads collaborate without breaking shared contracts. The repository is contract-first: frontend, backend, RAG, prediction, access/token, and QA work should proceed in parallel only after the relevant contract document is stable.

Core references:

- [API contract](../api/api-contract.md)
- [Data model](../api/data-model.md)
- [Architecture overview](overview.md)
- [Acceptance criteria](../qa/acceptance-criteria.md)

## Required Rules

- Frontend thread can depend only on `docs/api/api-contract.md` for backend behavior.
- Backend thread must implement `docs/api/api-contract.md`.
- RAG thread must obey the `document_chunks.metadata` structure defined in `docs/api/data-model.md`.
- Prediction thread must output pure functions callable by the FastAPI API layer.
- Access/token thread must use `token_ledger` as the only internal token quota ledger and balance source.
- Admin/access thread must implement approval, rejection, suspension, reactivation, token grant, token adjustment, and token revocation as auditable actions.
- QA thread owns final verification across directories, docs, API behavior, data model coverage, and acceptance report output.

## Thread Ownership

| Thread | Primary ownership | May read | Must not own |
| --- | --- | --- | --- |
| Frontend | `apps/web`, frontend API clients, UI states | `docs/api/api-contract.md`, product docs | Backend route behavior, database schema, token balance authority |
| Backend | `apps/api`, route implementation, auth, usage logging | all docs | RAG internals, prediction model internals, UI behavior |
| RAG | `packages/rag-core`, ingestion, chunking, retrieval, reranking, citations | `docs/api/data-model.md`, `docs/api/api-contract.md` | auth, token ledger, frontend UI |
| Prediction | `packages/football-models`, pure model functions | football data sections in `docs/api/data-model.md` | database access, HTTP routes, token ledger logic |
| Access/token | account approval, admin actions, token ledger, usage metering | access model and data model docs | prediction logic, RAG retrieval logic |
| QA | `docs/qa`, acceptance scripts or reports | entire repository | product scope changes without review |

## Branching Guidance

Use a `codex/` branch prefix for implementation work. Suggested branches:

- `codex/frontend-dashboard`
- `codex/backend-api-contract`
- `codex/rag-core`
- `codex/football-models`
- `codex/access-token-quota`
- `codex/qa-acceptance`

Threads should not edit another thread's owned files unless the change is explicitly documented in the handoff.

## Contract Change Process

1. Propose the contract change in the relevant document.
2. Record which thread is blocked by the current contract.
3. Update `docs/api/api-contract.md` or `docs/api/data-model.md`.
4. Notify affected threads before implementation continues.
5. QA verifies that all dependent docs and implementation agree.

Contract changes must preserve backward compatibility unless the repository is still before first implementation release.

## Handoff Checklist

Each thread handoff must include:

- Branch name.
- Files changed.
- Contract sections used.
- Verification commands run.
- Known gaps.
- Whether account status, token usage, usage logging, or report generation behavior changed.

## QA Authority

QA is responsible for final validation and may reject a thread handoff when:

- API responses diverge from `docs/api/api-contract.md`.
- Data writes diverge from `docs/api/data-model.md`.
- RAG citations omit required chunk metadata.
- Prediction functions perform hidden I/O or depend on mutable global state.
- Token balance logic bypasses `token_ledger`.
- Admin access actions are not auditable.
- MVP exposes Stripe, checkout, subscriptions, public recharge, paid upgrade, gambling, betting, or guaranteed prediction wording.
- The final acceptance report is missing or incomplete.

## Archive Policy

Do not automatically archive this thread or project after document creation or implementation. The project remains open until a human reviewer explicitly accepts or asks for archival.
