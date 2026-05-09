"""change_embedding_dimension_to_512

Revision ID: 006_change_embedding_dim_512
Revises: 005_change_embedding_dim_768
Create Date: 2026-05-09

Switch RAG embeddings back to Voyage AI voyage-4-lite (512d).
Existing embeddings are invalidated (set to NULL) because pgvector cannot
convert vectors across incompatible dimensions. Re-ingest documents after
applying this migration.
"""

from typing import Sequence, Union

from alembic import op


revision: str = "006_change_embedding_dim_512"
down_revision: Union[str, None] = "005_change_embedding_dim_768"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_chunks_embedding_hnsw")
    op.execute("ALTER TABLE chunks ALTER COLUMN embedding TYPE vector(512) USING NULL")
    op.execute(
        "CREATE INDEX idx_chunks_embedding_hnsw ON chunks USING hnsw (embedding vector_cosine_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_chunks_embedding_hnsw")
    op.execute("ALTER TABLE chunks ALTER COLUMN embedding TYPE vector(768) USING NULL")
    op.execute(
        "CREATE INDEX idx_chunks_embedding_hnsw ON chunks USING hnsw (embedding vector_cosine_ops)"
    )
