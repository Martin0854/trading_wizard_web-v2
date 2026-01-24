"""Application settings and configuration."""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = "postgresql://trading:trading_dev@localhost:5432/trading_wizard"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # Environment
    environment: str = "development"
    debug: bool = True

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3001",
        "http://localhost:3002",
    ]

    # Rate limiting
    yfinance_rate_limit: int = 2000  # requests per hour

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
