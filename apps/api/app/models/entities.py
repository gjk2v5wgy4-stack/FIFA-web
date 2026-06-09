from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(UTC)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text)
    display_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="user")
    status: Mapped[str] = mapped_column(String(32), default="pending_approval")
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    ledgers: Mapped[list["TokenLedger"]] = relationship(back_populates="user")


class AdminActionLog(Base):
    __tablename__ = "admin_action_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    admin_user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"))
    target_user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(64))
    reason: Mapped[str] = mapped_column(Text)
    metadata_json: Mapped[dict[str, object]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class TokenLedger(Base):
    __tablename__ = "token_ledger"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"), index=True)
    admin_user_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    amount_tokens: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str] = mapped_column(String(64))
    related_entity_type: Mapped[str] = mapped_column(String(64))
    related_entity_id: Mapped[str] = mapped_column(String(64))
    idempotency_key: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    metadata_json: Mapped[dict[str, object]] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="ledgers")


class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"), index=True)
    usage_type: Mapped[str] = mapped_column(String(64))
    model: Mapped[str] = mapped_column(String(128))
    model_version: Mapped[str] = mapped_column(String(128))
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0)
    embedding_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_provider_tokens: Mapped[int] = mapped_column(Integer, default=0)
    estimated_cost: Mapped[Decimal] = mapped_column(Numeric(12, 6), default=Decimal("0"))
    internal_tokens_charged: Mapped[int] = mapped_column(Integer, default=0)
    token_ledger_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    related_entity_type: Mapped[str] = mapped_column(String(64))
    related_entity_id: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Team(TimestampMixin, Base):
    __tablename__ = "teams"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    code: Mapped[str] = mapped_column(String(16), unique=True)
    confederation: Mapped[str] = mapped_column(String(64))
    coach_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    group_code: Mapped[str | None] = mapped_column(String(8), nullable=True)
    flag_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict[str, object]] = mapped_column("metadata", JSON, default=dict)

    players: Mapped[list["Player"]] = relationship(back_populates="team")


class Player(TimestampMixin, Base):
    __tablename__ = "players"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    team_id: Mapped[str] = mapped_column(String(64), ForeignKey("teams.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    position: Mapped[str] = mapped_column(String(16))
    shirt_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    availability_status: Mapped[str] = mapped_column(String(32), default="available")
    metadata_json: Mapped[dict[str, object]] = mapped_column("metadata", JSON, default=dict)

    team: Mapped[Team] = relationship(back_populates="players")


class Fixture(Base):
    __tablename__ = "fixtures"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    external_fixture_id: Mapped[str] = mapped_column(String(128))
    provider: Mapped[str] = mapped_column(String(64))
    stage: Mapped[str] = mapped_column(String(64))
    group_code: Mapped[str | None] = mapped_column(String(8), nullable=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(32))
    metadata_json: Mapped[dict[str, object]] = mapped_column("metadata", JSON, default=dict)


class Venue(Base):
    __tablename__ = "venues"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(128))
    country: Mapped[str] = mapped_column(String(128))
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timezone: Mapped[str] = mapped_column(String(64))
    metadata_json: Mapped[dict[str, object]] = mapped_column("metadata", JSON, default=dict)


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    fixture_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("fixtures.id"),
        nullable=True,
    )
    home_team_id: Mapped[str] = mapped_column(String(64), ForeignKey("teams.id"))
    away_team_id: Mapped[str] = mapped_column(String(64), ForeignKey("teams.id"))
    venue_id: Mapped[str] = mapped_column(String(64), ForeignKey("venues.id"))
    stage: Mapped[str] = mapped_column(String(64))
    group_code: Mapped[str | None] = mapped_column(String(8), nullable=True)
    status: Mapped[str] = mapped_column(String(32))
    kickoff_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    home_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    away_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    metadata_json: Mapped[dict[str, object]] = mapped_column("metadata", JSON, default=dict)


class Weather(Base):
    __tablename__ = "weather"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    match_id: Mapped[str] = mapped_column(String(64), ForeignKey("matches.id"))
    venue_id: Mapped[str] = mapped_column(String(64), ForeignKey("venues.id"))
    provider: Mapped[str] = mapped_column(String(64))
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    temperature_c: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    humidity_pct: Mapped[int] = mapped_column(Integer)
    wind_kph: Mapped[Decimal] = mapped_column(Numeric(6, 2))
    condition: Mapped[str] = mapped_column(String(128))


class TeamMatchStat(Base):
    __tablename__ = "team_match_stats"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    match_id: Mapped[str] = mapped_column(String(64), ForeignKey("matches.id"))
    team_id: Mapped[str] = mapped_column(String(64), ForeignKey("teams.id"))
    xg: Mapped[Decimal] = mapped_column(Numeric(6, 3))
    xga: Mapped[Decimal] = mapped_column(Numeric(6, 3))
    shots: Mapped[int] = mapped_column(Integer)
    shots_on_target: Mapped[int] = mapped_column(Integer)
    possession_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    metadata_json: Mapped[dict[str, object]] = mapped_column("metadata", JSON, default=dict)


class PlayerMatchStat(Base):
    __tablename__ = "player_match_stats"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    match_id: Mapped[str] = mapped_column(String(64), ForeignKey("matches.id"))
    player_id: Mapped[str] = mapped_column(String(64), ForeignKey("players.id"))
    team_id: Mapped[str] = mapped_column(String(64), ForeignKey("teams.id"))
    minutes: Mapped[int] = mapped_column(Integer)
    goals: Mapped[int] = mapped_column(Integer, default=0)
    assists: Mapped[int] = mapped_column(Integer, default=0)
    xg: Mapped[Decimal] = mapped_column(Numeric(6, 3), default=Decimal("0"))
    xa: Mapped[Decimal] = mapped_column(Numeric(6, 3), default=Decimal("0"))
    metadata_json: Mapped[dict[str, object]] = mapped_column("metadata", JSON, default=dict)


class Injury(Base):
    __tablename__ = "injuries"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    player_id: Mapped[str] = mapped_column(String(64), ForeignKey("players.id"))
    team_id: Mapped[str] = mapped_column(String(64), ForeignKey("teams.id"))
    status: Mapped[str] = mapped_column(String(32))
    description: Mapped[str] = mapped_column(Text)
    reported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    expected_return_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )


class Suspension(Base):
    __tablename__ = "suspensions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    player_id: Mapped[str] = mapped_column(String(64), ForeignKey("players.id"))
    team_id: Mapped[str] = mapped_column(String(64), ForeignKey("teams.id"))
    match_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("matches.id"),
        nullable=True,
    )
    reason: Mapped[str] = mapped_column(Text)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(32))


class Ranking(Base):
    __tablename__ = "rankings"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    team_id: Mapped[str] = mapped_column(String(64), ForeignKey("teams.id"))
    provider: Mapped[str] = mapped_column(String(64))
    rank: Mapped[int] = mapped_column(Integer)
    points: Mapped[Decimal] = mapped_column(Numeric(8, 2))
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Odds(Base):
    __tablename__ = "odds"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    match_id: Mapped[str] = mapped_column(String(64), ForeignKey("matches.id"))
    provider: Mapped[str] = mapped_column(String(64))
    market: Mapped[str] = mapped_column(String(64))
    payload: Mapped[dict[str, object]] = mapped_column(JSON, default=dict)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_type: Mapped[str] = mapped_column(String(64))
    source_name: Mapped[str] = mapped_column(String(255))
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    language: Mapped[str] = mapped_column(String(32))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    checksum: Mapped[str] = mapped_column(String(128))
    raw_content_uri: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[dict[str, object]] = mapped_column("metadata", JSON, default=dict)


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    document_id: Mapped[str] = mapped_column(String(64), ForeignKey("documents.id"))
    chunk_index: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    embedding_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    token_count: Mapped[int] = mapped_column(Integer, default=0)
    metadata_json: Mapped[dict[str, object]] = mapped_column("metadata", JSON, default=dict)


class RagQuery(Base):
    __tablename__ = "rag_queries"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"))
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    context: Mapped[dict[str, object]] = mapped_column(JSON, default=dict)
    retrieval_config: Mapped[dict[str, object]] = mapped_column(JSON, default=dict)
    citation_chunk_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    confidence: Mapped[Decimal] = mapped_column(Numeric(4, 3))
    ai_usage_log_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str | None] = mapped_column(String(64), ForeignKey("users.id"), nullable=True)
    prediction_type: Mapped[str] = mapped_column(String(64))
    match_id: Mapped[str | None] = mapped_column(
        String(64),
        ForeignKey("matches.id"),
        nullable=True,
    )
    team_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    input_snapshot: Mapped[dict[str, object]] = mapped_column(JSON, default=dict)
    result: Mapped[dict[str, object]] = mapped_column(JSON, default=dict)
    model_version: Mapped[str] = mapped_column(String(128))
    ai_usage_log_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Report(TimestampMixin, Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64), ForeignKey("users.id"))
    report_type: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32))
    context: Mapped[dict[str, object]] = mapped_column(JSON, default=dict)
    format: Mapped[str] = mapped_column(String(32))
    language: Mapped[str] = mapped_column(String(32), default="zh-CN")
    output_uri: Mapped[str | None] = mapped_column(Text, nullable=True)
    citation_chunk_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    prediction_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    model_versions: Mapped[list[str]] = mapped_column(JSON, default=list)
    ai_usage_log_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
