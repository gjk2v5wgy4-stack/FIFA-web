# Security And Compliance Review

Branch: `feature/06-qa-integration`

Retest base before QA report update: `d797c28`

## Secret Scan

Status: PASS

Broad scan patterns included API key, secret, password, token, private key, `sk-`, `pk_live`, and `whsec_`.

Findings:

- `.env.example` and deployment examples include placeholder or local-development values only.
- `OPENAI_API_KEY=replace_with_local_api_key` is a placeholder.
- Local compose defaults such as `worldcup_app_dev_password` and `worldcup_redis_dev_password` are documented local defaults, not live credentials.
- `sk-` matched `askWithRag`, a false positive.
- No live secret, private key, Stripe key, webhook secret, or private token was found.

## Payment / Checkout Residuals

Status: PASS

Stripe, checkout, subscription, billing webhook, and self-service recharge terms appear only in docs and lint scripts as MVP exclusions or forbidden examples. No payment dependency or implementation was found.

## Forbidden Wording

Status: PASS_WITH_CONTEXT

Matches for prohibited wording appear only in:

- `AGENTS.md`
- `docs/qa/acceptance-criteria.md`
- `infra/scripts/lint.ps1`

These are governance rules, prohibited examples, or lint guardrails. Product UI copy did not introduce guaranteed-prediction or betting-advice wording.

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
- Result: PASS
- Evidence: `found 0 vulnerabilities`
- Fix evidence: `fix/qa-devops-audit-review` upgraded frontend `vitest` to `^4.1.8` and refreshed `apps/web/package-lock.json`.

## DevOps Security

Status: PASS_WITH_ENV_LIMITATION

- `.env.example` exists.
- `docker-compose.yml` exists.
- DevOps lint/typecheck scripts pass.
- Docker config could not be validated because Docker CLI is unavailable in this environment.
- Current evidence: `npm run docker:config --if-present` fails because `docker` is not recognized.
- Boundary: this is an environment limitation only. It does not validate or invalidate Compose syntax.
- Required Docker-host verification: run `npm run docker:config --if-present` from the repository root, or run `docker compose config`.
- MVP does not require Stripe env values to start.
