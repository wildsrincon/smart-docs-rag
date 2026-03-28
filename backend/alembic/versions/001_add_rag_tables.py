"""add_rag_tables

Revision ID: 001_add_rag_tables
Revises:
Create Date: 2026-03-22

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001_add_rag_tables"
down_revision: Union[str, None] = "002_add_oauth_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum types
    ingestion_status_enum = postgresql.ENUM(
        "pending",
        "processing",
        "completed",
        "failed",
        name="ingestionstatus",
        create_type=True,
    )
    ingestion_status_enum.create(op.get_bind())

    message_role_enum = postgresql.ENUM(
        "user", "assistant", "system", name="messagerole", create_type=True
    )
    message_role_enum.create(op.get_bind())

    # Create documents table
    op.create_table(
        "documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("file_size", sa.Integer()),
        sa.Column(
            "status",
            postgresql.ENUM(name="ingestionstatus", create_type=False),
            nullable=False,
            default="pending",
            index=True,
        ),
        sa.Column("total_chunks", sa.Integer(), default=0),
        sa.Column("processed_chunks", sa.Integer(), default=0),
        sa.Column("error_message", sa.Text()),
        sa.Column("chunk_metadata", sa.Text()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")
        ),
        sa.Column("processed_at", sa.DateTime(timezone=True)),
    )

    # Create chunks table with pgvector support
    op.create_table(
        "chunks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "document_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("documents.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "embedding", postgresql.ARRAY(sa.Float), nullable=True
        ),  # pgvector will be created separately
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("token_count", sa.Integer()),
        sa.Column("chunk_metadata", sa.Text()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")
        ),
    )

    # Convert embedding column to pgvector type
    op.execute(
        "ALTER TABLE chunks ALTER COLUMN embedding TYPE vector(1536) USING embedding::vector(1536)"
    )

    # Create HNSW index for vector similarity search
    op.execute(
        "CREATE INDEX idx_chunks_embedding_hnsw ON chunks USING hnsw (embedding vector_cosine_ops)"
    )

    # Create conversations table
    op.create_table(
        "conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")
        ),
    )

    # Create messages table
    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "conversation_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("conversations.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "role",
            postgresql.ENUM(name="messagerole", create_type=False),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("tokens", sa.Integer()),
        sa.Column("document_ids", sa.Text()),  # JSON array of document IDs
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            index=True,
        ),
    )


def downgrade() -> None:
    # Drop tables in reverse order of creation
    op.drop_table("messages")
    op.drop_table("conversations")
    op.execute("DROP INDEX IF EXISTS idx_chunks_embedding_hnsw")
    op.drop_table("chunks")
    op.drop_table("documents")

    # Drop enum types
    message_role_enum = postgresql.ENUM(name="messagerole")
    message_role_enum.drop(op.get_bind())

    ingestion_status_enum = postgresql.ENUM(name="ingestionstatus")
    ingestion_status_enum.drop(op.get_bind())
