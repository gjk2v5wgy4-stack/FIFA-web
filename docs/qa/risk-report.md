# Risk Report

Date: 2026-06-09

Branch: `feature/06-qa-integration`

Overall risk status: `LOW_WITH_ENV_LIMITATION`

## Remaining Limitation

| Risk | Severity | Status | Mitigation |
| --- | --- | --- | --- |
| Docker CLI unavailable in current QA environment | Medium | OPEN_ENV_LIMITATION | Run `npm run docker:config --if-present` or `docker compose config` on a Docker-enabled host. |

## Resolved Risks

| Risk | Resolution |
| --- | --- |
| Frontend route coverage gap | Fixed by `fix/qa-frontend-route-coverage`; route tests and frontend build pass. |
| Prediction contract missing fields | Fixed by `fix/qa-prediction-contract`; backend contract tests and prediction unittest pass. |
| Frontend npm audit vulnerabilities | Fixed by `fix/qa-devops-audit-review`; `apps/web` audit reports 0 vulnerabilities. |

## Security And Compliance

- No real API keys, private keys, live tokens, Stripe keys, or webhook secrets were found.
- Stripe, checkout, subscription, and self-service recharge terms appear only as MVP exclusions or forbidden examples.
- Prohibited guarantee or betting wording appears only in governance/lint guardrails.
- Admin token access model passes automated tests for approval, blocking, ledger, usage logs, low-balance warning, and insufficient-token behavior.
