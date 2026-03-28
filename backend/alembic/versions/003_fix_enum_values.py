"""Fix enum values for ingestionstatus

Revision ID: 003_fix_enum_values
Revises: 001_add_rag_tables
Create Date: 2026-03-23

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003_fix_enum_values"
down_revision: Union[str, None] = "001_add_rag_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM pg_type t
                JOIN pg_enum e ON e.enumtypid = t.oid
                WHERE t.typname = 'ingestionstatus' AND e.enumlabel = 'PENDING'
            ) THEN
                ALTER TYPE ingestionstatus RENAME VALUE 'PENDING' TO 'pending';
            END IF;

            IF EXISTS (
                SELECT 1
                FROM pg_type t
                JOIN pg_enum e ON e.enumtypid = t.oid
                WHERE t.typname = 'ingestionstatus' AND e.enumlabel = 'PROCESSING'
            ) THEN
                ALTER TYPE ingestionstatus RENAME VALUE 'PROCESSING' TO 'processing';
            END IF;

            IF EXISTS (
                SELECT 1
                FROM pg_type t
                JOIN pg_enum e ON e.enumtypid = t.oid
                WHERE t.typname = 'ingestionstatus' AND e.enumlabel = 'COMPLETED'
            ) THEN
                ALTER TYPE ingestionstatus RENAME VALUE 'COMPLETED' TO 'completed';
            END IF;

            IF EXISTS (
                SELECT 1
                FROM pg_type t
                JOIN pg_enum e ON e.enumtypid = t.oid
                WHERE t.typname = 'ingestionstatus' AND e.enumlabel = 'FAILED'
            ) THEN
                ALTER TYPE ingestionstatus RENAME VALUE 'FAILED' TO 'failed';
            END IF;
        END
        $$;
        """
    )

    op.execute(
        """
        ALTER TABLE documents
        ALTER COLUMN status TYPE ingestionstatus
        USING lower(status::text)::ingestionstatus
        """
    )
    op.execute(
        "ALTER TABLE documents ALTER COLUMN status SET DEFAULT 'pending'::ingestionstatus"
    )


def downgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM pg_type t
                JOIN pg_enum e ON e.enumtypid = t.oid
                WHERE t.typname = 'ingestionstatus' AND e.enumlabel = 'pending'
            ) THEN
                ALTER TYPE ingestionstatus RENAME VALUE 'pending' TO 'PENDING';
            END IF;

            IF EXISTS (
                SELECT 1
                FROM pg_type t
                JOIN pg_enum e ON e.enumtypid = t.oid
                WHERE t.typname = 'ingestionstatus' AND e.enumlabel = 'processing'
            ) THEN
                ALTER TYPE ingestionstatus RENAME VALUE 'processing' TO 'PROCESSING';
            END IF;

            IF EXISTS (
                SELECT 1
                FROM pg_type t
                JOIN pg_enum e ON e.enumtypid = t.oid
                WHERE t.typname = 'ingestionstatus' AND e.enumlabel = 'completed'
            ) THEN
                ALTER TYPE ingestionstatus RENAME VALUE 'completed' TO 'COMPLETED';
            END IF;

            IF EXISTS (
                SELECT 1
                FROM pg_type t
                JOIN pg_enum e ON e.enumtypid = t.oid
                WHERE t.typname = 'ingestionstatus' AND e.enumlabel = 'failed'
            ) THEN
                ALTER TYPE ingestionstatus RENAME VALUE 'failed' TO 'FAILED';
            END IF;
        END
        $$;
        """
    )
    op.execute(
        "ALTER TABLE documents ALTER COLUMN status SET DEFAULT 'PENDING'::ingestionstatus"
    )
