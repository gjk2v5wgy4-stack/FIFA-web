from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import Match, Player, Team, TokenLedger, User, Venue


def seed_database(session: Session) -> None:
    if session.scalar(select(User).where(User.email == "admin@example.com")) is not None:
        return

    admin = User(
        id="user_admin",
        email="admin@example.com",
        password_hash=hash_password("Admin123!"),
        display_name="Admin",
        role="admin",
        status="approved",
        approved_at=datetime.now(UTC),
    )
    approved = User(
        id="user_approved",
        email="approved@example.com",
        password_hash=hash_password("Approved123!"),
        display_name="Approved User",
        role="user",
        status="approved",
        approved_at=datetime.now(UTC),
        approved_by=admin.id,
    )
    venue = Venue(
        id="venue_001",
        name="MetLife Stadium",
        city="East Rutherford",
        country="USA",
        capacity=82500,
        timezone="America/New_York",
    )
    usa = Team(
        id="team_usa",
        name="United States",
        code="USA",
        confederation="CONCACAF",
        group_code="A",
    )
    wal = Team(
        id="team_wal",
        name="Wales",
        code="WAL",
        confederation="UEFA",
        group_code="A",
    )
    player = Player(
        id="player_001",
        team_id=usa.id,
        name="Example Player",
        position="FW",
        shirt_number=9,
        availability_status="available",
    )
    match = Match(
        id="match_001",
        fixture_id=None,
        home_team_id=usa.id,
        away_team_id=wal.id,
        venue_id=venue.id,
        stage="group",
        group_code="A",
        status="scheduled",
        kickoff_at=datetime(2026, 6, 12, 20, 0, tzinfo=UTC),
    )
    ledger = TokenLedger(
        id="tl_seed_approved",
        user_id=approved.id,
        admin_user_id=admin.id,
        amount_tokens=100_000,
        reason="admin_initial_grant",
        related_entity_type="seed",
        related_entity_id="seed_approved_user",
        metadata_json={"source": "seed"},
    )
    session.add_all([admin, approved, venue, usa, wal, player, match, ledger])
    session.commit()

