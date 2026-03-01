# backend/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Fullstack Starter Kit"

    # Security
    SECRET_KEY: str = "fullstack-fastapi-starter"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database - PostgreSQL with Docker
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/app_db"

    # PostgreSQL config for Docker
    POSTGRES_SERVER: str = "db"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "app_db"

    @property
    def async_db_url(self) -> str:
        """Async database URL using asyncpg driver"""
        # Use asyncpg driver explicitly
        return "postgresql+asyncpg://postgres:postgres@db:5432/app_db"

    @property
    def sync_db_url(self) -> str:
        """Sync database URL for Alembic migrations"""
        # Use psycopg2 driver for sync operations
        return "postgresql://postgres:postgres@db:5432/app_db"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
