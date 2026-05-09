"""Embedding provider helpers for RAG ingestion and retrieval."""

from __future__ import annotations

import logging

from app.core.config import settings


logger = logging.getLogger(__name__)


class EmbeddingConfigurationError(RuntimeError):
    """Raised when embedding provider configuration is invalid."""


def validate_embedding_configuration() -> None:
    """Validate the selected embedding provider before making external calls.

    The provider must be explicit when the operator wants Voyage. If it is left
    empty, ``settings.embedding_provider`` intentionally auto-detects from keys.
    Validate here so a typo or missing key does not silently produce a confusing
    third-party error later in the ingestion pipeline.
    """

    provider = settings.embedding_provider
    valid_providers = {"voyage", "zhipuai", "openai"}

    if provider not in valid_providers:
        if provider == "google":
            raise EmbeddingConfigurationError(
                "EMBEDDING_PROVIDER=google is not supported for document/query "
                "embeddings in this project. Use EMBEDDING_PROVIDER=voyage with "
                "VOYAGE_API_KEY; Google/Gemini is reserved for chat LLM/OAuth."
            )
        raise EmbeddingConfigurationError(
            f"Unsupported EMBEDDING_PROVIDER={provider!r}. Use one of: "
            f"{', '.join(sorted(valid_providers))}."
        )

    if not settings.embedding_api_key:
        env_var = {
            "voyage": "VOYAGE_API_KEY",
            "zhipuai": "ZHIPUAI_API_KEY",
            "openai": "OPENAI_API_KEY",
        }[provider]
        raise EmbeddingConfigurationError(
            f"EMBEDDING_PROVIDER={provider} is selected but {env_var} is not set."
        )

    if provider == "voyage" and settings.EMBEDDING_DIMENSION != 512:
        logger.warning(
            "Voyage embedding provider selected with EMBEDDING_DIMENSION=%s. "
            "This project previously used Voyage at 512 dimensions; ensure the "
            "chunks.embedding pgvector column has the same dimension as the "
            "configured embeddings before re-ingesting documents.",
            settings.EMBEDDING_DIMENSION,
        )


def build_embeddings_client():
    """Build the configured embedding client without provider fallback."""

    validate_embedding_configuration()
    provider = settings.embedding_provider

    from openai import AsyncOpenAI

    return AsyncOpenAI(
        api_key=settings.embedding_api_key,
        base_url=settings.embedding_base_url,
    )
