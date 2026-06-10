# Security And Compliance Review

Branch: `feature/06-qa-integration`

Retest base before this QA report update: `5fab620`

## Secret Scan

Status: PASS

Broad scan patterns included API key, secret, password, token, private key, `sk-`, `pk_live`, and `whsec_`.

Findings:

- `.env.example` and deployment examples include placeholder or local-development values only.
- `OPENAI_API_KEY=replace_with_local_api_key` is a placeholder.
- Local compose defaults such as `worldcup_app_dev_password` and `worldcup_redis_dev_password` are documented local defaults, not live credentials.
- `sk-` matched source-code identifiers such as `askWithRag`, a false positive.
- Token and password matches in backend code are model fields, hashed-password utilities, test fixtures, or local placeholders.
- An untracked temporary HTML capture in the T3 worktree contained sensitive form fields; it was removed before merge and was not committed.
- No live secret, private key, Stripe key, webhook secret, or private token was found in tracked files.

## Payment / Self-Service Residuals

Status: PASS

Third-party payment, hosted payment page, recurring plan, billing webhook, and self-service recharge references appear only in docs and lint scripts as MVP exclusions or forbidden examples. No payment dependency or implementation was found.

## Forbidden Wording

Status: PASS_WITH_CONTEXT

Matches for prohibited wording appear in:

- `AGENTS.md`
- QA criteria and previous QA records
- `infra/scripts/lint.ps1`
- RAG market-context documents that explicitly state the product must not offer betting advice or guaranteed outcomes

These are governance rules, prohibited examples, lint guardrails, or data-context disclaimers. Product UI copy and runtime prediction output did not introduce guaranteed-prediction or betting-advice wording.

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
