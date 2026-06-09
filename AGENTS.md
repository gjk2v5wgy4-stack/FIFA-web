# AGENTS.md

## Project

This is a single-repository monorepo project.

Project name:
worldcup-ai-prediction

Product:
A paid-access World Cup AI/RAG football data prediction web system.

The product is not a simple chatbot.
It is a football data intelligence platform with:
- Frontend web app
- FastAPI backend
- RAG vector retrieval
- Football prediction engine
- Admin approval
- Token quota metering
- Reports
- QA
- DevOps

## Repository Rule

This project must stay as one Git repository.

Do not create separate repositories.
Do not create separate projects for frontend, backend, RAG, prediction, admin, QA, or DevOps.
Do not run git init inside subdirectories.
Do not create Git submodules.
Do not create sibling project folders as independent projects.

All modules must live inside this repository:

apps/web
apps/api
packages/shared
packages/rag-core
packages/football-models
docs
infra

## Branch Rule

Each board/module must be developed on a feature branch inside the same repository.

Branches:

- feature/00-architecture-contracts
- feature/01-frontend-ui
- feature/02-backend-api
- feature/03-rag-vector-pipeline
- feature/04-prediction-engine
- feature/05-admin-token-access
- feature/06-qa-integration
- feature/07-devops-deployment

A Codex thread may use a worktree, but the worktree must point to a branch of this same repository.
A worktree is allowed only as an isolated working directory for the same Git repo.

## Main Branch Rule

main must remain stable.

Do not merge your feature branch into main.
Do not rebase main.
Do not force push.
Do not delete branches.
Do not delete worktrees.
Do not archive or close the task automatically.

Only the human project owner may approve:
- merge
- archive
- branch deletion
- worktree cleanup

## MVP Access Model

This MVP does not implement Stripe, subscriptions, checkout, public recharge, or self-service paid plans.

Access model:

1. User registers an account.
2. Account status is pending_approval by default.
3. Admin approves the user.
4. Admin grants initial free token quota.
5. User can use AI/RAG/prediction/report APIs only after approval.
6. Each API request is metered.
7. Token usage is deducted from user token balance.
8. Low token balance triggers a reminder to contact admin.
9. Admin manually grants or adjusts tokens.

Required user statuses:
- pending_approval
- approved
- rejected
- suspended

Required admin actions:
- approve_user
- reject_user
- suspend_user
- reactivate_user
- grant_tokens
- adjust_tokens
- revoke_tokens

All token changes must be recorded in token_ledger.
Never overwrite token balance without a ledger entry.

## Safety Rules

Do not implement gambling or betting functionality.
Do not promise guaranteed predictions.
Do not use wording such as:
- 必胜
- 稳赚
- 包中
- 投注建议
- 跟单

Use wording such as:
- 概率预测
- 数据分析
- 风险因素
- 不确定性
- 模型依据
- 赛前情报

## Completion Rule

When a task is complete, do not auto-archive.

The final response must include:
1. Summary
2. Branch name
3. Files changed
4. Commands run
5. Test results
6. Known issues
7. Merge readiness
8. Manual verification steps
9. The exact sentence: 等待人工验收，未归档
