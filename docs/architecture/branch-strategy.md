# Branch Strategy

## Rule

This project must remain one Git repository. All feature work happens on branches inside this same repository.

Do not:

- Create separate repositories.
- Create separate frontend/backend/RAG/prediction/admin/QA/DevOps projects.
- Run `git init` inside subdirectories.
- Use Git submodules.
- Create sibling folders as independent projects.
- Merge your own feature branch into `main`.
- Rebase `main`.
- Force push.
- Delete branches or worktrees.
- Auto-archive tasks.

Only the human project owner may approve merge, archive, branch deletion, or worktree cleanup.

## Main Branch

`main` must remain stable. Feature branches prepare changes and report results. They do not self-merge.

## Required Feature Branches

| Branch | Owner board | Main scope |
| --- | --- | --- |
| `feature/00-architecture-contracts` | Architecture | Monorepo structure, API contract, data model, branch rules |
| `feature/01-frontend-ui` | Frontend | Next.js UI, API client, responsive Chinese-first UX |
| `feature/02-backend-api` | Backend | FastAPI routes, auth, validation, PostgreSQL integration |
| `feature/03-rag-vector-pipeline` | RAG | Ingestion, chunking, embedding, vector search, citations |
| `feature/04-prediction-engine` | Prediction | Elo, xG/xGA, Poisson, Monte Carlo, What-if pure functions |
| `feature/05-admin-token-access` | Admin/access | Approval workflow, token ledger, usage metering |
| `feature/06-qa-integration` | QA | Acceptance, integration tests, contract verification |
| `feature/07-devops-deployment` | DevOps | Docker, env templates, PostgreSQL/Redis/vector DB setup |

## Worktree Policy

Codex may use a worktree for isolation, but the worktree must be for a branch of this same repository.

Allowed:

```text
same repo -> feature branch -> optional worktree
```

Forbidden:

```text
new repo
submodule
nested git init
independent sibling project
```

## Handoff Requirements

Every branch handoff must report:

- Branch name.
- Files changed.
- Commands run.
- Test results.
- Known issues.
- Merge readiness.
- Manual verification steps.
- Exact sentence: `等待人工验收，未归档`
