# backend/app/database/core.py
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker

from ..core.config import settings
from .base import Base

load_dotenv()

# Async engine for database operations
async_engine = create_async_engine(
    settings.async_db_url,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=1800,
)


# Async session factory
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Sync engine for Alembic migrations
sync_engine = create_engine(
    settings.sync_db_url,
    echo=False,
)

# Sync session factory for migrations
SyncSessionLocal = sessionmaker(
    sync_engine,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    """Dependency for async database sessions"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def get_sync_db():
    """Dependency for sync database sessions (Alembic)"""
    session = SyncSessionLocal()
    try:
        yield session
    finally:
        session.close()


# Type aliases for dependency injection
DbSession = AsyncSession
SyncDbSession = Session
