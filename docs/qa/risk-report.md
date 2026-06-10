# Risk Report

Date: 2026-06-10

Branch: `feature/06-qa-integration`

Overall risk status: `LOW`

## Open Risks

| Risk | Severity | Status | Mitigation |
| --- | --- | --- | --- |
| Stripe/checkout and forbidden-word scans match governance/test/disclaimer text | Low | DOCUMENTED | Matches are not product implementation or user-facing guarantee promises |

## Resolved Risks

| Risk | Resolution |
| --- | --- |
| Frontend route coverage gap | T1 route coverage and login topbar are merged; frontend tests/build pass |
| 2026 World Cup background/UI polish not visible in T6 | `fix/web-ui-polish` merged into T6 |
| Prediction contract missing fields | Existing QA prediction fix remains merged and backend contract tests pass |
| RAG vector pipeline missing from backend integration | T3 Qdrant adapter and smoke scripts merged; RAG smoke passes |
| T2/T5 RAG contract overlap | `/api/rag/query` keeps retrieval-only contract; `/api/rag/ask` supports metered compatibility calls |
| Admin token model regression | Token API tests pass for approval, insufficient balance, low balance, ledger, usage log, idempotency, and suspended-user blocking |
| Web audit vulnerabilities | `npm audit --prefix apps/web` reports 0 vulnerabilities |
| Docker config environment limitation | Docker CLI is available and `docker compose config` passes |
| DevOps lint dirty-diff limitation | After the QA integration commit, `npm run lint:devops --if-present` passes |

## Security And Compliance

- No live API keys, private keys, Stripe keys, webhook secrets, or private tokens were found by pattern scan.
- Payment terms appear only in MVP exclusion documentation and guardrail scripts.
- Betting/guarantee wording appears only in safety rules, tests, and RAG context that explicitly rejects betting advice or guaranteed outcomes.
- No nested `.git` directory was found.
- No Git submodule is configured.
