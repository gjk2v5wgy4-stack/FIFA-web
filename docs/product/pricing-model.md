# Access And Token Quota Model

## Purpose

This document replaces the earlier pricing/payment concept for the MVP. The file path remains `docs/product/pricing-model.md` for continuity, but the MVP model is admin-controlled access and internal token quota.

Related documents:

- [Product scope](product-scope.md)
- [API contract](../api/api-contract.md)
- [Data model](../api/data-model.md)

## MVP Access Model

This project no longer uses self-service payment, Stripe checkout, subscriptions, or paid membership plans in the MVP.

The simplified access model is:

1. User registers an account.
2. The account status is `pending_approval` by default.
3. Admin reviews and approves the user.
4. Admin grants an initial free token quota.
5. User can access AI/RAG/prediction APIs only after approval.
6. Each protected API request is metered.
7. Actual provider usage tokens must be recorded.
8. Internal token balance is deducted after successful API usage.
9. When token balance is low, the frontend must remind the user to contact the admin.
10. Admin can manually top up, adjust, suspend, or revoke access.

## Explicit MVP Non-Goals

- No Stripe integration in MVP.
- No checkout page in MVP.
- No public self-service recharge in MVP.
- No subscription plans in MVP.
- No paid membership plans in MVP.
- No automatic paid upgrade flow in MVP.
- Token top-up is admin-controlled only.

## Terminology

- `token` in the product UI means internal usage quota.
- Provider token usage remains separate from internal quota and must be logged in `ai_usage_logs`.
- Internal quota deduction may use actual `total_provider_tokens` or a configured conversion rule.

Provider usage fields:

- `prompt_tokens`
- `completion_tokens`
- `embedding_tokens`
- `total_provider_tokens`
- `estimated_cost`

## Account Statuses

| Status | Meaning | Protected API access |
| --- | --- | --- |
| `pending_approval` | User registered and awaits admin review | No |
| `approved` | Admin approved the user | Yes, if token balance is sufficient |
| `rejected` | Admin rejected the account | No |
| `suspended` | Admin temporarily revoked access | No |

## Admin Actions

Required auditable admin actions:

- `approve_user`
- `reject_user`
- `suspend_user`
- `reactivate_user`
- `grant_tokens`
- `adjust_tokens`
- `revoke_tokens`

Each admin action must record:

- Admin user ID.
- Target user ID.
- Action type.
- Reason.
- Metadata.
- Created timestamp.

## Token Ledger Principles

`token_ledger` is the only authoritative source for internal token quota movement and balance. The current balance is calculated from ledger entries.

Token entries must include:

- Target user.
- Optional admin actor.
- Amount, positive for grants and adjustments, negative for usage or revocation.
- Reason.
- Related entity, such as RAG query, prediction, simulation, report, or admin action.
- Idempotency key when a request may be retried.
- Created timestamp.

No implementation may store an independently editable token balance as an authority.

## Suggested Token Events

| Event | Ledger direction | Example reason |
| --- | --- | --- |
| Initial admin grant | Positive | `admin_initial_grant` |
| Manual admin top-up | Positive | `admin_grant` |
| Manual admin adjustment | Positive or negative | `admin_adjustment` |
| Admin revocation | Negative | `admin_revoke` |
| RAG analyst question | Negative | `rag_query` |
| Match prediction | Negative | `match_prediction` |
| What-if prediction | Negative | `what_if_prediction` |
| Group simulation | Negative | `group_simulation` |
| Report generation | Negative | `report_generation` |

## Protected API Flow

1. Backend authenticates the user.
2. Backend checks `users.status`.
3. Backend blocks users who are not `approved`.
4. Backend checks estimated internal token requirement when available.
5. Backend performs the AI/RAG/prediction/report action.
6. Backend records provider token usage in `ai_usage_logs`.
7. Backend deducts internal quota through `token_ledger`.
8. Backend returns remaining tokens and low-balance state to the frontend.

If an API action fails before producing usable output, token deduction should not occur unless the backend explicitly documents a partial-charge policy.

## Frontend Display Rules

The frontend must:

- Show account status.
- Show internal token balance from backend APIs.
- Show low-balance reminders that tell the user to contact the admin.
- Hide or disable protected AI/RAG/prediction/report actions for unapproved users.
- Avoid checkout, public recharge, subscription, paid upgrade, or payment provider UI in the MVP.
- Avoid wording that implies guaranteed results, betting advice, or certain profit.

## Future Commercial Decisions

Future paid access can be discussed after MVP validation, but it must not be implemented in the MVP. Any future monetization design must update this document, [API contract](../api/api-contract.md), and [Data model](../api/data-model.md) before code changes.
