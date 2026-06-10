# Final QA Report

Date: 2026-06-10

Branch: `feature/06-qa-integration`

Retest base before this QA report update: `5fab620`

Final conclusion: `AUTO_QA_PASS_WITH_ENV_LIMITATION`

Merge-to-main recommendation: ready for automatic main merge with the Docker CLI limitation recorded.

## Latest Integrated Updates

| Source branch | Source commit | Merge commit | Result |
| --- | --- | --- | --- |
| `feature/02-backend-api` | `a671d12 feat(api): add weather forecast endpoint` | `a19838a` | Merged. Backend contract tests now keep both weather forecast coverage and prediction contract coverage. |
| `feature/03-rag-vector-pipeline` | `5423312 docs(rag): add expanded world cup market context` | `318eaf7` | Merged. RAG world cup data dry-run script and expanded data docs are integrated. |
| `fix/qa-frontend-route-coverage` | `6a2318c fix(web): remove duplicate reports feature` | `5fab620` | Merged. Frontend route fix branch remains integrated and current. |

Previously integrated QA fix branches remain merged:

| Branch | Evidence | Result |
| --- | --- | --- |
| `fix/qa-prediction-contract` | `a09b066` | Prediction output contract retest passed. |
| `fix/qa-devops-audit-review` | `8ab630f` | Frontend audit retest passed. Docker remains environment-limited. |
| `fix/qa-frontend-route-coverage` | `d797c28`, refreshed by `5fab620` | Route coverage and frontend build retest passed. |

## Module Status

| Module | Status | Notes |
| --- | --- | --- |
| Frontend | PASS | Required pages and updated duplicate-report fix are covered. Lint, typecheck, build, and Vitest tests passed. |
| Backend API | PASS | FastAPI lint, mypy, pytest, smoke test, weather endpoint tests, token tests, and API contract tests passed. |
| Admin Token Access | PASS | Approval, rejection/suspension blocking, admin-only access, ledger writes, idempotent token consumption, low balance warning, and insufficient token handling are covered. |
| RAG | PASS | Unit tests, ingestion dry-run, live context smoke, and world cup data dry-run passed. |
| Prediction Engine | PASS | Match, what-if, and group outputs expose confidence, risk factors, key drivers, and metering estimates. Package unittest passed. |
| DevOps | PASS_WITH_ENV_LIMITATION | Static DevOps lint/typecheck passed. `apps/web` npm audit reports 0 vulnerabilities. Docker config could not run because Docker CLI is unavailable. |

## Commands And Results

| Command | Result |
| --- | --- |
| `git branch --show-current` | PASS, `feature/06-qa-integration` |
| `git status --short` | PASS, clean before report update |
| `git merge --no-ff feature/02-backend-api` | PASS after resolving `apps/api/tests/test_api_contract.py` by keeping weather and prediction contract tests |
| `git merge --no-ff feature/03-rag-vector-pipeline` | PASS after resolving `package.json` by preserving all root scripts and adding `rag:worldcup-data-dry-run` |
| `git merge --no-ff fix/qa-frontend-route-coverage` | PASS, no conflicts |
| `git diff --check` | PASS |
| `git grep -n "^<<<<<<<\|^=======$\|^>>>>>>>" -- .` | PASS, no conflict markers |
| Nested `.git` scan | PASS, none found |
| `git submodule status` | PASS, no submodules |
| `uv run ruff check .` in `apps/api` | PASS |
| `uv run mypy app` in `apps/api` | PASS |
| `uv run pytest` in `apps/api` | PASS, 28 passed, 1 TestClient deprecation warning |
| `uv run python scripts/smoke_test.py` in `apps/api` | PASS |
| `uv run pytest` in `packages/football-models` | SKIPPED, package does not declare pytest executable |
| `python -m unittest discover -s tests` in `packages/football-models` | PASS, 7 tests passed |
| `npm run lint --if-present` | PASS |
| `npm run typecheck --if-present` | PASS |
| `npm test --if-present` | PASS, 15 RAG tests passed |
| `npm run rag:dry-run --if-present` | PASS |
| `npm run rag:worldcup-data-dry-run --if-present` | PASS |
| `npm run rag:smoke --if-present` | PASS |
| `npm run lint:web --if-present` | PASS |
| `npm run typecheck:web --if-present` | PASS |
| `npm run build:web --if-present` | PASS |
| `npm run test:web --if-present` | PASS, Vitest 4.1.8, 6 files and 24 tests passed |
| `npm run lint:devops --if-present` | PASS |
| `npm run typecheck:devops --if-present` | PASS |
| `npm run docker:config --if-present` | PASS_WITH_ENV_LIMITATION, Docker CLI unavailable |
| `npm audit --audit-level=moderate --workspaces=false` in `apps/web` | PASS, 0 vulnerabilities |
| `npm audit --audit-level=moderate` at repository root | SKIPPED, root package has no lockfile |

## Compliance Checks

Forbidden wording scan found matches in governance, lint guardrails, QA records, and RAG market-context documents. The RAG documents use these terms only to state that the product must not provide betting advice or guaranteed outcomes. Product UI and runtime output do not introduce prohibited promises.

Payment residual scan found third-party payment, hosted payment page, recurring plan, billing webhook, and self-service recharge references only in documents or scripts that explicitly prohibit those MVP features. No payment dependency, hosted payment API, payment implementation, or self-service recharge flow was found.

Secrets scan found placeholder/local-development examples and source-code identifiers only. No live API key, private key, Stripe key, webhook secret, or private token was found. An untracked temporary HTML capture in the T3 worktree was removed before merge and was not committed.

## Token Model

Token model status: PASS.

Evidence:

- Registration defaults to `pending_approval`.
- Pending users are blocked from metered RAG API.
- Approved users can call metered APIs when balance is sufficient.
- Rejected and suspended users are blocked.
- Insufficient balance returns `INSUFFICIENT_TOKENS`.
- Low balance returns `lowTokenWarning=true`.
- Token changes are recorded in `token_ledger`.
- API usage is recorded in `api_usage_logs`.
- Admin actions are recorded in `admin_action_logs`.
- Non-admin users receive `FORBIDDEN` on admin routes.
- Balance is calculated from ledger entries; no direct authoritative `token_balance` overwrite path was found.

## Final Risk

Only one release limitation remains:

- Docker CLI is unavailable in this environment, so `docker compose config` could not be validated here.

If Docker validation is mandatory before deployment, run `npm run docker:config --if-present` or `docker compose config` on a Docker-enabled host. Otherwise, the integrated MVP branch is ready for automatic main merge with the environment limitation recorded.
