"""Custom pgvector wrapper for RAG platform"""

import ast
import json
import logging
from typing import List, Optional
from uuid import UUID

from sqlalchemy import delete, func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.entities.chunk import Chunk

logger = logging.getLogger(__name__)


def _sanitize_text_for_postgres(text: str) -> str:
    """Remove characters PostgreSQL text columns cannot store."""

    return text.replace("\x00", "")


def _to_pgvector_literal(embedding: List[float], dim: int) -> str:
    """Convert a Python list of floats to a pgvector SQL literal: '[v1,v2,...]'::vector(dim).

    This bypasses pgvector's SQLAlchemy bind_processor entirely — the string is
    interpolated directly into the SQL as a typed literal, so neither asyncpg nor
    SQLAlchemy need to know about the vector type at the parameter-binding stage.
    """
    vec_str = "[" + ",".join(str(float(v)) for v in embedding) + "]"
    return f"'{vec_str}'::vector({dim})"


class VectorStore:
    """Custom pgvector wrapper for RAG platform"""

    def __init__(self, embedding_dimension: int | None = None):
        if embedding_dimension is None:
            embedding_dimension = settings.EMBEDDING_DIMENSION
        self.embedding_dimension = embedding_dimension

    async def similarity_search(
        self,
        db: AsyncSession,
        user_id: UUID,
        query_embedding: List[float],
        limit: int = 10,
        document_ids: Optional[List[UUID]] = None,
        threshold: Optional[float] = None,
    ) -> List[Chunk]:
        """
        Perform similarity search using pgvector HNSW index.

        Args:
            db: Async database session
            user_id: User UUID for isolation (security)
            query_embedding: Query vector matching settings.EMBEDDING_DIMENSION
            limit: Number of results to return
            document_ids: Optional filter for specific documents
            threshold: Optional similarity threshold (0-1)

        Returns:
            List of Chunk entities sorted by similarity
        """
        try:
            # Build base query with user isolation
            query = (
                select(Chunk)
                .where(Chunk.user_id == user_id)
                .where(Chunk.embedding.isnot(None))
            )

            # Filter by document IDs if provided
            if document_ids:
                query = query.where(Chunk.document_id.in_(document_ids))

            # Build the vector literal as a raw SQL string to bypass pgvector's
            # SQLAlchemy bind_processor which is incompatible with asyncpg.
            # The embedding values are floats from our own API, not user input.
            vec_literal = _to_pgvector_literal(
                query_embedding, self.embedding_dimension
            )
            distance_sql = text(f"embedding <=> {vec_literal}")

            # Order by cosine distance (lower is better)
            query = query.order_by(distance_sql).limit(limit)

            # Apply threshold if provided
            if threshold:
                distance_threshold = 1.0 - threshold
                query = query.where(
                    text(
                        f"(embedding <=> {vec_literal}) <= {float(distance_threshold)}"
                    )
                )

            result = await db.execute(query)
            chunks = result.scalars().all()

            logger.info(f"Found {len(chunks)} chunks for user {user_id}")
            return chunks

        except Exception as e:
            logger.error(f"Error in similarity search: {e}")
            raise

    async def add_chunks(self, db: AsyncSession, chunks: List[tuple]) -> List[Chunk]:
        """
        Batch insert chunks with embeddings.

        Args:
            db: Async database session
            chunks: List of (document_id, user_id, content, embedding, index, token_count, metadata)

        Returns:
            List of created Chunk entities
        """
        try:
            def serialize_metadata(metadata: object) -> str:
                if metadata is None:
                    return "{}"

                if isinstance(metadata, dict):
                    return json.dumps(metadata)

                if isinstance(metadata, str):
                    try:
                        parsed = json.loads(metadata)
                    except json.JSONDecodeError:
                        try:
                            parsed = ast.literal_eval(metadata)
                        except (ValueError, SyntaxError):
                            logger.warning(
                                "Invalid chunk metadata string; storing empty JSON object"
                            )
                            return "{}"

                    if isinstance(parsed, dict):
                        return json.dumps(parsed)

                    logger.warning(
                        "Chunk metadata string did not contain a JSON object; "
                        "storing empty JSON object"
                    )
                    return "{}"

                return json.dumps(metadata)

            chunk_entities = [
                Chunk(
                    document_id=doc_id,
                    user_id=user_id,
                    content=_sanitize_text_for_postgres(content),
                    embedding=embedding,
                    chunk_index=idx,
                    token_count=token_count,
                    chunk_metadata=serialize_metadata(metadata),
                )
                for doc_id, user_id, content, embedding, idx, token_count, metadata in chunks
            ]

            db.add_all(chunk_entities)
            await db.flush()

            logger.info(f"Added {len(chunk_entities)} chunks to database")
            return chunk_entities

        except Exception as e:
            logger.error(f"Error adding chunks: {e}")
            raise

    async def delete_by_document_id(self, db: AsyncSession, document_id: UUID) -> int:
        """
        Delete all chunks for a document.

        Args:
            db: Async database session
            document_id: Document UUID

        Returns:
            Number of chunks deleted
        """
        try:
            count_result = await db.execute(
                select(func.count())
                .select_from(Chunk)
                .where(Chunk.document_id == document_id)
            )
            count = count_result.scalar_one()

            await db.execute(delete(Chunk).where(Chunk.document_id == document_id))
            await db.flush()

            logger.info(f"Deleted {count} chunks for document {document_id}")
            return count

        except Exception as e:
            logger.error(f"Error deleting chunks: {e}")
            raise

    async def get_chunk_count(
        self, db: AsyncSession, user_id: UUID, document_id: Optional[UUID] = None
    ) -> int:
        """
        Get count of chunks for user/document.

        Args:
            db: Async database session
            user_id: User UUID
            document_id: Optional document UUID filter

        Returns:
            Number of chunks
        """
        try:
            query = (
                select(func.count()).select_from(Chunk).where(Chunk.user_id == user_id)
            )

            if document_id:
                query = query.where(Chunk.document_id == document_id)

            result = await db.execute(query)
            return result.scalar_one()

        except Exception as e:
            logger.error(f"Error getting chunk count: {e}")
            raise

    async def get_chunks_by_document_id(
        self, db: AsyncSession, document_id: UUID, user_id: UUID
    ) -> List[Chunk]:
        """
        Get all chunks for a document (ordered by index).

        Args:
            db: Async database session
            document_id: Document UUID
            user_id: User UUID for security

        Returns:
            List of Chunk entities ordered by chunk_index
        """
        try:
            query = (
                select(Chunk)
                .where(Chunk.document_id == document_id)
                .where(Chunk.user_id == user_id)
                .order_by(Chunk.chunk_index)
            )

            result = await db.execute(query)
            return result.scalars().all()

        except Exception as e:
            logger.error(f"Error getting chunks by document: {e}")
            raise
