# backend/app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Fullstack Starter Kit"

    # Security — no default; app will refuse to start if SECRET_KEY is not set in .env
    SECRET_KEY: str
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

    # OpenAI/Voyage AI Configuration
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = ""
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"

    # ZhipuAI (GLM) Configuration
    ZHIPUAI_API_KEY: str = ""
    ZHIPUAI_BASE_URL: str = "https://open.bigmodel.cn/api/paas/v4/"
    ZHIPUAI_EMBEDDING_MODEL: str = "embedding-3"
    ZHIPUAI_CHAT_MODEL: str = "glm-4.5"

    # Google Gemini Configuration (chat LLM / OAuth only; embeddings use Voyage)
    GOOGLE_AI_API_KEY: str = ""
    GEMINI_CHAT_MODEL: str = "gemini-2.1-flash"

    # LLM Provider: "gemini" | "zhipuai" | "openai" (default: auto-detect)
    LLM_PROVIDER: str = ""

    # Voyage AI Configuration (document + query embeddings)
    VOYAGE_API_KEY: str = ""
    VOYAGE_BASE_URL: str = "https://api.voyageai.com/v1/"
    VOYAGE_EMBEDDING_MODEL: str = "voyage-4-lite"

    # Embedding Provider: "voyage" | "zhipuai" | "openai" (default: auto-detect)
    EMBEDDING_PROVIDER: str = ""
    EMBEDDING_DIMENSION: int = 512
    EMBEDDING_BATCH_SIZE: int = 100
    EMBEDDING_MAX_RETRIES: int = 5
    EMBEDDING_RETRY_BASE_SECONDS: float = 2.0
    EMBEDDING_RETRY_MAX_SECONDS: float = 60.0

    @property
    def is_voyage_ai(self) -> bool:
        return bool(self.VOYAGE_API_KEY)

    # --- Chat LLM provider resolution ---

    @property
    def llm_provider(self) -> str:
        if self.LLM_PROVIDER:
            return self.LLM_PROVIDER.lower()
        if self.GOOGLE_AI_API_KEY:
            return "gemini"
        if self.ZHIPUAI_API_KEY:
            return "zhipuai"
        return "openai"

    @property
    def chat_api_key(self) -> str:
        provider = self.llm_provider
        if provider == "gemini":
            return self.GOOGLE_AI_API_KEY
        if provider == "zhipuai":
            return self.ZHIPUAI_API_KEY
        return self.OPENAI_API_KEY

    @property
    def chat_base_url(self) -> str | None:
        provider = self.llm_provider
        if provider == "gemini":
            return None
        if provider == "zhipuai":
            return self.ZHIPUAI_BASE_URL
        if self.OPENAI_API_KEY and self.OPENAI_BASE_URL:
            return self.OPENAI_BASE_URL
        return None

    @property
    def chat_model(self) -> str:
        provider = self.llm_provider
        if provider == "gemini":
            return self.GEMINI_CHAT_MODEL
        if provider == "zhipuai":
            return self.ZHIPUAI_CHAT_MODEL
        return self.OPENAI_CHAT_MODEL

    # --- Embedding configuration (Voyage AI > ZhipuAI > OpenAI) ---

    @property
    def embedding_provider(self) -> str:
        if self.EMBEDDING_PROVIDER:
            return self.EMBEDDING_PROVIDER.lower()
        if self.VOYAGE_API_KEY:
            return "voyage"
        if self.ZHIPUAI_API_KEY:
            return "zhipuai"
        return "openai"

    @property
    def embedding_api_key(self) -> str:
        provider = self.embedding_provider
        if provider == "voyage":
            return self.VOYAGE_API_KEY
        if provider == "zhipuai":
            return self.ZHIPUAI_API_KEY
        return self.OPENAI_API_KEY

    @property
    def embedding_base_url(self) -> str | None:
        provider = self.embedding_provider
        if provider == "voyage":
            return self.VOYAGE_BASE_URL
        if provider == "zhipuai":
            return self.ZHIPUAI_BASE_URL
        if self.OPENAI_API_KEY and self.OPENAI_BASE_URL:
            return self.OPENAI_BASE_URL
        return None

    @property
    def embedding_model(self) -> str:
        provider = self.embedding_provider
        if provider == "voyage":
            return self.VOYAGE_EMBEDDING_MODEL
        if provider == "zhipuai":
            return self.ZHIPUAI_EMBEDDING_MODEL
        return self.OPENAI_EMBEDDING_MODEL

    # --- Legacy aliases (backwards compatibility) ---

    @property
    def active_api_key(self) -> str:
        return self.chat_api_key

    @property
    def active_base_url(self) -> str | None:
        return self.chat_base_url

    @property
    def active_embedding_model(self) -> str:
        return self.embedding_model

    @property
    def active_chat_model(self) -> str:
        return self.chat_model

    # RAG Configuration
    CHUNK_MIN_TOKENS: int = 500
    CHUNK_MAX_TOKENS: int = 800
    CHUNK_OVERLAP_RATIO: float = 0.2
    TOP_K_RESULTS: int = 10
    SIMILARITY_THRESHOLD: float = 0.2

    # Document Processing
    MAX_FILE_SIZE_MB: int = 100
    SUPPORTED_FILE_EXTENSIONS: str = "pdf,docx,xlsx,xls,pptx,txt,md,csv"

    # Rate Limiting
    MAX_UPLOADS_PER_MINUTE: int = 10
    MAX_CHAT_QUERIES_PER_MINUTE: int = 60

    # Redis — optional; enables cross-worker WebSocket notifications
    # Set to redis://localhost:6379/0 (or redis://redis:6379/0 in Docker)
    REDIS_URL: str = ""

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
