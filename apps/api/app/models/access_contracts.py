from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.services.access_control import AccessControlService
    from app.services.admin_user import AdminUserService
    from app.services.token_metering import TokenMeteringService
    from app.services.token_quota import TokenQuotaService
    from app.store import InMemoryStore


class UserStatus(StrEnum):
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class UserRole(StrEnum):
    USER = "user"
    ADMIN = "admin"
    ANALYST = "analyst"


class FeatureType(StrEnum):
    RAG_QUERY = "rag_query"
    MATCH_PREDICTION = "match_prediction"
    WHAT_IF_PREDICTION = "what_if_prediction"
    GROUP_SIMULATION = "group_simulation"
    REPORT_GENERATION = "report_generation"


@dataclass
class UserRecord:
    id: str
    email: str
    display_name: str
    role: UserRole
    status: UserStatus
    created_at: datetime
    updated_at: datetime
    password_hash: str = "not-set"
    approved_at: datetime | None = None
    approved_by: str | None = None
    status_reason: str | None = None
    low_balance_threshold: int = 10_000


@dataclass
class AdminActionRecord:
    id: str
    admin_user_id: str
    target_user_id: str
    action: str
    reason: str
    metadata: dict[str, Any]
    created_at: datetime


@dataclass
class TokenLedgerEntry:
    id: str
    user_id: str
    admin_user_id: str | None
    amount_tokens: int
    reason: str
    related_entity_type: str
    related_entity_id: str
    idempotency_key: str | None
    metadata: dict[str, Any]
    created_at: datetime


@dataclass
class ApiUsageLog:
    id: str
    user_id: str
    feature_type: FeatureType
    usage_type: str
    model: str
    model_version: str | None
    request_id: str
    prompt_tokens: int
    completion_tokens: int
    embedding_tokens: int
    total_provider_tokens: int
    estimated_cost: float
    internal_tokens_charged: int
    token_ledger_id: str
    related_entity_type: str
    related_entity_id: str
    created_at: datetime


@dataclass
class AccessStatus:
    user_id: str
    status: UserStatus
    can_use_protected_apis: bool
    message: str
    updated_at: datetime


@dataclass
class FeatureAccess:
    allowed: bool
    feature_type: FeatureType
    estimated_cost: int
    remaining_tokens: int
    lowTokenWarning: bool
    error_code: str | None = None


@dataclass
class ApprovalResult:
    user_id: str
    status: UserStatus
    admin_action_id: str
    token_ledger_id: str | None
    token_balance: int


@dataclass
class StatusChangeResult:
    user_id: str
    status: UserStatus
    admin_action_id: str


@dataclass
class TokenOperationResult:
    user_id: str
    admin_action_id: str
    token_ledger_id: str
    amount_tokens: int
    token_balance: int


@dataclass
class TokenConsumptionResult:
    user_id: str
    token_ledger_id: str
    api_usage_log_id: str
    tokens_charged: int
    remaining_tokens: int
    lowTokenWarning: bool
    duplicate: bool = False


@dataclass
class RagProviderUsage:
    model: str
    prompt_tokens: int
    completion_tokens: int
    embedding_tokens: int
    total_provider_tokens: int
    estimated_cost: float
    model_version: str | None = None


@dataclass
class RagServiceResult:
    rag_query_id: str
    answer: str
    confidence: float
    citations: list[dict[str, Any]]
    usage: RagProviderUsage


@dataclass
class PaginatedUsers:
    users: list[UserRecord]
    next_cursor: str | None
    has_more: bool


@dataclass
class ServiceBundle:
    access: AccessControlService
    tokens: TokenQuotaService
    metering: TokenMeteringService
    admin_users: AdminUserService
    store: InMemoryStore = field(repr=False)
