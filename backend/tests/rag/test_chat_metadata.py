"""Tests for resilient RAG chat metadata parsing."""

from app.rag.chat_service import ChatService


def test_parse_chunk_metadata_accepts_json_object_string():
    metadata = ChatService._parse_chunk_metadata('{"filename": "doc.pdf"}')

    assert metadata == {"filename": "doc.pdf"}


def test_parse_chunk_metadata_accepts_legacy_python_repr():
    metadata = ChatService._parse_chunk_metadata("{'filename': 'legacy.pdf'}")

    assert metadata == {"filename": "legacy.pdf"}


def test_parse_chunk_metadata_degrades_invalid_string():
    metadata = ChatService._parse_chunk_metadata("{invalid")

    assert metadata == {}


def test_parse_chunk_metadata_degrades_non_object_json():
    metadata = ChatService._parse_chunk_metadata('["not", "an", "object"]')

    assert metadata == {}
