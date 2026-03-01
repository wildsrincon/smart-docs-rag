#!/usr/bin/env python3
"""
Quick fix: Create database tables using classic SQLAlchemy 1.x style
This works with the existing sync Session setup
"""

import enum
import logging
import uuid
from datetime import datetime, timezone

from dotenv import load_dotenv
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    String,
    create_engine,
    select,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Session, declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = "sqlite:///./app.db"

# Classic Base for manual table creation
Base = declarative_base()

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


class Priority(enum.Enum):
    Normal = 0
    Low = 1
    Medium = 2
    High = 3
    Top = 4


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self):
        return f"<User(email='{self.email}', first_name='{self.first_name}')>"


class Todo(Base):
    __tablename__ = "todos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    description = Column(String, nullable=False)
    due_date = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    completed_at = Column(DateTime, nullable=True)
    priority = Column(Enum(Priority), nullable=False, default=Priority.Medium)

    def __repr__(self):
        return f"<Todo(description='{self.description}', due_date='{self.due_date}')>"


def create_tables():
    """Create all tables"""
    try:
        logging.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logging.info("Database tables created successfully!")
    except Exception as e:
        logging.error(f"Failed to create tables: {str(e)}")
        raise


def verify_tables():
    """Verify tables exist"""
    session = SessionLocal()
    try:
        user_count = session.execute(select(User.id)).scalar_one_or_none()
        todo_count = session.execute(select(Todo.id)).scalar_one_or_none()
        logging.info(f"Verification: Users table accessible: {user_count is not None}")
        logging.info(f"Verification: Todos table accessible: {todo_count is not None}")
        if user_count is None:
            logging.warning("Users table doesn't exist yet!")
        if todo_count is None:
            logging.warning("Todos table doesn't exist yet!")
    finally:
        session.close()


if __name__ == "__main__":
    create_tables()
    verify_tables()
