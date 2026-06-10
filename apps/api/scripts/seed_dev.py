import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))


def main() -> None:
    from app.db.base import Base
    from app.db.seed import seed_database
    from app.db.session import SessionLocal, get_engine

    Base.metadata.create_all(bind=get_engine())
    with SessionLocal() as session:
        seed_database(session)
    print("seed data ensured")


if __name__ == "__main__":
    main()
