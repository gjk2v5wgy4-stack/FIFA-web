from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import ApiException
from app.core.ids import new_id
from app.models import AIUsageLog, TokenLedger, User


@dataclass(frozen=True)
class UsageCharge:
    tokens_charged: int
    remaining_tokens: int
    low_balance: bool
    low_token_warning: bool
    token_ledger_id: str
    ai_usage_log_id: str

    def to_contract(self) -> dict[str, object]:
        return {
            "tokensCharged": self.tokens_charged,
            "remainingTokens": self.remaining_tokens,
            "lowBalance": self.low_balance,
            "lowTokenWarning": self.low_token_warning,
        }


class TokenQuotaService:
    """Thread 2 scaffold for quota metering.

    Thread 5 will replace this with idempotency, low-balance notification, and full audit behavior.
    """

    def get_balance(self, session: Session, user_id: str) -> int:
        value = session.scalar(
            select(func.coalesce(func.sum(TokenLedger.amount_tokens), 0)).where(
                TokenLedger.user_id == user_id
            )
        )
        return int(value or 0)

    def ledger_entries(self, session: Session, user_id: str) -> list[TokenLedger]:
        return list(
            session.scalars(
                select(TokenLedger)
                .where(TokenLedger.user_id == user_id)
                .order_by(TokenLedger.created_at.desc())
            )
        )

    def create_admin_ledger_entry(
        self,
        session: Session,
        user_id: str,
        admin_user_id: str,
        amount_tokens: int,
        reason: str,
        related_entity_type: str,
        related_entity_id: str,
    ) -> TokenLedger:
        entry = TokenLedger(
            id=new_id("tl"),
            user_id=user_id,
            admin_user_id=admin_user_id,
            amount_tokens=amount_tokens,
            reason=reason,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            metadata_json={"source": "admin_service_stub"},
        )
        session.add(entry)
        return entry

    def charge_for_usage(
        self,
        session: Session,
        user: User,
        usage_type: str,
        related_entity_type: str,
        related_entity_id: str,
        tokens_required: int,
        model_version: str = "stub-0.1.0",
    ) -> UsageCharge:
        balance = self.get_balance(session, user.id)
        if balance < tokens_required:
            raise ApiException(
                "INSUFFICIENT_TOKENS",
                "Not enough tokens for this action.",
                402,
                {"requiredTokens": tokens_required, "availableTokens": balance},
            )

        ledger = TokenLedger(
            id=new_id("tl"),
            user_id=user.id,
            admin_user_id=None,
            amount_tokens=-tokens_required,
            reason=usage_type,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            metadata_json={"source": "token_quota_service_stub"},
        )
        usage_log = AIUsageLog(
            id=new_id("usage"),
            user_id=user.id,
            usage_type=usage_type,
            model="stub",
            model_version=model_version,
            prompt_tokens=tokens_required,
            completion_tokens=0,
            embedding_tokens=0,
            total_provider_tokens=tokens_required,
            estimated_cost=Decimal("0"),
            internal_tokens_charged=tokens_required,
            token_ledger_id=ledger.id,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
        )
        session.add_all([ledger, usage_log])
        session.flush()
        remaining = balance - tokens_required
        low = remaining < get_settings().low_balance_threshold
        return UsageCharge(
            tokens_charged=tokens_required,
            remaining_tokens=remaining,
            low_balance=low,
            low_token_warning=low,
            token_ledger_id=ledger.id,
            ai_usage_log_id=usage_log.id,
        )


token_quota_service = TokenQuotaService()

