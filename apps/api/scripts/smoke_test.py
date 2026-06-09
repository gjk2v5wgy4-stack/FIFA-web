import os
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))


def main() -> None:
    with TemporaryDirectory() as tmp:
        db_path = Path(tmp) / "smoke.db"
        os.environ["DATABASE_URL"] = f"sqlite+pysqlite:///{db_path.as_posix()}"
        os.environ["SECRET_KEY"] = "smoke-test-secret"

        from fastapi.testclient import TestClient

        from app.core.config import get_settings
        from app.db.base import Base
        from app.db.seed import seed_database
        from app.db.session import SessionLocal, configure_database, get_engine
        from app.main import app

        get_settings.cache_clear()
        configure_database()
        Base.metadata.create_all(bind=get_engine())
        with SessionLocal() as session:
            seed_database(session)

        with TestClient(app) as client:
            health = client.get("/health")
            login = client.post(
                "/api/auth/login",
                json={"email": "approved@example.com", "password": "Approved123!"},
            )
            matches = client.get("/api/matches")

            if health.status_code != 200:
                raise SystemExit(f"health failed: {health.status_code} {health.text}")
            if login.status_code != 200:
                raise SystemExit(f"login failed: {login.status_code} {login.text}")
            if matches.status_code != 200:
                raise SystemExit(f"matches failed: {matches.status_code} {matches.text}")

        get_engine().dispose()
        print("backend smoke test passed")


if __name__ == "__main__":
    main()
