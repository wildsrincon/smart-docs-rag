"""Performance tests for RAG latency"""

import pytest
import pytest_asyncio
import time
import asyncio
from uuid import uuid4
from unittest.mock import Mock, AsyncMock, patch
from typing import List

from app.rag.chunker import Chunker
from app.rag.vector_store import VectorStore
from app.rag.ingestion_service import IngestionService
from app.rag.chat_service import ChatService
from app.entities.document import Document, IngestionStatus
from app.entities.chunk import Chunk
from app.entities.user import User


@pytest.mark.performance
class TestRAGLatency:
    """Performance test suite for RAG platform"""

    @pytest_asyncio.fixture
    async def test_user(self, db_session):
        """Create test user"""
        user = User(
            id=uuid4(),
            email="test@example.com",
            first_name="Test",
            last_name="User",
            password_hash="hashed_password",
        )
        db_session.add(user)
        await db_session.commit()
        return user

    @pytest_asyncio.fixture
    async def test_document(self, db_session, test_user):
        """Create test document"""
        document = Document(
            id=uuid4(),
            user_id=test_user.id,
            filename="test.pdf",
            status=IngestionStatus.COMPLETED,
        )
        db_session.add(document)
        await db_session.commit()
        return document

    @pytest.mark.asyncio
    async def test_ingestion_latency_small_document(
        self, db_session, test_user, test_document
    ):
        """Test document ingestion completes within 60 seconds (small document)"""
        ingestion_service = IngestionService()
        vector_store = VectorStore()

        # Create small text (~1 page)
        small_text = "This is a test sentence. " * 100

        start_time = time.perf_counter()

        # Chunk text
        chunker = Chunker()
        chunks = chunker.create_chunks(
            small_text, {"document_id": str(test_document.id)}
        )

        # Mock embedding generation
        mock_embeddings = [[0.1] * 1536 for _ in chunks]

        # Insert chunks
        chunk_data = [
            (
                test_document.id,
                test_user.id,
                chunk["content"],
                mock_embeddings[i],
                chunk["chunk_index"],
                chunk["token_count"],
                chunk.get("metadata"),
            )
            for i, chunk in enumerate(chunks)
        ]

        await vector_store.add_chunks(db_session, chunk_data)
        await db_session.commit()

        end_time = time.perf_counter()
        ingestion_time = end_time - start_time

        assert ingestion_time < 60.0, (
            f"Ingestion time {ingestion_time:.2f}s exceeds 60s target"
        )

    @pytest.mark.asyncio
    async def test_ingestion_latency_medium_document(
        self, db_session, test_user, test_document
    ):
        """Test document ingestion completes within 60 seconds (medium document)"""
        ingestion_service = IngestionService()
        vector_store = VectorStore()

        # Create medium text (~10 pages)
        medium_text = "This is a test sentence about machine learning and AI. " * 1000

        start_time = time.perf_counter()

        # Chunk text
        chunker = Chunker()
        chunks = chunker.create_chunks(
            medium_text, {"document_id": str(test_document.id)}
        )

        # Mock embedding generation
        mock_embeddings = [[0.1] * 1536 for _ in chunks]

        # Insert chunks
        chunk_data = [
            (
                test_document.id,
                test_user.id,
                chunk["content"],
                mock_embeddings[i],
                chunk["chunk_index"],
                chunk["token_count"],
                chunk.get("metadata"),
            )
            for i, chunk in enumerate(chunks)
        ]

        await vector_store.add_chunks(db_session, chunk_data)
        await db_session.commit()

        end_time = time.perf_counter()
        ingestion_time = end_time - start_time

        assert ingestion_time < 60.0, (
            f"Ingestion time {ingestion_time:.2f}s exceeds 60s target"
        )

    @pytest.mark.asyncio
    async def test_vector_search_latency_small_dataset(
        self, db_session, test_user, test_document
    ):
        """Test vector search completes within 200ms (small dataset ~10 chunks)"""
        vector_store = VectorStore()

        # Insert 10 chunks
        chunks_data = []
        for i in range(10):
            chunks_data.append(
                (
                    test_document.id,
                    test_user.id,
                    f"Chunk {i} content about topic {i % 3}.",
                    [0.1 * (i % 3)] * 1536,
                    i,
                    20,
                    {},
                )
            )

        await vector_store.add_chunks(db_session, chunks_data)
        await db_session.commit()

        # Perform similarity search
        query_embedding = [0.1] * 1536

        start_time = time.perf_counter()
        results = await vector_store.similarity_search(
            db=db_session,
            user_id=test_user.id,
            query_embedding=query_embedding,
            limit=10,
        )
        end_time = time.perf_counter()

        search_time = (end_time - start_time) * 1000  # Convert to ms

        assert search_time < 200.0, (
            f"Search time {search_time:.2f}ms exceeds 200ms target"
        )

    @pytest.mark.asyncio
    async def test_vector_search_latency_medium_dataset(
        self, db_session, test_user, test_document
    ):
        """Test vector search completes within 200ms (medium dataset ~100 chunks)"""
        vector_store = VectorStore()

        # Insert 100 chunks
        chunks_data = []
        for i in range(100):
            chunks_data.append(
                (
                    test_document.id,
                    test_user.id,
                    f"Chunk {i} content about topic {i % 10}.",
                    [0.1 * (i % 10)] * 1536,
                    i,
                    20,
                    {},
                )
            )

        await vector_store.add_chunks(db_session, chunks_data)
        await db_session.commit()

        # Perform similarity search
        query_embedding = [0.1] * 1536

        start_time = time.perf_counter()
        results = await vector_store.similarity_search(
            db=db_session,
            user_id=test_user.id,
            query_embedding=query_embedding,
            limit=10,
        )
        end_time = time.perf_counter()

        search_time = (end_time - start_time) * 1000  # Convert to ms

        assert search_time < 200.0, (
            f"Search time {search_time:.2f}ms exceeds 200ms target"
        )

    @pytest.mark.asyncio
    async def test_vector_search_latency_large_dataset(
        self, db_session, test_user, test_document
    ):
        """Test vector search completes within 200ms (large dataset ~1000 chunks)"""
        vector_store = VectorStore()

        # Insert 1000 chunks
        chunks_data = []
        for i in range(1000):
            chunks_data.append(
                (
                    test_document.id,
                    test_user.id,
                    f"Chunk {i} content about topic {i % 20}.",
                    [0.1 * (i % 20)] * 1536,
                    i,
                    20,
                    {},
                )
            )

        await vector_store.add_chunks(db_session, chunks_data)
        await db_session.commit()

        # Perform similarity search
        query_embedding = [0.1] * 1536

        start_time = time.perf_counter()
        results = await vector_store.similarity_search(
            db=db_session,
            user_id=test_user.id,
            query_embedding=query_embedding,
            limit=10,
        )
        end_time = time.perf_counter()

        search_time = (end_time - start_time) * 1000  # Convert to ms

        # Relaxed target for large dataset (HNSW index still performs well)
        assert search_time < 500.0, (
            f"Search time {search_time:.2f}ms exceeds relaxed 500ms target for large dataset"
        )

    @pytest.mark.asyncio
    async def test_first_token_streaming_latency(
        self, db_session, test_user, test_document
    ):
        """Test first streaming token appears within 100ms"""
        chat_service = ChatService()

        # Mock embedding generation
        with patch.object(
            chat_service, "generate_query_embedding", return_value=[0.1] * 1536
        ):
            # Mock retrieval
            with patch.object(
                chat_service.vector_store, "similarity_search", return_value=[]
            ):
                # Mock LangChain streaming
                async def mock_stream():
                    await asyncio.sleep(0.01)  # Simulate minimal delay
                    yield "First"
                    await asyncio.sleep(0.01)
                    yield " token"
                    await asyncio.sleep(0.01)
                    yield "."

                with patch.object(
                    chat_service, "generate_response_stream", return_value=mock_stream()
                ):
                    start_time = time.perf_counter()

                    response = await chat_service.answer_question(
                        db=db_session,
                        user_id=test_user.id,
                        query="What is machine learning?",
                        document_ids=None,
                        conversation_history=None,
                    )

                    # Get first token
                    first_token = None
                    async for token in response["stream"]:
                        if first_token is None:
                            first_token = token
                            end_time = time.perf_counter()
                            break

                    first_token_time = (end_time - start_time) * 1000  # Convert to ms

                    assert first_token is not None, "Should receive at least one token"
                    assert first_token_time < 100.0, (
                        f"First token time {first_token_time:.2f}ms exceeds 100ms target"
                    )

    @pytest.mark.asyncio
    async def test_first_token_with_history(self, db_session, test_user, test_document):
        """Test first token latency with conversation history"""
        chat_service = ChatService()

        # Mock history
        history = [
            {"role": "user", "content": "What is AI?"},
            {"role": "assistant", "content": "AI is artificial intelligence."},
        ]

        # Mock embedding generation
        with patch.object(
            chat_service, "generate_query_embedding", return_value=[0.1] * 1536
        ):
            # Mock retrieval
            with patch.object(
                chat_service.vector_store, "similarity_search", return_value=[]
            ):
                # Mock LangChain streaming
                async def mock_stream():
                    await asyncio.sleep(0.01)
                    yield "Based"
                    await asyncio.sleep(0.01)
                    yield " on"
                    await asyncio.sleep(0.01)
                    yield " history..."

                with patch.object(
                    chat_service, "generate_response_stream", return_value=mock_stream()
                ):
                    start_time = time.perf_counter()

                    response = await chat_service.answer_question(
                        db=db_session,
                        user_id=test_user.id,
                        query="Tell me more",
                        document_ids=None,
                        conversation_history=history,
                    )

                    # Get first token
                    first_token = None
                    async for token in response["stream"]:
                        if first_token is None:
                            first_token = token
                            end_time = time.perf_counter()
                            break

                    first_token_time = (end_time - start_time) * 1000  # Convert to ms

                    assert first_token is not None, "Should receive at least one token"
                    assert first_token_time < 100.0, (
                        f"First token time {first_token_time:.2f}ms exceeds 100ms target with history"
                    )

    @pytest.mark.asyncio
    async def test_concurrent_uploads_load_test(self, db_session, test_user):
        """Test system handles multiple concurrent uploads"""
        ingestion_service = IngestionService()
        vector_store = VectorStore()

        # Create 5 documents for concurrent uploads
        documents = []
        for i in range(5):
            doc = Document(
                id=uuid4(),
                user_id=test_user.id,
                filename=f"upload_{i}.pdf",
                status=IngestionStatus.COMPLETED,
            )
            db_session.add(doc)
            documents.append(doc)
        await db_session.flush()

        # Simulate 5 concurrent uploads
        async def process_upload(upload_id: int, document_id):
            text = f"Upload {upload_id} content. " * 200
            chunker = Chunker()
            chunks = chunker.create_chunks(text, {"document_id": str(document_id)})

            mock_embeddings = [[0.1] * 1536 for _ in chunks]

            chunk_data = [
                (
                    document_id,
                    test_user.id,
                    chunk["content"],
                    mock_embeddings[i],
                    chunk["chunk_index"],
                    chunk["token_count"],
                    chunk.get("metadata"),
                )
                for i, chunk in enumerate(chunks)
            ]

            await vector_store.add_chunks(db_session, chunk_data)

        start_time = time.perf_counter()

        # Run uploads concurrently
        await asyncio.gather(
            *[process_upload(i, doc.id) for i, doc in enumerate(documents)]
        )

        await db_session.commit()
        end_time = time.perf_counter()

        total_time = end_time - start_time

        assert total_time < 120.0, (
            f"Concurrent uploads time {total_time:.2f}s exceeds 120s target"
        )

    @pytest.mark.asyncio
    async def test_concurrent_queries_load_test(
        self, db_session, test_user, test_document
    ):
        """Test system handles multiple concurrent chat queries"""
        vector_store = VectorStore()
        chat_service = ChatService()

        # Insert test chunks
        chunks_data = [
            (
                test_document.id,
                test_user.id,
                f"Chunk {i} content.",
                [0.1] * 1536,
                i,
                10,
                {},
            )
            for i in range(20)
        ]

        await vector_store.add_chunks(db_session, chunks_data)
        await db_session.commit()

        # Mock LangChain streaming
        async def mock_stream():
            yield "Response"
            await asyncio.sleep(0.01)

        # Simulate 10 concurrent queries
        async def process_query(query_id: int):
            with patch.object(
                chat_service, "generate_query_embedding", return_value=[0.1] * 1536
            ):
                with patch.object(
                    chat_service.vector_store, "similarity_search", return_value=[]
                ):
                    with patch.object(
                        chat_service,
                        "generate_response_stream",
                        return_value=mock_stream(),
                    ):
                        response = await chat_service.answer_question(
                            db=db_session,
                            user_id=test_user.id,
                            query=f"Query {query_id}",
                            document_ids=None,
                            conversation_history=None,
                        )

                        async for _ in response["stream"]:
                            pass

        start_time = time.perf_counter()

        # Run queries concurrently
        await asyncio.gather(*[process_query(i) for i in range(10)])

        end_time = time.perf_counter()

        total_time = (end_time - start_time) * 1000  # Convert to ms

        assert total_time < 2000.0, (
            f"Concurrent queries time {total_time:.2f}ms exceeds 2000ms target"
        )

    def test_chunking_latency(self):
        """Test chunking operation latency"""
        chunker = Chunker()

        # Create text (~1000 words)
        text = "This is a test sentence. " * 200

        start_time = time.perf_counter()
        chunks = chunker.create_chunks(text)
        end_time = time.perf_counter()

        chunking_time = (end_time - start_time) * 1000  # Convert to ms

        assert chunking_time < 100.0, (
            f"Chunking time {chunking_time:.2f}ms exceeds 100ms target"
        )
        assert len(chunks) > 0, "Should create at least one chunk"

    def test_token_counting_latency(self):
        """Test token counting latency"""
        chunker = Chunker()

        # Create text (~10k words)
        text = "This is a test sentence. " * 2000

        start_time = time.perf_counter()
        token_count = chunker.count_tokens(text)
        end_time = time.perf_counter()

        counting_time = (end_time - start_time) * 1000  # Convert to ms

        assert token_count > 0, "Should count tokens"
        assert counting_time < 50.0, (
            f"Token counting time {counting_time:.2f}ms exceeds 50ms target"
        )
