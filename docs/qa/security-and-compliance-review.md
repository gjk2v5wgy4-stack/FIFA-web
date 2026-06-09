# Security And Compliance Review

Branch: `feature/06-qa-integration`

QA base commit before reports: `3f6303c`

## Secret Scan

Status: PASS

Search patterns:

- `OPENAI_API_KEY=`
- `JWT_SECRET=`
- `DATABASE_URL=`
- `STRIPE_SECRET_KEY=`
- `sk-`
- `pk_live`
- `whsec_`

Findings:

- `.env.example` includes placeholder/local values for `DATABASE_URL` and `OPENAI_API_KEY`.
- `OPENAI_API_KEY=replace_with_local_api_key` is a placeholder.
- `DATABASE_URL=postgresql://worldcup_app:worldcup_app_dev_password@localhost:5432/worldcup_ai_prediction` is a local example.
- `sk-` matched `askWithRag`, a false positive.
- No live secret, private key, Stripe key, webhook secret, or token was found.

## Payment / Checkout Residuals

Status: PASS

Stripe, checkout, subscription, billing webhook, and self-service recharge terms appear only in docs and lint scripts as MVP exclusions or forbidden examples. No payment dependency or implementation was found.

## Forbidden Wording

Status: PASS_WITH_CONTEXT

Matches for prohibited wording appear in:

- `AGENTS.md`
- `docs/qa/acceptance-criteria.md`
- `docs/api/api-contract.md`
- `docs/rag-core.md`
- `docs/product/pricing-model.md`
- `infra/scripts/lint.ps1`
- `packages/rag-core/safety/index.js`
- `packages/rag-core/tests/rag-core.test.js`
- `packages/football-models/README.md`

These are governance rules, safety prompts, tests, or prohibited examples. They are not product UI copy promising guaranteed predictions or providing betting advice.

## Admin Token Model

Status: PASS

Confirmed behavior:

- New users default to `pending_approval`.
- Admin actions include approve, reject, suspend, reactivate, grant, adjust, and revoke.
- Admin operations write `admin_action_logs`.
- Token changes write `token_ledger`.
- Metered API usage writes `api_usage_logs`.
- Pending, rejected, and suspended users are blocked.
- Approved users can consume metered APIs when balance is sufficient.
- Insufficient balance returns `INSUFFICIENT_TOKENS`.
- Low balance returns `lowTokenWarning=true`.
- Duplicate request IDs do not double-charge tokens.
- Non-admin users cannot access admin APIs.

## NPM Audit

Root audit:

- Command: `npm audit --audit-level=moderate`
- Result: SKIPPED
- Reason: root package has no lockfile.

Frontend audit:

- Command: `npm audit --audit-level=moderate --workspaces=false` in `apps/web`
- Result: FAIL_RISK
- Count: 5 vulnerabilities
- Severity: 4 moderate, 1 critical
- Affected packages: `vitest`, `vite-node`, `vite`, `esbuild`, `@vitest/mocker`
- Critical advisory: `vitest` UI server arbitrary file read/execute issue for versions `<3.2.6`
- Fix reported by npm requires `vitest@4.1.8`, a SemVer-major upgrade.

Production impact assessment:

- Current findings are in frontend build/test/dev tooling paths rather than shipped app business logic.
- Risk should be addressed before production CI or shared dev environments expose Vitest/Vite dev servers.

Recommended follow-up:

- Upgrade `vitest` and related Vite toolchain in the frontend branch with dedicated regression testing.
- Add a root lockfile if root-level audit is a required CI gate.

## DevOps Security

Status: PASS_WITH_ENV_LIMITATION

- `.env.example` exists.
- `docker-compose.yml` exists.
- DevOps lint/typecheck scripts pass.
- Docker config could not be validated because Docker CLI is unavailable.
- MVP does not require Stripe env values to start.
