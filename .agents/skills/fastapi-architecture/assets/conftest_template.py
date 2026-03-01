"""
Shared test fixtures for FastAPI application testing.
"""

import pytest
from app.config.settings import get_settings
from app.main import app
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

settings = get_settings()

# Async engine for tests
TEST_DATABASE_URL = settings.DATABASE_URL + "_test"
engine = create_async_engine(TEST_DATABASE_URL, echo=True)
AsyncTestingSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture
async def async_client():
    """
    Fixture that provides an async test client.
    Use this for integration tests.
    """
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
async def db_session():
    """
    Fixture that provides a database session for tests.
    Use this for tests that need database access.
    """
    async with AsyncTestingSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture
def auth_headers():
    """
    Fixture that provides authentication headers.
    Implement this based on your auth strategy.
    """
    # Generate test token here
    token = "test_jwt_token"
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_user_data():
    """
    Fixture that provides sample user data for tests.
    """
    return {
        "email": "test@example.com",
        "password": "SecurePass123!",
        "name": "Test User",
    }
