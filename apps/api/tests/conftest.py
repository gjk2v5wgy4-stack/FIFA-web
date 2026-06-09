from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    db_path = tmp_path / "api-test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+pysqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("SECRET_KEY", "test-secret-key")

    from app.core.config import get_settings
    from app.db.base import Base
    from app.db.seed import seed_database
    from app.db.session import SessionLocal, configure_database, get_engine
    from app.main import app

    get_settings.cache_clear()
    configure_database()
    Base.metadata.drop_all(bind=get_engine())
    Base.metadata.create_all(bind=get_engine())

    with SessionLocal() as session:
        seed_database(session)

    yield TestClient(app)


def auth_headers(client: TestClient, email: str, password: str = "Password123!") -> dict[str, str]:
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    token = response.json()["data"]["accessToken"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin_headers(client: TestClient) -> dict[str, str]:
    return auth_headers(client, "admin@example.com", "Admin123!")

