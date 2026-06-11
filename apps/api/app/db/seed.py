from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models import Match, Player, Team, TokenLedger, User, Venue

ADMIN123_TOKEN_GRANT = 2_000_000_000


def seed_database(session: Session) -> None:
    now = datetime.now(UTC)
    admin = session.scalar(select(User).where(User.email == "admin@example.com"))
    if admin is None:
        admin = User(
            id="user_admin",
            email="admin@example.com",
            password_hash=hash_password("Admin123!"),
            display_name="Admin",
            role="admin",
            status="approved",
            approved_at=now,
        )
        session.add(admin)

    admin123 = session.scalar(select(User).where(User.display_name == "admin123"))
    if admin123 is None:
        admin123 = User(
            id="user_admin123",
            email="admin123@local.invalid",
            password_hash=hash_password("admin123"),
            display_name="admin123",
            role="admin",
            status="approved",
            approved_at=now,
            approved_by=admin.id,
        )
        session.add(admin123)
    else:
        admin123.role = "admin"
        admin123.status = "approved"
        admin123.approved_at = admin123.approved_at or now
        admin123.approved_by = admin123.approved_by or admin.id
        if not verify_password("admin123", admin123.password_hash):
            admin123.password_hash = hash_password("admin123")

    approved = session.scalar(select(User).where(User.email == "approved@example.com"))
    if approved is None:
        approved = User(
            id="user_approved",
            email="approved@example.com",
            password_hash=hash_password("Approved123!"),
            display_name="Approved User",
            role="user",
            status="approved",
            approved_at=now,
            approved_by=admin.id,
        )
        session.add(approved)
    venue = session.get(Venue, "venue_001")
    if venue is None:
        venue = Venue(
            id="venue_001",
            name="MetLife Stadium",
            city="East Rutherford",
            country="USA",
            capacity=82500,
            timezone="America/New_York",
        )
        session.add(venue)

    usa = session.get(Team, "team_usa")
    if usa is None:
        usa = Team(
            id="team_usa",
            name="United States",
            code="USA",
            confederation="CONCACAF",
            group_code="A",
        )
        session.add(usa)

    par = session.get(Team, "team_par")
    if par is None:
        par = Team(
            id="team_par",
            name="Paraguay",
            code="PAR",
            confederation="CONMEBOL",
            group_code="D",
        )
        session.add(par)

    if session.get(Player, "player_001") is None:
        session.add(
            Player(
                id="player_001",
                team_id=usa.id,
                name="Example Player",
                position="FW",
                shirt_number=9,
                availability_status="available",
            )
        )

    if session.get(Match, "match_001") is None:
        session.add(
            Match(
                id="match_001",
                fixture_id=None,
                home_team_id=usa.id,
                away_team_id=par.id,
                venue_id=venue.id,
                stage="group",
                group_code="A",
                status="scheduled",
                kickoff_at=datetime(2026, 6, 12, 20, 0, tzinfo=UTC),
            )
        )
    ledger = session.get(TokenLedger, "tl_seed_approved")
    if ledger is None:
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
        session.add(ledger)

    admin123_ledger = session.get(TokenLedger, "tl_seed_admin123_unlimited")
    if admin123_ledger is None:
        admin123_ledger = TokenLedger(
            id="tl_seed_admin123_unlimited",
            user_id=admin123.id,
            admin_user_id=admin.id,
            amount_tokens=ADMIN123_TOKEN_GRANT,
            reason="admin_initial_grant",
            related_entity_type="seed",
            related_entity_id="seed_admin123",
            metadata_json={"source": "seed", "access": "site_admin_large_quota"},
        )
        session.add(admin123_ledger)

    session.commit()

