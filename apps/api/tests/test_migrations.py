from pathlib import Path


def test_alembic_initial_migration_exists() -> None:
    versions_dir = Path("alembic") / "versions"

    migrations = list(versions_dir.glob("*_initial_backend_schema.py"))

    assert len(migrations) == 1
    migration_text = migrations[0].read_text(encoding="utf-8")
    for table_name in [
        "users",
        "admin_action_logs",
        "token_ledger",
        "ai_usage_logs",
        "teams",
        "players",
        "matches",
        "rag_queries",
        "predictions",
        "reports",
    ]:
        assert f'"{table_name}"' in migration_text

