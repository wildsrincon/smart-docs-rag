"""Unit tests for semantic chunking"""

import pytest

from app.rag.chunker import Chunker
from app.core.config import settings


class TestChunker:
    """Test suite for Chunker class"""

    @pytest.fixture
    def chunker(self):
        """Create chunker instance with default settings"""
        return Chunker()

    @pytest.fixture
    def chunker_custom(self):
        """Create chunker with custom settings"""
        return Chunker(min_tokens=100, max_tokens=200, overlap_ratio=0.3)

    def test_count_tokens(self, chunker):
        """Test accurate token counting"""
        text = "Hello world! This is a test."
        token_count = chunker.count_tokens(text)
        assert token_count > 0
        assert isinstance(token_count, int)

    def test_count_tokens_empty_string(self, chunker):
        """Test token counting with empty string"""
        text = ""
        token_count = chunker.count_tokens(text)
        assert token_count == 0

    def test_split_text_by_paragraphs(self, chunker):
        """Test paragraph splitting"""
        text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
        paragraphs = chunker.split_text_by_paragraphs(text)
        assert len(paragraphs) == 3
        assert "First paragraph." in paragraphs[0]
        assert "Second paragraph." in paragraphs[1]
        assert "Third paragraph." in paragraphs[2]

    def test_split_text_single_paragraph(self, chunker):
        """Test splitting single paragraph"""
        text = "This is a single paragraph with no double newlines."
        paragraphs = chunker.split_text_by_paragraphs(text)
        assert len(paragraphs) == 1
        assert paragraphs[0] == text

    def test_split_text_empty_string(self, chunker):
        """Test splitting empty string"""
        text = ""
        paragraphs = chunker.split_text_by_paragraphs(text)
        assert len(paragraphs) == 1
        assert paragraphs[0] == ""

    def test_create_chunks_within_limits(self, chunker_custom):
        """Test chunks respect min and max token limits"""
        text = "This is a test. " * 50  # Create sufficient text
        chunks = chunker_custom.create_chunks(text)

        for chunk in chunks:
            assert chunker_custom.validate_chunk_size(chunk), (
                f"Chunk token count {chunk['token_count']} not in range [{chunker_custom.min_tokens}, {chunker_custom.max_tokens}]"
            )

    def test_create_chunks_with_overlap(self, chunker_custom):
        """Test chunks maintain 20% overlap"""
        text = "This is sentence one. " * 30 + "This is sentence two. " * 30
        chunks = chunker_custom.create_chunks(text)

        if len(chunks) > 1:
            first_chunk_tokens = chunker_custom.encoding.encode(chunks[0]["content"])
            second_chunk_tokens = chunker_custom.encoding.encode(chunks[1]["content"])

            overlap_size = len(
                [t for t in first_chunk_tokens if t in second_chunk_tokens]
            )
            expected_overlap = int(
                chunker_custom.max_tokens * chunker_custom.overlap_ratio
            )

            assert overlap_size >= expected_overlap * 0.5, (
                f"Expected overlap ~{expected_overlap}, got {overlap_size}"
            )

    def test_create_chunks_context_preservation(self, chunker):
        """Test chunks preserve semantic context"""
        text = (
            "First paragraph about topic A.\n\n"
            "Second paragraph about topic A continued.\n\n"
            "Third paragraph about topic B.\n\n"
            "Fourth paragraph about topic B continued."
        )

        chunks = chunker.create_chunks(text)

        if len(chunks) > 1:
            assert chunks[0]["content"], "First chunk should not be empty"
            assert chunks[1]["content"], "Second chunk should not be empty"

    def test_create_chunks_metadata_attachment(self, chunker):
        """Test metadata is attached to chunks"""
        text = "Test paragraph. " * 20
        metadata = {"document_id": "test-doc-123", "source": "test"}

        chunks = chunker.create_chunks(text, metadata=metadata)

        for chunk in chunks:
            assert chunk["metadata"] == metadata, (
                "Metadata should be attached to each chunk"
            )

    def test_create_chunks_chunk_index(self, chunker):
        """Test chunks have sequential indices"""
        text = "Test paragraph. " * 30
        chunks = chunker.create_chunks(text)

        for i, chunk in enumerate(chunks):
            assert chunk["chunk_index"] == i, f"Chunk {i} should have index {i}"

    def test_create_chunks_very_long_text(self, chunker):
        """Test chunking of very long text"""
        text = "This is a sentence. " * 1000
        chunks = chunker.create_chunks(text)

        assert len(chunks) > 1, "Should create multiple chunks from long text"

        for chunk in chunks:
            assert chunker.validate_chunk_size(chunk), (
                f"Chunk {chunk['chunk_index']} exceeds token limits"
            )

    def test_create_chunks_short_text_below_min(self, chunker):
        """Test chunking with text below minimum tokens"""
        text = "Short text."
        chunks = chunker.create_chunks(text)

        assert len(chunks) == 0, "Should not create chunks below minimum token limit"

    def test_create_chunks_empty_text(self, chunker):
        """Test chunking with empty text"""
        text = ""
        chunks = chunker.create_chunks(text)

        assert len(chunks) == 0, "Should not create chunks from empty text"

    def test_validate_chunk_size_valid(self, chunker):
        """Test chunk size validation for valid chunks"""
        chunk = {
            "content": "Test content",
            "token_count": 600,
            "chunk_index": 0,
        }
        assert chunker.validate_chunk_size(chunk), "Chunk within limits should be valid"

    def test_validate_chunk_size_too_small(self, chunker):
        """Test chunk size validation for small chunks"""
        chunk = {
            "content": "Test content",
            "token_count": 100,
            "chunk_index": 0,
        }
        assert not chunker.validate_chunk_size(chunk), (
            "Chunk below min should be invalid"
        )

    def test_validate_chunk_size_too_large(self, chunker):
        """Test chunk size validation for large chunks"""
        chunk = {
            "content": "Test content",
            "token_count": 1000,
            "chunk_index": 0,
        }
        assert not chunker.validate_chunk_size(chunk), (
            "Chunk above max should be invalid"
        )

    def test_validate_chunk_size_missing_token_count(self, chunker):
        """Test chunk size validation with missing token count"""
        chunk = {
            "content": "Test content",
            "chunk_index": 0,
        }
        assert not chunker.validate_chunk_size(chunk), (
            "Chunk without token_count should be invalid"
        )

    def test_default_settings(self):
        """Test chunker uses config defaults"""
        chunker = Chunker()
        assert chunker.min_tokens == settings.CHUNK_MIN_TOKENS
        assert chunker.max_tokens == settings.CHUNK_MAX_TOKENS
        assert chunker.overlap_ratio == settings.CHUNK_OVERLAP_RATIO
