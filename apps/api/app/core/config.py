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
    weather_provider: str = Field(default="open-meteo", validation_alias="WEATHER_PROVIDER")
    open_meteo_timeout_seconds: float = Field(
        default=5.0,
        validation_alias="OPEN_METEO_TIMEOUT_SECONDS",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
