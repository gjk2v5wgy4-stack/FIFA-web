# AGENTS.md

## 项目

本项目是单一 Git 仓库 monorepo 项目。

项目名称：
worldcup-ai-prediction

产品定位：
一个需要授权访问的世界杯 AI/RAG 足球数据预测网页系统。

本产品不是普通聊天机器人。
它是一个足球数据智能平台，包含：
- 前端 Web 应用
- FastAPI 后端
- RAG 向量检索
- 足球预测引擎
- 管理员审批
- token 配额计量
- 报告系统
- QA
- DevOps

## 仓库规则

本项目必须保持为一个 Git 仓库。

不要创建独立仓库。
不要为前端、后端、RAG、预测、管理端、QA 或 DevOps 创建独立项目。
不要在任何子目录中执行 `git init`。
不要创建 Git submodule。
不要把兄弟目录作为独立项目创建。

所有模块都必须位于当前仓库内：

apps/web
apps/api
packages/shared
packages/rag-core
packages/football-models
docs
infra

## 分支规则

每个看板或模块都必须在同一个仓库内的 feature 分支上开发。

分支列表：

- feature/00-architecture-contracts
- feature/01-frontend-ui
- feature/02-backend-api
- feature/03-rag-vector-pipeline
- feature/04-prediction-engine
- feature/05-admin-token-access
- feature/06-qa-integration
- feature/07-devops-deployment

Codex 线程可以使用 worktree，但该 worktree 必须指向当前同一个仓库中的分支。
worktree 只允许作为同一 Git 仓库的隔离工作目录使用。

## main 分支规则

`main` 必须保持稳定。

不要把自己的 feature 分支合并到 `main`。
不要 rebase `main`。
不要 force push。
不要删除分支。
不要删除 worktree。
不要自动归档或关闭任务。

只有人工项目负责人可以批准：
- 合并
- 归档
- 删除分支
- 清理 worktree

## MVP 访问模型

本 MVP 不实现 Stripe、订阅、checkout、公共充值或自助付费套餐。

访问模型：

1. 用户注册账号。
2. 账号默认状态为 `pending_approval`。
3. 管理员审批用户。
4. 管理员发放初始免费 token 配额。
5. 用户只有在审批通过后，才可以使用 AI/RAG/预测/报告 API。
6. 每次 API 请求都必须计量。
7. 用户使用 token 后，从 token 余额中扣减。
8. token 余额较低时，前端必须提示用户联系管理员。
9. 管理员手动发放或调整 token。

必需的用户状态：
- pending_approval
- approved
- rejected
- suspended

必需的管理员操作：
- approve_user
- reject_user
- suspend_user
- reactivate_user
- grant_tokens
- adjust_tokens
- revoke_tokens

所有 token 变化都必须记录在 `token_ledger` 中。
不得在没有 ledger 记录的情况下直接覆盖用户 token 余额。

## 安全规则

不要实现赌博或体育投注功能。
不要承诺预测结果一定命中。
不要使用以下措辞：
- 必胜
- 稳赚
- 包中
- 投注建议
- 跟单

应使用以下措辞：
- 概率预测
- 数据分析
- 风险因素
- 不确定性
- 模型依据
- 赛前情报

## 完成规则

任务完成后不要自动归档。

最终回复必须包含：
1. 完成摘要
2. 分支名称
3. 变更文件
4. 运行命令
5. 测试结果
6. 已知问题
7. 合并准备状态
8. 人工验证步骤
9. 精确句子：等待人工验收，未归档
