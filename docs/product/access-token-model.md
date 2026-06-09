# Access Token Model

## Purpose

The MVP uses admin-controlled account approval and internal token quota. It does not implement Stripe, subscriptions, checkout, public recharge, or self-service paid plans.

## Account Flow

1. User registers an account.
2. Account status is `pending_approval` by default.
3. Admin reviews the user.
4. Admin approves or rejects the user.
5. Admin grants initial free token quota after approval.
6. User can use AI/RAG/prediction/report APIs only after approval.
7. Each protected API request is metered.
8. Token usage is deducted from user token balance after successful usage.
9. Low token balance triggers a reminder to contact admin.
10. Admin manually grants, adjusts, or revokes tokens.

## User Statuses

| Status | Meaning | Protected API access |
| --- | --- | --- |
| `pending_approval` | Registered, waiting for admin review | No |
| `approved` | Approved by admin | Yes, if token balance is sufficient |
| `rejected` | Rejected by admin | No |
| `suspended` | Temporarily blocked by admin | No |

## Admin Actions

Required admin actions:

- `approve_user`
- `reject_user`
- `suspend_user`
- `reactivate_user`
- `grant_tokens`
- `adjust_tokens`
- `revoke_tokens`

Each admin action must create an audit record in `admin_action_logs`.

## Token Ledger Rules

All token changes must be recorded in `token_ledger`.

Never overwrite token balance without a ledger entry.

Ledger amounts:

- Positive: grant or positive adjustment.
- Negative: API usage, revocation, or negative adjustment.

Required ledger fields:

- User ID.
- Optional admin user ID.
- Amount tokens.
- Reason.
- Related entity type.
- Related entity ID.
- Idempotency key when retryable.
- Created timestamp.

## Provider Token Usage

Product UI token quota is internal. Provider usage must still be recorded separately:

- `prompt_tokens`
- `completion_tokens`
- `embedding_tokens`
- `total_provider_tokens`
- `estimated_cost`

Internal quota deduction may use:

- Actual `total_provider_tokens`
- A configured conversion rule
- A fixed minimum token charge per API class

## Low Balance Behavior

The backend returns:

- `remainingTokens`
- `lowBalance`
- `lowBalanceThreshold`

When `lowBalance` is true, the frontend must remind the user to contact admin. It must not show a checkout, recharge, or subscription flow in the MVP.

## Forbidden MVP Flows

- Stripe integration.
- Checkout page.
- Public self-service recharge.
- Subscription plan.
- Automatic paid upgrade.
- Gambling or betting flow.
- Guaranteed prediction wording.
