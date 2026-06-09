"""initial backend schema

Revision ID: 20260609_0001
Revises:
Create Date: 2026-06-09 00:00:00
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260609_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_by", sa.String(length=64), nullable=True),
        sa.Column("status_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=False)

    op.create_table(
        "admin_action_logs",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("admin_user_id", sa.String(length=64), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "target_user_id",
            sa.String(length=64),
            sa.ForeignKey("users.id"),
            nullable=False,
        ),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "token_ledger",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=64), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("admin_user_id", sa.String(length=64), nullable=True),
        sa.Column("amount_tokens", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=64), nullable=False),
        sa.Column("related_entity_type", sa.String(length=64), nullable=False),
        sa.Column("related_entity_id", sa.String(length=64), nullable=False),
        sa.Column("idempotency_key", sa.String(length=255), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("idempotency_key"),
    )
    op.create_index("ix_token_ledger_user_id", "token_ledger", ["user_id"], unique=False)

    op.create_table(
        "ai_usage_logs",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=64), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("usage_type", sa.String(length=64), nullable=False),
        sa.Column("model", sa.String(length=128), nullable=False),
        sa.Column("model_version", sa.String(length=128), nullable=False),
        sa.Column("prompt_tokens", sa.Integer(), nullable=False),
        sa.Column("completion_tokens", sa.Integer(), nullable=False),
        sa.Column("embedding_tokens", sa.Integer(), nullable=False),
        sa.Column("total_provider_tokens", sa.Integer(), nullable=False),
        sa.Column("estimated_cost", sa.Numeric(12, 6), nullable=False),
        sa.Column("internal_tokens_charged", sa.Integer(), nullable=False),
        sa.Column("token_ledger_id", sa.String(length=64), nullable=True),
        sa.Column("related_entity_type", sa.String(length=64), nullable=False),
        sa.Column("related_entity_id", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_ai_usage_logs_user_id", "ai_usage_logs", ["user_id"], unique=False)

    op.create_table(
        "teams",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("code", sa.String(length=16), nullable=False),
        sa.Column("confederation", sa.String(length=64), nullable=False),
        sa.Column("coach_name", sa.String(length=255), nullable=True),
        sa.Column("group_code", sa.String(length=8), nullable=True),
        sa.Column("flag_url", sa.Text(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("code"),
    )

    op.create_table(
        "players",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("team_id", sa.String(length=64), sa.ForeignKey("teams.id"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("position", sa.String(length=16), nullable=False),
        sa.Column("shirt_number", sa.Integer(), nullable=True),
        sa.Column("availability_status", sa.String(length=32), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_players_team_id", "players", ["team_id"], unique=False)

    op.create_table(
        "fixtures",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("external_fixture_id", sa.String(length=128), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("stage", sa.String(length=64), nullable=False),
        sa.Column("group_code", sa.String(length=8), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
    )

    op.create_table(
        "venues",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("city", sa.String(length=128), nullable=False),
        sa.Column("country", sa.String(length=128), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=True),
        sa.Column("timezone", sa.String(length=64), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
    )

    op.create_table(
        "matches",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("fixture_id", sa.String(length=64), sa.ForeignKey("fixtures.id"), nullable=True),
        sa.Column("home_team_id", sa.String(length=64), sa.ForeignKey("teams.id"), nullable=False),
        sa.Column("away_team_id", sa.String(length=64), sa.ForeignKey("teams.id"), nullable=False),
        sa.Column("venue_id", sa.String(length=64), sa.ForeignKey("venues.id"), nullable=False),
        sa.Column("stage", sa.String(length=64), nullable=False),
        sa.Column("group_code", sa.String(length=8), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("kickoff_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("home_score", sa.Integer(), nullable=True),
        sa.Column("away_score", sa.Integer(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
    )

    op.create_table(
        "weather",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("match_id", sa.String(length=64), sa.ForeignKey("matches.id"), nullable=False),
        sa.Column("venue_id", sa.String(length=64), sa.ForeignKey("venues.id"), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("observed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("temperature_c", sa.Numeric(5, 2), nullable=False),
        sa.Column("humidity_pct", sa.Integer(), nullable=False),
        sa.Column("wind_kph", sa.Numeric(6, 2), nullable=False),
        sa.Column("condition", sa.String(length=128), nullable=False),
    )

    op.create_table(
        "team_match_stats",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("match_id", sa.String(length=64), sa.ForeignKey("matches.id"), nullable=False),
        sa.Column("team_id", sa.String(length=64), sa.ForeignKey("teams.id"), nullable=False),
        sa.Column("xg", sa.Numeric(6, 3), nullable=False),
        sa.Column("xga", sa.Numeric(6, 3), nullable=False),
        sa.Column("shots", sa.Integer(), nullable=False),
        sa.Column("shots_on_target", sa.Integer(), nullable=False),
        sa.Column("possession_pct", sa.Numeric(5, 2), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
    )

    op.create_table(
        "player_match_stats",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("match_id", sa.String(length=64), sa.ForeignKey("matches.id"), nullable=False),
        sa.Column("player_id", sa.String(length=64), sa.ForeignKey("players.id"), nullable=False),
        sa.Column("team_id", sa.String(length=64), sa.ForeignKey("teams.id"), nullable=False),
        sa.Column("minutes", sa.Integer(), nullable=False),
        sa.Column("goals", sa.Integer(), nullable=False),
        sa.Column("assists", sa.Integer(), nullable=False),
        sa.Column("xg", sa.Numeric(6, 3), nullable=False),
        sa.Column("xa", sa.Numeric(6, 3), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
    )

    op.create_table(
        "injuries",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("player_id", sa.String(length=64), sa.ForeignKey("players.id"), nullable=False),
        sa.Column("team_id", sa.String(length=64), sa.ForeignKey("teams.id"), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("reported_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expected_return_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "suspensions",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("player_id", sa.String(length=64), sa.ForeignKey("players.id"), nullable=False),
        sa.Column("team_id", sa.String(length=64), sa.ForeignKey("teams.id"), nullable=False),
        sa.Column("match_id", sa.String(length=64), sa.ForeignKey("matches.id"), nullable=True),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
    )

    op.create_table(
        "rankings",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("team_id", sa.String(length=64), sa.ForeignKey("teams.id"), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("points", sa.Numeric(8, 2), nullable=False),
        sa.Column("captured_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "odds",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("match_id", sa.String(length=64), sa.ForeignKey("matches.id"), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("market", sa.String(length=64), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("captured_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "documents",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("source_type", sa.String(length=64), nullable=False),
        sa.Column("source_name", sa.String(length=255), nullable=False),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("language", sa.String(length=32), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ingested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("checksum", sa.String(length=128), nullable=False),
        sa.Column("raw_content_uri", sa.Text(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False),
    )

    op.create_table(
        "document_chunks",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column(
            "document_id",
            sa.String(length=64),
            sa.ForeignKey("documents.id"),
            nullable=False,
        ),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("embedding_ref", sa.String(length=255), nullable=True),
        sa.Column("token_count", sa.Integer(), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
    )

    op.create_table(
        "rag_queries",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=64), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("context", sa.JSON(), nullable=False),
        sa.Column("retrieval_config", sa.JSON(), nullable=False),
        sa.Column("citation_chunk_ids", sa.JSON(), nullable=False),
        sa.Column("confidence", sa.Numeric(4, 3), nullable=False),
        sa.Column("ai_usage_log_id", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "predictions",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=64), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("prediction_type", sa.String(length=64), nullable=False),
        sa.Column("match_id", sa.String(length=64), sa.ForeignKey("matches.id"), nullable=True),
        sa.Column("team_ids", sa.JSON(), nullable=False),
        sa.Column("input_snapshot", sa.JSON(), nullable=False),
        sa.Column("result", sa.JSON(), nullable=False),
        sa.Column("model_version", sa.String(length=128), nullable=False),
        sa.Column("ai_usage_log_id", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "reports",
        sa.Column("id", sa.String(length=64), primary_key=True),
        sa.Column("user_id", sa.String(length=64), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("report_type", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("context", sa.JSON(), nullable=False),
        sa.Column("format", sa.String(length=32), nullable=False),
        sa.Column("language", sa.String(length=32), nullable=False),
        sa.Column("output_uri", sa.Text(), nullable=True),
        sa.Column("citation_chunk_ids", sa.JSON(), nullable=False),
        sa.Column("prediction_ids", sa.JSON(), nullable=False),
        sa.Column("model_versions", sa.JSON(), nullable=False),
        sa.Column("ai_usage_log_id", sa.String(length=64), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    for table_name in [
        "reports",
        "predictions",
        "rag_queries",
        "document_chunks",
        "documents",
        "odds",
        "rankings",
        "suspensions",
        "injuries",
        "player_match_stats",
        "team_match_stats",
        "weather",
        "matches",
        "venues",
        "fixtures",
        "players",
        "teams",
        "ai_usage_logs",
        "token_ledger",
        "admin_action_logs",
        "users",
    ]:
        op.drop_table(table_name)
