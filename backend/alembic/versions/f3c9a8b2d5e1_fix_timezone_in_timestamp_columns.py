"""Fix timezone in users and todos timestamp columns

Revision ID: f3c9a8b2d5e1
Revises: e60f95f576ed
Create Date: 2026-02-26 21:40:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f3c9a8b2d5e1"
down_revision: Union[str, None] = "e60f95f576ed"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Change timestamp columns in users table to TIMESTAMP WITH TIME ZONE
    op.alter_column(
        "users",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(timezone=True),
    )
    op.alter_column(
        "users",
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(timezone=True),
    )

    # Change timestamp columns in todos table to TIMESTAMP WITH TIME ZONE
    op.alter_column(
        "todos",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(timezone=True),
    )
    op.alter_column(
        "todos",
        "completed_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(timezone=True),
    )


def downgrade() -> None:
    # Revert to TIMESTAMP WITHOUT TIME ZONE
    op.alter_column(
        "todos",
        "completed_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(timezone=False),
    )
    op.alter_column(
        "todos",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(timezone=False),
    )
    op.alter_column(
        "users",
        "updated_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(timezone=False),
    )
    op.alter_column(
        "users",
        "created_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(timezone=False),
    )
