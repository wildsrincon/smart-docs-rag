"""change_embedding_dimension_to_768

Revision ID: 005_change_embedding_dim_768
Revises: 004_change_embedding_dim_2048
Create Date: 2026-04-18

Switched from VoyageAI (512d) to Google text-embedding-004 (768d).
Existing embeddings are invalidated (set to NULL) since dimensions changed.
Re-ingest documents after applying this migration.
"""

from typing import Sequence, Union

from alembic import op

revision: str = "005_change_embedding_dim_768"
down_revision: Union[str, None] = "004_change_embedding_dim_2048"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_chunks_embedding_hnsw")
    op.execute("ALTER TABLE chunks ALTER COLUMN embedding TYPE vector(768) USING NULL")
    op.execute(
        "CREATE INDEX idx_chunks_embedding_hnsw ON chunks USING hnsw (embedding vector_cosine_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_chunks_embedding_hnsw")
    op.execute("ALTER TABLE chunks ALTER COLUMN embedding TYPE vector(512) USING NULL")
    op.execute(
        "CREATE INDEX idx_chunks_embedding_hnsw ON chunks USING hnsw (embedding vector_cosine_ops)"
    )
