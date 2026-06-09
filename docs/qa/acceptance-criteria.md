# Acceptance Criteria

## Purpose

Acceptance criteria for the architecture/contracts branch: `feature/00-architecture-contracts`.

## Repository Acceptance

The project must be a single Git repository monorepo.

Required checks:

- `.git` exists at the project root.
- Do not create nested `.git` directories.
- Do not create Git submodules.
- Do not create sibling independent project folders.
- Required directories exist:
  - `apps/web`
  - `apps/api`
  - `packages/shared`
  - `packages/rag-core`
  - `packages/football-models`
  - `docs`
  - `infra`

## Branch Acceptance

The task branch must be:

```text
feature/00-architecture-contracts
```

Feature branches must stay inside the same repository:

- `feature/00-architecture-contracts`
- `feature/01-frontend-ui`
- `feature/02-backend-api`
- `feature/03-rag-vector-pipeline`
- `feature/04-prediction-engine`
- `feature/05-admin-token-access`
- `feature/06-qa-integration`
- `feature/07-devops-deployment`

Codex may use a worktree only if it points to a branch of this same repository.

## Required Documents

These files must exist:

- `docs/architecture/overview.md`
- `docs/architecture/branch-strategy.md`
- `docs/architecture/codex-branch-plan.md`
- `docs/api/api-contract.md`
- `docs/api/data-model.md`
- `docs/product/product-scope.md`
- `docs/product/access-token-model.md`
- `docs/qa/acceptance-criteria.md`

## Architecture Content Acceptance

Docs must state:

- All modules belong to one Git repository.
- Every board/module uses a same-repository feature branch.
- Codex worktrees must come from same-repository branches.
- Multiple independent projects are forbidden.
- Automatic archive is forbidden.
- Self-merge into `main` is forbidden.
- MVP uses admin approval and token quota.
- MVP does not use Stripe.

## API Contract Acceptance

`docs/api/api-contract.md` must cover:

- Registration and login.
- Account status.
- Token balance.
- Match list and match detail.
- Team detail.
- Player detail.
- RAG ask.
- Match prediction.
- What-if prediction.
- Group simulation.
- Report generation.
- Admin user listing.
- Admin approve/reject/suspend/reactivate.
- Admin token grant/adjust/revoke.

Metered responses must include:

- `tokensCharged`
- `remainingTokens`
- `lowBalance`

## Data Model Acceptance

`docs/api/data-model.md` must cover:

- PostgreSQL as primary database.
- Redis for sessions, rate limits, cache, and job status.
- Chroma or Qdrant vector collection.
- `users`
- `admin_action_logs`
- `token_ledger`
- `ai_usage_logs`
- `teams`
- `players`
- `fixtures`
- `matches`
- `venues`
- `weather`
- `team_match_stats`
- `player_match_stats`
- `injuries`
- `suspensions`
- `rankings`
- `odds`
- `documents`
- `document_chunks`
- `rag_queries`
- `predictions`
- `reports`

`document_chunks.metadata` must include:

- `source_type`
- `source_name`
- `source_url`
- `published_at`
- `team_ids`
- `player_ids`
- `match_ids`
- `tournament_stage`
- `language`
- `chunk_index`
- `checksum`

## MVP Access Acceptance

Docs must define:

- `pending_approval`
- `approved`
- `rejected`
- `suspended`

Docs must define:

- `approve_user`
- `reject_user`
- `suspend_user`
- `reactivate_user`
- `grant_tokens`
- `adjust_tokens`
- `revoke_tokens`

All token changes must use `token_ledger`.

## Safety Acceptance

Docs and later implementation must not include:

- Gambling functionality.
- Betting functionality.
- Odds recommendation.
- Guaranteed prediction wording.

Avoid:

- 必胜
- 稳赚
- 包中
- 投注建议
- 跟单

Prefer:

- 概率预测
- 数据分析
- 风险因素
- 不确定性
- 模型依据
- 赛前情报

## Required Final Commands

Run:

```powershell
git status
git branch --show-current
find . -maxdepth 3 -type f | sort
```

On Windows PowerShell, if POSIX `find` is unavailable, run an equivalent repository file listing and state that fallback in the final report.

## Final Response Acceptance

Final response must include:

- 当前仓库确认
- 当前分支
- 文件变更
- 架构摘要
- 后续分支开发建议
- `等待人工验收，未归档`
