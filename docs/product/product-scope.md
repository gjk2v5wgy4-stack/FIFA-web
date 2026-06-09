# Product Scope

## Product

`worldcup-ai-prediction` is a World Cup AI/RAG football data prediction web system.

It is not a simple chatbot. It is a football data intelligence platform with:

- Frontend web app
- FastAPI backend
- RAG vector retrieval
- Football prediction engine
- Admin approval
- Token quota metering
- Reports
- QA
- DevOps

## MVP Users

- Regular users who need World Cup data analysis and probabilistic predictions.
- Admin users who approve accounts and manage token quota.
- QA reviewers who validate contract behavior.

## MVP Product Modules

### Dashboard

Shows:

- Match schedule highlights.
- Prediction summaries.
- Account approval status.
- Token balance.
- Low-token reminder to contact admin.

### Match Intelligence

Shows:

- Match metadata.
- Team form.
- Injuries and suspensions.
- Probability prediction.
- Score distribution.
- RAG citations.
- Report generation entry point.

Odds may appear only as market context or model input context. The UI must not produce betting recommendations.

### Team Intelligence

Shows:

- Squad.
- Group and fixtures.
- Rankings.
- Tactical profile.
- xG/xGA trends.
- Path difficulty.

### Player Intelligence

Shows:

- Player profile.
- Availability.
- Recent stats.
- Injury/suspension state.
- Model impact.

### AI Analyst

Provides:

- Context-aware RAG answers.
- Citations.
- Uncertainty and risk factors.
- Provider usage logging.
- Token deduction after successful usage.

### Group Simulator

Provides:

- What-if results.
- Projected table.
- Qualification probability.
- Monte Carlo simulation output.

### Prediction Engine

Provides:

- Elo features.
- xG/xGA features.
- Poisson score model.
- Monte Carlo tournament simulation.
- What-if scenario deltas.

### Report Center

Provides:

- Queued/generated reports.
- Report status.
- Report output links.
- Citation and model version metadata.

### Admin Console

Provides:

- Pending user review.
- Approve/reject/suspend/reactivate actions.
- Token grant/adjust/revoke actions.
- Token ledger visibility.
- Admin action audit log.

## MVP Access Rules

- New users start as `pending_approval`.
- Only `approved` users can access protected AI/RAG/prediction/report APIs.
- `rejected` and `suspended` users cannot access protected APIs.
- Token balance is calculated from `token_ledger`.
- Low token balance prompts users to contact admin.
- Admin manually grants or adjusts tokens.

## Explicit MVP Non-Goals

- No Stripe.
- No checkout page.
- No subscription plan.
- No public self-service recharge.
- No automatic paid upgrade.
- No gambling functionality.
- No betting functionality.
- No guaranteed prediction wording.
- No separate repositories or independent projects.

## Success Criteria

The MVP direction is accepted when:

- The monorepo structure exists in one Git repository.
- API contract defines auth, account, football data, RAG, prediction, reports, and admin token endpoints.
- Data model defines users, token ledger, usage logs, football data, RAG documents/chunks, predictions, and reports.
- Branch strategy defines all required feature branches.
- Codex branch plan forbids separate repositories and nested Git projects.
- QA can verify architecture, API, data model, and MVP access model.
