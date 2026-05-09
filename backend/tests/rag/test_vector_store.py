"""Unit tests for vector store with pgvector"""

import pytest
from uuid import uuid4
from typing import List

from app.rag.vector_store import VectorStore, _sanitize_text_for_postgres
from app.entities.chunk import Chunk
from app.core.config import settings


class TestVectorStore:
    """Test suite for VectorStore class"""

    @pytest.fixture
    def vector_store(self):
        """Create vector store instance"""
        return VectorStore(embedding_dimension=512)

    @pytest.fixture
    def mock_embedding(self):
        """Create mock embedding vector (512 dimensions — matches Vector(512) column)"""
        return [0.1] * 512

    @pytest.fixture
    def test_user_id(self, test_user):
        """Get test user ID from fixture"""
        return test_user.id

    @pytest.fixture
    def test_document_id(self, test_document):
        """Get test document ID from fixture"""
        return test_document.id

    @pytest.fixture
    def test_document_id_2(self, test_document_2):
        """Get second test document ID from fixture"""
        return test_document_2.id

    @pytest.fixture
    def sample_chunks(self, test_user_id, test_document_id, mock_embedding):
        """Create sample chunk data for testing"""
        return [
            (
                test_document_id,
                test_user_id,
                "This is the first chunk content about machine learning.",
                mock_embedding,
                0,
                12,
                {"metadata": "test"},
            ),
            (
                test_document_id,
                test_user_id,
                "This is the second chunk content about deep learning.",
                mock_embedding,
                1,
                12,
                {"metadata": "test"},
            ),
            (
                test_document_id,
                test_user_id,
                "This is the third chunk content about neural networks.",
                mock_embedding,
                2,
                12,
                {"metadata": "test"},
            ),
        ]

    @pytest.mark.asyncio
    async def test_add_chunks(self, vector_store, db_session, sample_chunks):
        """Test batch insertion of chunks with embeddings"""
        chunks = await vector_store.add_chunks(db_session, sample_chunks)

        assert len(chunks) == 3, "Should add all chunks"

        for chunk in chunks:
            assert chunk.content, "Chunk content should not be empty"
            assert chunk.embedding is not None, "Chunk should have embedding"
            assert chunk.token_count > 0, "Chunk should have token count"

    @pytest.mark.asyncio
    async def test_add_chunks_empty_list(self, vector_store, db_session):
        """Test adding empty chunk list"""
        chunks = await vector_store.add_chunks(db_session, [])
        assert len(chunks) == 0, "Should return empty list for empty input"

    @pytest.mark.asyncio
    async def test_similarity_search(
        self,
        vector_store,
        db_session,
        test_user_id,
        test_document_id,
        sample_chunks,
        mock_embedding,
    ):
        """Test similarity search with pgvector HNSW"""
        # Add chunks first
        await vector_store.add_chunks(db_session, sample_chunks)
        await db_session.commit()

        # Perform similarity search
        results = await vector_store.similarity_search(
            db=db_session,
            user_id=test_user_id,
            query_embedding=mock_embedding,
            limit=10,
        )

        assert len(results) == 3, "Should find all chunks"
        assert all(isinstance(chunk, Chunk) for chunk in results)

    @pytest.mark.asyncio
    async def test_similarity_search_user_isolation(
        self,
        vector_store,
        db_session,
        test_user_id,
        test_document_id,
        sample_chunks,
        mock_embedding,
    ):
        """Test user_id filtering for security isolation"""
        other_user_id = uuid4()

        # Add chunks for test_user_id
        await vector_store.add_chunks(db_session, sample_chunks)
        await db_session.commit()

        # Search with different user_id should return no results
        results = await vector_store.similarity_search(
            db=db_session,
            user_id=other_user_id,
            query_embedding=mock_embedding,
            limit=10,
        )

        assert len(results) == 0, "Should not find chunks for different user"

    @pytest.mark.asyncio
    async def test_similarity_search_document_filtering(
        self,
        vector_store,
        db_session,
        test_user_id,
        test_document_id,
        test_document_id_2,
        sample_chunks,
        mock_embedding,
    ):
        """Test document_id filtering in similarity search"""

        # Add chunks for test_document_id
        await vector_store.add_chunks(db_session, sample_chunks)
        await db_session.commit()

        # Search filtering by specific document_id
        results = await vector_store.similarity_search(
            db=db_session,
            user_id=test_user_id,
            query_embedding=mock_embedding,
            limit=10,
            document_ids=[test_document_id],
        )

        assert len(results) == 3, "Should find all chunks for document"
        assert all(chunk.document_id == test_document_id for chunk in results)

        # Search filtering by non-existent document_id
        results_other = await vector_store.similarity_search(
            db=db_session,
            user_id=test_user_id,
            query_embedding=mock_embedding,
            limit=10,
            document_ids=[test_document_id_2],
        )

        assert len(results_other) == 0, "Should not find chunks for other document"

    @pytest.mark.asyncio
    async def test_similarity_search_threshold(
        self,
        vector_store,
        db_session,
        test_user_id,
        test_document_id,
        sample_chunks,
        mock_embedding,
    ):
        """Test similarity threshold filtering"""
        await vector_store.add_chunks(db_session, sample_chunks)
        await db_session.commit()

        # Search with high threshold (should return fewer results)
        results_high = await vector_store.similarity_search(
            db=db_session,
            user_id=test_user_id,
            query_embedding=mock_embedding,
            limit=10,
            threshold=0.9,
        )

        # Search with low threshold (should return more results)
        results_low = await vector_store.similarity_search(
            db=db_session,
            user_id=test_user_id,
            query_embedding=mock_embedding,
            limit=10,
            threshold=0.1,
        )

        assert len(results_low) >= len(results_high), (
            "Lower threshold should return more or equal results"
        )

    @pytest.mark.asyncio
    async def test_similarity_search_limit(
        self,
        vector_store,
        db_session,
        test_user_id,
        test_document_id,
        sample_chunks,
        mock_embedding,
    ):
        """Test limit parameter in similarity search"""
        await vector_store.add_chunks(db_session, sample_chunks)
        await db_session.commit()

        # Search with limit of 2
        results = await vector_store.similarity_search(
            db=db_session,
            user_id=test_user_id,
            query_embedding=mock_embedding,
            limit=2,
        )

        assert len(results) <= 2, "Should respect limit parameter"

    @pytest.mark.asyncio
    async def test_delete_by_document_id(
        self,
        vector_store,
        db_session,
        test_user_id,
        test_document_id,
        sample_chunks,
    ):
        """Test deletion of chunks by document_id"""
        await vector_store.add_chunks(db_session, sample_chunks)
        await db_session.commit()

        # Verify chunks exist
        count_before = await vector_store.get_chunk_count(
            db_session, test_user_id, test_document_id
        )
        assert count_before == 3, "Should have 3 chunks before deletion"

        # Delete chunks
        deleted_count = await vector_store.delete_by_document_id(
            db_session, test_document_id
        )
        await db_session.commit()

        assert deleted_count == 3, "Should delete 3 chunks"

        # Verify chunks are deleted
        count_after = await vector_store.get_chunk_count(
            db_session, test_user_id, test_document_id
        )
        assert count_after == 0, "Should have 0 chunks after deletion"

    @pytest.mark.asyncio
    async def test_delete_by_document_id_non_existent(
        self, vector_store, db_session, test_document_id
    ):
        """Test deletion of non-existent document"""
        deleted_count = await vector_store.delete_by_document_id(
            db_session, test_document_id
        )

        assert deleted_count == 0, "Should return 0 for non-existent document"

    @pytest.mark.asyncio
    async def test_get_chunk_count(
        self,
        vector_store,
        db_session,
        test_user_id,
        test_document_id,
        sample_chunks,
    ):
        """Test getting chunk count"""
        # Count before adding
        count_before = await vector_store.get_chunk_count(
            db_session, test_user_id, test_document_id
        )
        assert count_before == 0, "Should have 0 chunks before adding"

        # Add chunks
        await vector_store.add_chunks(db_session, sample_chunks)
        await db_session.commit()

        # Count after adding
        count_after = await vector_store.get_chunk_count(
            db_session, test_user_id, test_document_id
        )
        assert count_after == 3, "Should have 3 chunks after adding"

    @pytest.mark.asyncio
    async def test_get_chunk_count_by_user_only(
        self,
        vector_store,
        db_session,
        test_user_id,
        test_document_id,
        test_document_id_2,
        sample_chunks,
    ):
        """Test getting chunk count filtered by user only"""

        # Add chunks for first document
        await vector_store.add_chunks(db_session, sample_chunks)

        # Add chunks for second document
        other_chunks = [
            (
                test_document_id_2,
                test_user_id,
                "This is a chunk from another document.",
                [0.2] * 1536,
                0,
                8,
                {},
            )
        ]
        await vector_store.add_chunks(db_session, other_chunks)
        await db_session.commit()

        # Count all chunks for user
        total_count = await vector_store.get_chunk_count(db_session, test_user_id)
        assert total_count == 4, "Should count all chunks for user"

    @pytest.mark.asyncio
    async def test_get_chunks_by_document_id(
        self,
        vector_store,
        db_session,
        test_user_id,
        test_document_id,
        sample_chunks,
    ):
        """Test getting chunks by document_id with ordering"""
        await vector_store.add_chunks(db_session, sample_chunks)
        await db_session.commit()

        chunks = await vector_store.get_chunks_by_document_id(
            db_session, test_document_id, test_user_id
        )

        assert len(chunks) == 3, "Should retrieve all chunks"

        # Verify ordering by chunk_index
        indices = [chunk.chunk_index for chunk in chunks]
        assert indices == sorted(indices), "Chunks should be ordered by chunk_index"

    @pytest.mark.asyncio
    async def test_get_chunks_by_document_id_wrong_user(
        self,
        vector_store,
        db_session,
        test_user_id,
        test_document_id,
        sample_chunks,
    ):
        """Test user isolation in get_chunks_by_document_id"""
        await vector_store.add_chunks(db_session, sample_chunks)
        await db_session.commit()

        other_user_id = uuid4()

        chunks = await vector_store.get_chunks_by_document_id(
            db_session, test_document_id, other_user_id
        )

        assert len(chunks) == 0, "Should not return chunks for wrong user"

    def test_vector_store_initialization(self):
        """Test vector store initialization"""
        vector_store = VectorStore(embedding_dimension=1536)
        assert vector_store.embedding_dimension == 1536

    def test_vector_store_default_dimension(self):
        """Test vector store default embedding dimension"""
        vector_store = VectorStore()
        assert vector_store.embedding_dimension == settings.EMBEDDING_DIMENSION

    def test_sanitize_text_for_postgres_removes_nul_bytes(self):
        """PostgreSQL text columns reject NUL characters from extracted PDFs."""
        assert _sanitize_text_for_postgres("hello\x00 world") == "hello world"
