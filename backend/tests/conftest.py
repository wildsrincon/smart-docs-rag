"""Pytest configuration and fixtures for RAG platform tests"""

import asyncio
import os
from typing import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import app
from app.database.base import Base

# Safety guard: tests MUST use a dedicated database.
# Without this, tests drop/recreate tables against the production DB.
# Set TEST_DATABASE_URL in your environment before running pytest.
# Example: postgresql+asyncpg://postgres:postgres@localhost:5432/test_app_db
_TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")
if not _TEST_DATABASE_URL:
    raise RuntimeError(
        "\n\nTEST_DATABASE_URL is not set.\n"
        "Tests require a dedicated database to avoid destroying production data.\n"
        "Example:\n"
        "  export TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/test_app_db\n"
        "  createdb test_app_db  # create it once\n"
        "  pytest\n"
    )

# Import all models to ensure they are registered with SQLAlchemy's metadata
from app.entities import (
    Chunk,
    Conversation,
    Document,
    Message,
    User,
    Todo,
)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create async database session for tests"""
    # Create fresh engine for each test to avoid event loop issues
    engine = create_async_engine(
        _TEST_DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
    )

    TestSessionLocal = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with engine.begin() as conn:
        # Drop all tables first (this drops types/enums too)
        await conn.run_sync(Base.metadata.drop_all)
        # Then create all (tables and types/enums)
        # Note: checkfirst=True doesn't work reliably for types in PostgreSQL,
        # but drop_all first clears the way for clean creation
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session
        await session.rollback()
        await session.close()

    async with engine.begin() as conn:
        # Drop all tables after tests
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture
def test_client() -> TestClient:
    """Create test client for FastAPI app"""
    return TestClient(app)


@pytest.fixture
def sample_pdf_content():
    """Create sample PDF content for testing"""
    import io

    return io.BytesIO(b"%PDF-1.4\n%fake pdf content for testing\n%%EOF")


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession):
    """Create a test user in the database"""
    from app.entities import User
    import bcrypt
    import uuid

    # Use unique email for each test to avoid conflicts
    unique_id = str(uuid.uuid4())[:8]
    user = User(
        email=f"test-{unique_id}@example.com",
        first_name="Test",
        last_name="User",
        password_hash=bcrypt.hashpw("testpass".encode(), bcrypt.gensalt()).decode(),
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def test_document(db_session: AsyncSession, test_user):
    """Create a test document in the database"""
    from app.entities import Document, IngestionStatus

    document = Document(
        user_id=test_user.id,
        filename="test.pdf",
        file_size=1024,
        status=IngestionStatus.COMPLETED,
        total_chunks=3,
        processed_chunks=3,
    )
    db_session.add(document)
    await db_session.commit()
    await db_session.refresh(document)
    return document


@pytest_asyncio.fixture
async def test_document_2(db_session: AsyncSession, test_user):
    """Create a second test document for testing multiple documents"""
    from app.entities import Document, IngestionStatus

    document = Document(
        user_id=test_user.id,
        filename="test2.pdf",
        file_size=2048,
        status=IngestionStatus.COMPLETED,
        total_chunks=1,
        processed_chunks=1,
    )
    db_session.add(document)
    await db_session.commit()
    await db_session.refresh(document)
    return document
