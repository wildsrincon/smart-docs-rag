"""change_embedding_dimension_to_512

Revision ID: 004_change_embedding_dim_2048
Revises: 003_fix_enum_values
Create Date: 2026-04-03

Updated: Voyage AI voyage-4-lite uses 512d embeddings.
pgvector HNSW index supports up to 2000 dimensions.
"""

from typing import Sequence, Union

from alembic import op

revision: str = "004_change_embedding_dim_2048"
down_revision: Union[str, None] = "003_fix_enum_values"
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
    op.execute("ALTER TABLE chunks ALTER COLUMN embedding TYPE vector(1536) USING NULL")
    op.execute(
        "CREATE INDEX idx_chunks_embedding_hnsw ON chunks USING hnsw (embedding vector_cosine_ops)"
    )
