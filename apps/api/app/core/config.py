from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "worldcup-ai-prediction-api"
    database_url: str = Field(
        default="postgresql+psycopg://worldcup:worldcup@localhost:5432/worldcup_ai_prediction",
        validation_alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")
    secret_key: str = Field(default="change-me-for-local-dev", validation_alias="SECRET_KEY")
    low_balance_threshold: int = Field(default=10_000, validation_alias="LOW_BALANCE_THRESHOLD")
    qdrant_host: str = Field(default="localhost", validation_alias="QDRANT_HOST")
    qdrant_port: int = Field(default=6333, validation_alias="QDRANT_PORT")
    qdrant_api_key: str | None = Field(default=None, validation_alias="QDRANT_API_KEY")
    vector_dim: int = Field(default=1536, validation_alias="VECTOR_DIM")
    qdrant_collection: str = Field(
        default="worldcup_documents",
        validation_alias="QDRANT_COLLECTION",
    )
    auto_create_schema: bool = Field(default=False, validation_alias="AUTO_CREATE_SCHEMA")
    weather_provider: str = Field(default="open-meteo", validation_alias="WEATHER_PROVIDER")
    open_meteo_timeout_seconds: float = Field(
        default=5.0,
        validation_alias="OPEN_METEO_TIMEOUT_SECONDS",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
