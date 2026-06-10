# Manual Verification Checklist

Branch: `feature/06-qa-integration`

Retest base before this QA report update: `5fab620`

This project no longer requires user code review. This checklist records optional operational verification and remaining environment checks for deployment readiness.

## Merge Gate

- [x] Frontend route coverage fixed and T6 automatic QA retest passed.
- [x] Prediction output contract fixed and T6 automatic QA retest passed.
- [x] Frontend npm audit findings resolved; `apps/web` audit reports 0 vulnerabilities.
- [x] Latest T2 backend update merged and backend tests passed.
- [x] Latest T3 RAG data/context update merged and RAG tests/dry-runs passed.
- [x] Latest frontend fix update merged and frontend tests/build passed.
- [x] No nested `.git` found.
- [x] No submodule found.
- [ ] Docker config must be run on a machine with Docker CLI and Compose plugin if strict Docker validation is required.

## Functional Verification

- [x] Backend tests cover pending user metered API blocking.
- [x] Backend tests cover approved user metered API access when balance is sufficient.
- [x] Backend tests cover rejected and suspended users being blocked.
- [x] Backend tests cover `INSUFFICIENT_TOKENS`.
- [x] Backend tests cover `lowTokenWarning=true`.
- [x] Backend tests cover `token_ledger` writes.
- [x] Backend tests cover `api_usage_logs` writes.
- [x] Backend tests cover non-admin users receiving `FORBIDDEN` on admin routes.

## API Contract

- [x] `POST /api/auth/register`
- [x] `POST /api/auth/login`
- [x] `GET /api/auth/me`
- [x] `GET /api/account/access-status`
- [x] `GET /api/account/tokens`
- [x] `GET /api/account/usage`
- [x] `GET /api/admin/users`
- [x] `GET /api/admin/users/pending`
- [x] `POST /api/admin/users/:userId/approve`
- [x] `POST /api/admin/users/:userId/reject`
- [x] `POST /api/admin/users/:userId/suspend`
- [x] `POST /api/admin/users/:userId/reactivate`
- [x] `POST /api/admin/users/:userId/tokens/grant`
- [x] `POST /api/admin/users/:userId/tokens/adjust`
- [x] `GET /api/admin/users/:userId/usage`
- [x] `GET /api/admin/users/:userId/token-ledger`
- [x] `GET /api/admin/audit-logs`
- [x] `GET /api/matches`
- [x] `GET /api/matches/:matchId`
- [x] `GET /api/teams/:teamId`
- [x] `GET /api/players/:playerId`
- [x] `GET /api/weather/forecast`
- [x] `POST /api/rag/ask`
- [x] `POST /api/predictions/match`
- [x] `POST /api/predictions/what-if`
- [x] `POST /api/simulations/group`
- [x] `POST /api/reports/generate`

## Frontend

- [x] `/`
- [x] `/matches`
- [x] `/matches/[matchId]`
- [x] `/teams/[teamId]`
- [x] `/players/[playerId]`
- [x] `/simulator/group`
- [x] `/simulator/knockout`
- [x] `/reports`
- [x] `/access`
- [x] `/account`
- [x] `/admin`
- [x] No UI text offers third-party payment, self-service recharge, hosted payment pages, automatic payment, betting advice, or guaranteed outcomes.

## Prediction Engine

- [x] Probabilities sum to a valid total.
- [x] `prediction.confidence` is `low`, `medium`, or `high`.
- [x] `prediction.riskFactors` is an array.
- [x] `prediction.keyDrivers` is an array.
- [x] `metering.featureType`, `metering.complexity`, and `metering.estimatedInternalTokens` are present.
- [x] `metering.estimatedInternalTokens` is greater than 0.
- [x] What-if output includes `baseline`, `adjusted`, `delta`, and `metering`.
- [x] Group simulation output includes `metering`.
- [x] Prediction package does not directly deduct tokens.
- [x] No guaranteed prediction wording in tested outputs.

## DevOps

- [x] `npm run lint:devops --if-present` passes.
- [x] `npm run typecheck:devops --if-present` passes.
- [x] `.env.example` uses placeholders only.
- [ ] Run `npm run docker:config --if-present` from the repository root on a Docker-enabled host, or run `docker compose config` directly.
- [ ] Record Docker config output. Expected passing result: command exits 0 and renders the Compose configuration without schema errors.
