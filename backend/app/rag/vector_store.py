"""Custom pgvector wrapper for RAG platform"""

import logging
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import array

from app.entities.chunk import Chunk
from app.rag.chunker import Chunker

logger = logging.getLogger(__name__)


class VectorStore:
    """Custom pgvector wrapper for RAG platform"""

    def __init__(self, embedding_dimension: int = 1536):
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
            query_embedding: Query vector (1536 dimensions)
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

            # Order by cosine distance (lower is better) using <=> operator
            query = query.order_by(
                text(f"embedding <=> ARRAY{query_embedding}::vector")
            ).limit(limit)

            # Apply threshold if provided
            if threshold:
                # Convert threshold (cosine similarity) to distance (1 - similarity)
                distance_threshold = 1.0 - threshold
                query = query.where(
                    text(
                        f"(embedding <=> ARRAY{query_embedding}::vector) <= {distance_threshold}"
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
            chunk_entities = [
                Chunk(
                    document_id=doc_id,
                    user_id=user_id,
                    content=content,
                    embedding=embedding,
                    chunk_index=idx,
                    token_count=token_count,
                    metadata=metadata,
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
            result = await db.execute(
                select(Chunk).where(Chunk.document_id == document_id)
            )
            chunks = result.scalars().all()

            for chunk in chunks:
                await db.delete(chunk)

            await db.flush()

            logger.info(f"Deleted {len(chunks)} chunks for document {document_id}")
            return len(chunks)

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
            query = select(Chunk).where(Chunk.user_id == user_id)

            if document_id:
                query = query.where(Chunk.document_id == document_id)

            result = await db.execute(query)
            return len(result.scalars().all())

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
