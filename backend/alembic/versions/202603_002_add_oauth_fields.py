"""Add OAuth fields to users table

Revision ID: 002_add_oauth_fields
Revises: f3c9a8b2d5e1
Create Date: 2026-03-22 22:30:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "002_add_oauth_fields"
down_revision: Union[str, None] = "f3c9a8b2d5e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create provider enum type
    provider_enum = postgresql.ENUM(
        "manual", "google", name="provider", create_type=True
    )
    provider_enum.create(op.get_bind())

    # Add new columns
    op.add_column("users", sa.Column("google_id", sa.String(), nullable=True))
    op.add_column(
        "users",
        sa.Column("provider", provider_enum, nullable=True, server_default="manual"),
    )
    op.add_column("users", sa.Column("avatar_url", sa.String(), nullable=True))

    # Create unique constraint on google_id
    op.create_index(op.f("ix_users_google_id"), "users", ["google_id"], unique=True)

    # Add check constraint for google_id and provider consistency
    op.create_check_constraint(
        "check_google_provider_consistency",
        "users",
        "(google_id IS NOT NULL AND provider = 'google') OR (google_id IS NULL AND provider = 'manual')",
    )


def downgrade() -> None:
    # Drop check constraint
    op.drop_constraint("check_google_provider_consistency", "users", type_="check")

    # Drop unique index
    op.drop_index(op.f("ix_users_google_id"), table_name="users")

    # Drop new columns
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "provider")
    op.drop_column("users", "google_id")

    # Drop provider enum type
    provider_enum = postgresql.ENUM(
        "manual", "google", name="provider", create_type=True
    )
    provider_enum.drop(op.get_bind())
