# Manual Verification Checklist

Branch: `feature/06-qa-integration`

QA base commit before reports: `3f6303c`

## Merge Gate

- [ ] Do not merge to `main` until frontend route coverage is resolved or formally descoped.
- [ ] Do not merge to `main` until prediction output contract gaps are resolved or formally descoped.
- [ ] Run `npm run docker:config --if-present` or `docker compose config` on a machine with Docker CLI and Compose plugin.
- [x] Frontend npm audit findings were resolved on `fix/qa-devops-audit-review` by upgrading `vitest` to `^4.1.8`; re-run audit during merge retest.

## Functional Verification

- [ ] Register a new user and confirm status is `pending_approval`.
- [ ] Confirm pending user can log in but cannot call RAG/prediction/simulation/report APIs.
- [ ] Admin approves user and grants initial tokens.
- [ ] Approved user can call RAG/prediction/simulation/report APIs when balance is sufficient.
- [ ] Rejected and suspended users cannot call metered APIs.
- [ ] Insufficient token balance returns `INSUFFICIENT_TOKENS`.
- [ ] Low balance returns `lowTokenWarning=true`.
- [ ] Token grants, adjustments, revokes, and consumption create `token_ledger` entries.
- [ ] Metered API calls create `api_usage_logs`.
- [ ] Admin approval/token actions create `admin_action_logs`.
- [ ] Non-admin users receive `FORBIDDEN` on admin routes.

## API Contract

- [ ] `POST /api/auth/register`
- [ ] `POST /api/auth/login`
- [ ] `GET /api/auth/me`
- [ ] `GET /api/account/access-status`
- [ ] `GET /api/account/tokens`
- [ ] `GET /api/account/usage`
- [ ] `GET /api/admin/users`
- [ ] `GET /api/admin/users/pending`
- [ ] `POST /api/admin/users/:userId/approve`
- [ ] `POST /api/admin/users/:userId/reject`
- [ ] `POST /api/admin/users/:userId/suspend`
- [ ] `POST /api/admin/users/:userId/reactivate`
- [ ] `POST /api/admin/users/:userId/tokens/grant`
- [ ] `POST /api/admin/users/:userId/tokens/adjust`
- [ ] `GET /api/admin/users/:userId/usage`
- [ ] `GET /api/admin/users/:userId/token-ledger`
- [ ] `GET /api/admin/audit-logs`
- [ ] `GET /api/matches`
- [ ] `GET /api/matches/:matchId`
- [ ] `GET /api/teams/:teamId`
- [ ] `GET /api/players/:playerId`
- [ ] `POST /api/rag/ask`
- [ ] `POST /api/predictions/match`
- [ ] `POST /api/predictions/what-if`
- [ ] `POST /api/simulations/group`
- [ ] `POST /api/reports/generate`

## Frontend

- [ ] Add or verify `/`.
- [ ] Add or verify `/matches`.
- [ ] Add or verify `/matches/[matchId]`.
- [ ] Add or verify `/teams/[teamId]`.
- [ ] Add or verify `/players/[playerId]`.
- [ ] Add or verify `/simulator/group`.
- [ ] Add or verify `/simulator/knockout`.
- [ ] Add or verify `/reports`.
- [ ] Add or verify `/access`.
- [ ] Add or verify `/account`.
- [ ] Add or verify `/admin`.
- [ ] Confirm no UI text offers Stripe, self-service recharge, checkout, automatic payment, betting advice, or guaranteed outcomes.

## Prediction Engine

- [x] Confirm probabilities sum to a valid total on fix branch `fix/qa-prediction-contract`.
- [x] Add or verify `prediction.confidence` as `low`, `medium`, or `high`.
- [x] Add or verify `prediction.riskFactors` array.
- [x] Add or verify `prediction.keyDrivers` array.
- [x] Add or verify `metering.featureType`, `metering.complexity`, and `metering.estimatedInternalTokens`.
- [x] Confirm package does not directly deduct tokens.
- [x] Confirm no guaranteed prediction wording in tested outputs.
- [ ] T6 automatic QA retest confirms final PASS.

## DevOps

- [ ] Run `npm run docker:config --if-present` from the repository root on a Docker-enabled host, or run `docker compose config` directly.
- [ ] Record Docker config output. Expected passing result: command exits 0 and renders the Compose configuration without schema errors.
- [ ] If Docker CLI is unavailable, record `PASS_WITH_ENV_LIMITATION` and do not treat it as Compose syntax validation.
- [ ] Confirm local-dev documentation covers admin approval and token quota workflow.
- [ ] Confirm seed/admin setup is documented.
- [ ] Confirm `.env.example` uses placeholders only.
