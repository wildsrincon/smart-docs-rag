# backend/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Fullstack Starter Kit"

    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
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
        # Use asyncpg driver explicitly with configured server
        # For local testing, use localhost. For Docker, use db service name
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:5432/{self.POSTGRES_DB}"

    @property
    def sync_db_url(self) -> str:
        """Sync database URL for Alembic migrations"""
        # Use psycopg2 driver for sync operations with configured server
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:5432/{self.POSTGRES_DB}"

    # OpenAI Configuration
    OPENAI_API_KEY: str = ""
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"

    # RAG Configuration
    CHUNK_MIN_TOKENS: int = 500
    CHUNK_MAX_TOKENS: int = 800
    CHUNK_OVERLAP_RATIO: float = 0.2
    TOP_K_RESULTS: int = 10
    SIMILARITY_THRESHOLD: float = 0.2

    # Document Processing
    MAX_FILE_SIZE_MB: int = 10
    SUPPORTED_FILE_EXTENSIONS: str = "pdf,docx,xlsx,xls,pptx,txt,md"

    # Rate Limiting
    MAX_UPLOADS_PER_MINUTE: int = 10
    MAX_CHAT_QUERIES_PER_MINUTE: int = 60

    # Google OAuth Configuration
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/auth/callback/google"

    @property
    def google_oauth_enabled(self) -> bool:
        """Check if Google OAuth is properly configured"""
        return bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET)

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
