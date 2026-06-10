# Risk Report

Date: 2026-06-10

Branch: `feature/06-qa-integration`

Overall risk status: `LOW_WITH_ENV_LIMITATION`

## Remaining Limitation

| Risk | Severity | Status | Mitigation |
| --- | --- | --- | --- |
| Docker CLI unavailable in current QA environment | Medium | OPEN_ENV_LIMITATION | Run `npm run docker:config --if-present` or `docker compose config` on a Docker-enabled host. |
| Root `npm audit` has no lockfile to audit | Low | DOCUMENTED | `apps/web` audit is authoritative for frontend dependencies and reports 0 vulnerabilities. |

## Resolved Risks

| Risk | Resolution |
| --- | --- |
| Frontend route coverage gap | Fixed by `fix/qa-frontend-route-coverage`; route tests and frontend build pass. |
| Prediction contract missing fields | Fixed by `fix/qa-prediction-contract`; backend contract tests and prediction unittest pass. |
| Frontend npm audit vulnerabilities | Fixed by `fix/qa-devops-audit-review`; `apps/web` audit reports 0 vulnerabilities. |
| Latest backend update integration risk | Merged latest `feature/02-backend-api`; backend lint, mypy, pytest, and smoke test pass. |
| Latest T3 RAG data/context integration risk | Merged latest `feature/03-rag-vector-pipeline`; RAG unit tests, dry-runs, and smoke test pass. |
| Latest frontend route-fix update risk | Merged latest `fix/qa-frontend-route-coverage`; frontend lint, typecheck, build, and tests pass. |

## Security And Compliance

- No real API keys, private keys, live tokens, Stripe keys, or webhook secrets were found.
- Third-party payment, hosted payment page, recurring plan, and self-service recharge references appear only as MVP exclusions or forbidden examples.
- Prohibited guarantee or betting wording appears only in governance, lint guardrails, QA records, or RAG market-context documents that explicitly reject betting advice and guaranteed outcomes.
- Admin token access model passes automated tests for approval, blocking, ledger, usage logs, low-balance warning, and insufficient-token behavior.
- An untracked temporary HTML capture in the T3 worktree was removed before merge and was not committed.
