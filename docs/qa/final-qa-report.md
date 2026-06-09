# Final QA Report

Date: 2026-06-09

Branch: `feature/06-qa-integration`

QA base commit before reports: `3f6303c`

Final conclusion: `AUTO_QA_FAIL`

Merge-to-main recommendation: Do not merge to `main` yet.

## Merged Branches

- `feature/01-frontend-ui`
- `feature/02-backend-api`
- `feature/03-rag-vector-pipeline`
- `feature/04-prediction-engine`
- `feature/05-admin-token-access`
- `feature/07-devops-deployment`

## Module Status

| Module | Status | Notes |
| --- | --- | --- |
| Frontend | FAIL | Build passes, but required route coverage is incomplete. Current route model only covers home/login/register/prediction/admin, not the full required page set. |
| Backend API | PASS | FastAPI routes, tests, typecheck, lint, and smoke test pass. |
| Admin Token Access | PASS | Tests cover approval, rejection/suspension blocking, admin role blocking, ledger writes, idempotent consumption, low balance warning, and insufficient token handling. |
| RAG | PASS | Unit tests and smoke test pass. RAG returns usage and sources/citations and does not directly deduct internal quota. |
| Prediction Engine | FAIL_PENDING_T6_RETEST | Fix branch `fix/qa-prediction-contract` now exposes `confidence`, `riskFactors`, `keyDrivers`, and `metering` estimates in prediction outputs. Final PASS remains pending T6 automatic QA. |
| DevOps | PASS_WITH_ENV_LIMITATION | Static DevOps lint/typecheck pass. Docker config could not run because Docker CLI is unavailable in this environment. Frontend npm audit follow-up was resolved on `fix/qa-devops-audit-review`. |

## Commands And Results

| Command | Result |
| --- | --- |
| `git branch --show-current` | PASS, `feature/06-qa-integration` |
| `git status` | PASS, clean before report generation |
| `git log --oneline -10` | PASS |
| `git diff --check` | PASS |
| `git branch --contains HEAD` | PASS |
| `git worktree list --porcelain` | PASS |
| `git submodule status` | PASS, no submodules |
| `git branch --merged HEAD` | PASS, all required feature branches are merged |
| `Get-ChildItem -Recurse -Force -Directory -Filter ".git"` | PASS, no nested `.git` directories found |
| `git grep -n "<<<<<<<\|=======\|>>>>>>>" -- .` | PASS, no conflict markers |
| `uv run ruff check .` in `apps/api` | PASS |
| `uv run mypy app` in `apps/api` | PASS |
| `uv run pytest` in `apps/api` | PASS, 24 passed, 1 TestClient deprecation warning |
| `uv run python scripts/smoke_test.py` in `apps/api` | PASS |
| `npm run lint --if-present` | PASS |
| `npm run typecheck --if-present` | PASS |
| `npm run build --if-present` | PASS |
| `npm run lint:web --if-present` | PASS |
| `npm run typecheck:web --if-present` | PASS |
| `npm run build:web --if-present` | PASS |
| `npm test --if-present` | PASS, 9 RAG tests passed |
| `npm run rag:dry-run --if-present` | PASS |
| `npm run rag:smoke --if-present` | PASS |
| `npm run lint:devops --if-present` | PASS |
| `npm run typecheck:devops --if-present` | PASS |
| `npm run docker:config --if-present` | FAIL_ENV_LIMITATION on `fix/qa-devops-audit-review`, Docker CLI unavailable: `'docker' is not recognized as an internal or external command` |
| `npm audit --audit-level=moderate` at repository root | SKIPPED, root has no lockfile |
| `npm audit --audit-level=moderate --workspaces=false` in `apps/web` | PASS on `fix/qa-devops-audit-review`, 0 vulnerabilities after upgrading `vitest` to `^4.1.8` |
| `uv run pytest` in `packages/football-models` | SKIPPED, package does not declare pytest executable |
| `python -m unittest discover -s tests` in `packages/football-models` | PASS, 7 tests passed |

## Compliance Checks

Forbidden wording scan found matches only in governance documents, QA criteria, safety prompts, tests, and lint scripts as prohibited examples or guardrails. No product UI copy was found using the prohibited Chinese phrases. English `betting advice` appears in docs/tests/safety prompts as a forbidden behavior, not as a recommendation.

Payment residual scan found Stripe/checkout/subscription terms only in documents and scripts that explicitly prohibit those MVP features. No Stripe dependency, checkout API, billing webhook, self-service recharge, subscription flow, or payment implementation was found.

Secrets scan found only `.env.example` placeholders:

- `DATABASE_URL=postgresql://worldcup_app:worldcup_app_dev_password@localhost:5432/worldcup_ai_prediction`
- `OPENAI_API_KEY=replace_with_local_api_key`

The `sk-` search also matched `askWithRag`, which is a false positive. No real API key, live publishable key, webhook secret, or private token was found.

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
- Balance is calculated from ledger entries; no direct `token_balance` overwrite path was found.

## API Contract

Backend API contract status: PASS.

Implemented or stubbed routes include auth, account, admin, football, RAG, prediction, simulation, and report endpoints required by the contract. Tests cover the main contract flows.

## RAG

RAG status: PASS.

Evidence:

- RAG core does not mutate token quota directly.
- RAG smoke returns usage and source counts.
- Unit tests verify citations/sources.
- Retrieval supports `matchId`, `teamId`, and `playerId` filters.
- Prompt builder states that retrieved documents are data, not instructions.
- Prompt injection guard behavior is tested.
- No-result diagnostics are tested.
- Safety prompt forbids betting advice.

## Prediction Engine

Prediction engine status: FAIL_PENDING_T6_RETEST.

Passing evidence:

- Probability outputs are normalized in tests.
- Monte Carlo, Poisson, Elo, xG, and what-if behavior have tests or examples.
- Package does not directly deduct tokens.
- Fix branch `fix/qa-prediction-contract` adds stable match prediction
  `prediction.confidence`, `prediction.riskFactors`,
  `prediction.keyDrivers`, and `metering` fields.
- What-if output includes `baseline`, `adjusted`, `delta`, and `metering`.
- Group simulation API output includes `metering`.

Pending verification:

- T6 must re-run final QA before marking the prediction engine PASS.

## Frontend

Frontend status: FAIL.

Passing evidence:

- `npm run lint:web --if-present` passes.
- `npm run typecheck:web --if-present` passes.
- `npm run build:web --if-present` passes.
- UI includes auth, account status, approval/admin placeholders, low token messaging, and suspended/rejected states in stubs/styles.

Blocking gap:

- Required pages/routes are not fully present: `/matches`, `/matches/[matchId]`, `/teams/[teamId]`, `/players/[playerId]`, `/simulator/group`, `/simulator/knockout`, `/reports`, `/access`, `/account`.
- Current route model only includes `home`, `login`, `register`, `prediction`, and `admin`.

## Known Risks

- Docker CLI is unavailable, so `docker compose config` could not be verified in this environment. Manual verification must run `npm run docker:config --if-present` or `docker compose config` on a host with Docker CLI and Compose plugin installed.
- Root `npm audit` is unavailable because the root package has no lockfile.
- Frontend package audit was resolved on `fix/qa-devops-audit-review`. The previous 5 findings were limited to Vitest/Vite/Vite-node/esbuild dev/test tooling, not shipped frontend business logic. The fix upgraded `vitest` to `^4.1.8` and preserved lint/typecheck/build/test.

## Required Before Main Merge

1. Add or scope down the required frontend route/page coverage.
2. Re-run T6 QA against `fix/qa-prediction-contract` or after merging it back into the QA integration branch.
3. Re-run Docker config check in an environment with Docker CLI.

## Production Recommendations

- Move Vite and TypeScript from frontend production dependencies to dev dependencies if not needed at runtime.
- Add a root lockfile if root-level npm audit is required.
- Add CI checks for Docker config, forbidden copy, secret scanning, backend tests, frontend build, RAG tests, and prediction tests.
