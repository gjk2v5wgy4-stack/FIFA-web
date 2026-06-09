from collections.abc import Iterator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

_engine: Engine | None = None
SessionLocal: sessionmaker[Session] = sessionmaker(autocommit=False, autoflush=False)


def configure_database() -> None:
    global _engine
    connect_args: dict[str, object] = {}
    database_url = get_settings().database_url
    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    _engine = create_engine(database_url, connect_args=connect_args, future=True)
    SessionLocal.configure(bind=_engine)


def get_engine() -> Engine:
    if _engine is None:
        configure_database()
    if _engine is None:
        raise RuntimeError("Database engine was not configured.")
    return _engine


def get_db() -> Iterator[Session]:
    get_engine()
    with SessionLocal() as session:
        yield session

