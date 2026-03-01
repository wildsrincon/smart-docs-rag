"""
Base declarative class for SQLAlchemy models.

All models should import Base from this module to ensure
they use the same metadata and schema.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""

    pass
