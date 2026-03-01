#!/usr/bin/env python3
"""
Initialize database tables
"""

from app.database.core import Base, engine


def init_db():
    """Create all tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


if __name__ == "__main__":
    init_db()
