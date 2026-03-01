"""Alembic Environment configuration"""

import logging
import sys

from alembic import context
from sqlalchemy import create_engine, engine_from_config, pool

# this is the Alembic Config object
config = context.config

# Configure logging without fileConfig
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("alembic.env")

# Import settings for database URL
from app.core.config import settings

# Override sqlalchemy.url from config file with environment-aware URL
config.set_main_option("sqlalchemy.url", settings.sync_db_url)

# Import Base BEFORE importing entities to ensure they register correctly
from app.database.base import Base
from app.entities.todo import Todo

# Import all entities to ensure they are registered with Base.metadata
# This must happen AFTER importing Base
from app.entities.user import User

# add your model's MetaData object here for 'autogenerate' support
# In SQLAlchemy 2.0, DeclarativeBase has a metadata attribute
target_metadata = Base.metadata

# Debug: Log detected tables
logger.info(f"Detected tables in metadata: {list(target_metadata.tables.keys())}")


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    # Use sync engine for migrations (Alembic requires sync)
    connectable = create_engine(settings.sync_db_url)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
