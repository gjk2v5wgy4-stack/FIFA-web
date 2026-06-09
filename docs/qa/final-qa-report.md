# Final QA Report

Date: 2026-06-09

Branch: `feature/06-qa-integration`

Retest base before QA report update: `d797c28`

Final conclusion: `AUTO_QA_PASS_WITH_ENV_LIMITATION`

Merge-to-main recommendation: Ready for automatic main merge after accepting the Docker CLI environment limitation. This thread did not merge to `main`.

## Integrated Fix Branches

| Branch | Merge commit | Result |
| --- | --- | --- |
| `fix/qa-prediction-contract` | `a09b066` | Merged, prediction contract retest passed. |
| `fix/qa-devops-audit-review` | `8ab630f` | Merged, frontend audit retest passed. Docker remains environment-limited. |
| `fix/qa-frontend-route-coverage` | `d797c28` | Merged, route coverage and frontend build retest passed. |

## Module Status

| Module | Status | Notes |
| --- | --- | --- |
| Frontend | PASS | Required routes are covered: `/`, `/matches`, `/matches/[matchId]`, `/teams/[teamId]`, `/players/[playerId]`, `/simulator/group`, `/simulator/knockout`, `/reports`, `/access`, `/account`, `/admin`. Lint, typecheck, build, and tests passed. |
| Backend API | PASS | FastAPI lint, mypy, pytest, and smoke test passed. API contract tests now include prediction metering fields. |
| Admin Token Access | PASS | Tests cover approval, rejection/suspension blocking, admin role blocking, ledger writes, idempotent consumption, low balance warning, and insufficient token handling. |
| RAG | PASS | Unit tests, ingestion dry-run, and retrieval smoke test passed. RAG returns usage and sources/citations and does not directly deduct internal quota. |
| Prediction Engine | PASS | Match, what-if, and group outputs expose required confidence, risk factors, key drivers, and metering estimates. Package unittest passed. |
| DevOps | PASS_WITH_ENV_LIMITATION | Static DevOps lint/typecheck passed. `apps/web` npm audit reports 0 vulnerabilities. Docker config could not run because Docker CLI is unavailable in this environment. |

## Commands And Results

| Command | Result |
| --- | --- |
| `git branch --show-current` | PASS, `feature/06-qa-integration` |
| `git status --short` | PASS, clean before retest and report update |
| `git merge --no-ff fix/qa-prediction-contract` | PASS |
| `git merge --no-ff fix/qa-devops-audit-review` | PASS after resolving `docs/qa/final-qa-report.md` documentation conflict by keeping both fix summaries |
| `git merge --no-ff fix/qa-frontend-route-coverage` | PASS |
| `git diff --check` | PASS |
| `git grep -n "^<<<<<<<\|^=======$\|^>>>>>>>" -- .` | PASS, no conflict markers |
| nested `.git` scan | PASS, none found |
| `git submodule status` | PASS, no submodules |
| `uv run ruff check .` in `apps/api` | PASS |
| `uv run mypy app` in `apps/api` | PASS |
| `uv run pytest` in `apps/api` | PASS, 26 passed, 1 TestClient deprecation warning |
| `uv run python scripts/smoke_test.py` in `apps/api` | PASS |
| `uv run pytest` in `packages/football-models` | SKIPPED, package does not declare pytest executable |
| `python -m unittest discover -s tests` in `packages/football-models` | PASS, 7 tests passed |
| `npm run lint --if-present` | PASS |
| `npm run typecheck --if-present` | PASS |
| `npm run build --if-present` | PASS |
| `npm test --if-present` | PASS, 9 RAG tests passed |
| `npm run rag:dry-run --if-present` | PASS |
| `npm run rag:smoke --if-present` | PASS |
| `npm ci --workspaces=false` in `apps/web` | PASS, installed from `apps/web/package-lock.json`, 0 vulnerabilities |
| `npm run lint:web --if-present` | PASS |
| `npm run typecheck:web --if-present` | PASS |
| `npm run build:web --if-present` | PASS |
| `npm run test:web --if-present` | PASS, Vitest 4.1.8, 2 files and 17 tests passed |
| `npm run lint:devops --if-present` | PASS |
| `npm run typecheck:devops --if-present` | PASS |
| `npm run docker:config --if-present` | PASS_WITH_ENV_LIMITATION, Docker CLI unavailable |
| `npm audit --audit-level=moderate` at repository root | SKIPPED, root package has no lockfile |
| `npm audit --audit-level=moderate --workspaces=false` in `apps/web` | PASS, 0 vulnerabilities |

## Compliance Checks

Forbidden wording scan found matches only in governance documents, QA criteria, and lint scripts as prohibited examples or guardrails. No product UI copy was found using the prohibited Chinese phrases.

Payment residual scan found Stripe, checkout, subscription, billing webhook, and self-service recharge terms only in documents and scripts that explicitly prohibit those MVP features. No Stripe dependency, checkout API, payment implementation, or self-service recharge flow was found.

Secrets scan found placeholder or local-development examples and source-code identifiers only. No live API key, private key, Stripe key, webhook secret, or private token was found.

## Token Model

Token model status: PASS.

Evidence:

- Registration defaults to `pending_approval`.
- Pending users are blocked from metered RAG API.
- Approved users can call metered APIs when balance is sufficient.
- Rejected and suspended users are blocked by access-control tests.
- Insufficient balance returns `INSUFFICIENT_TOKENS`.
- Low balance returns `lowTokenWarning=true`.
- Token changes are recorded in `token_ledger`.
- API usage is recorded in `api_usage_logs`.
- Admin actions are recorded in `admin_action_logs`.
- Non-admin users receive `FORBIDDEN` on admin routes.
- Balance is calculated from ledger entries; no direct authoritative `token_balance` overwrite path was found.

## Final Risk

Only one remaining limitation exists:

- Docker CLI is unavailable in this environment, so `docker compose config` could not be validated here.

If Docker validation is mandatory before main merge, run `npm run docker:config --if-present` or `docker compose config` on a Docker-enabled host. Otherwise, the integrated MVP branch is ready for automatic main merge with environment limitation recorded.
