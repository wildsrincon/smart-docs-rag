"""Reindex all chunks with Voyage AI voyage-4-lite (512d).

This script migrates all existing chunk embeddings from their current
format (e.g., GLM 2048d) to Voyage AI's voyage-4-lite model (512 dimensions).

Usage:
    # Inside the backend container
    cd /app
    python -m scripts.reindex_chunks_with_voyage

    # Or with explicit API key (overrides .env)
    OPENAI_API_KEY=your-voyage-key python -m scripts.reindex_chunks_with_voyage
"""

import asyncio
import logging
import os
import sys

from dotenv import load_dotenv
from openai import AsyncOpenAI
from sqlalchemy import text

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@db:5432/app_db",
)
VOYAGE_API_KEY = os.getenv("OPENAI_API_KEY", "")  # Using OPENAI_API_KEY for Voyage AI
VOYAGE_BASE_URL = os.getenv(
    "OPENAI_BASE_URL",
    "https://api.voyageai.com/v1/",
)
EMBEDDING_MODEL = os.getenv(
    "OPENAI_EMBEDDING_MODEL",
    "voyage-4-lite",  # 512 dimensions by default
)
BATCH_SIZE = 5  # Respect Voyage AI rate limits (500 RPM, 200K TPM)


async def get_db_connection():
    """Create a database connection."""
    from sqlalchemy.ext.asyncio import create_async_engine

    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        yield conn
    await engine.dispose()


async def fetch_chunks(conn) -> list[dict]:
    """Fetch all chunks from the database."""
    result = await conn.execute(
        text("SELECT id, content, document_id FROM chunks ORDER BY created_at")
    )
    rows = result.fetchall()
    return [
        {"id": str(row[0]), "content": row[1], "document_id": str(row[2])}
        for row in rows
    ]


async def fetch_document_text(conn, document_id: str) -> str | None:
    """Fetch document text from storage (simplified for this script)."""
    # For now, we'll use chunk content as the text to embed
    # In production, you might fetch the full document from storage
    return None


async def generate_embeddings(
    client: AsyncOpenAI, texts: list[str]
) -> list[list[float]]:
    """Generate embeddings for a batch of texts using Voyage AI.

    Voyage AI's voyage-4-lite model generates 512-dimensional embeddings by default.
    No need to specify dimensions parameter.
    """
    response = await client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [item.embedding for item in response.data]


async def update_embedding(conn, chunk_id: str, embedding: list[float]):
    """Update a chunk's embedding in the database."""
    # Convert embedding list to PostgreSQL vector format
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
    await conn.execute(
        text("UPDATE chunks SET embedding = :emb::vector WHERE id = :id"),
        {"emb": embedding_str, "id": chunk_id},
    )


async def main():
    """Main re-index process."""
    # Validate API key
    if not VOYAGE_API_KEY or VOYAGE_API_KEY == "tu-api-key-de-voyage-aqui":
        logger.error(
            "VOYAGE_API_KEY not set or is still placeholder. "
            "Please set OPENAI_API_KEY in backend/.env with your actual Voyage AI API key."
        )
        logger.error("Get your key at: https://dash.voyageai.com/")
        sys.exit(1)

    # Initialize Voyage AI client (using OpenAI-compatible SDK)
    client = AsyncOpenAI(api_key=VOYAGE_API_KEY, base_url=VOYAGE_BASE_URL)
    logger.info(f"🚀 Starting re-index with Voyage AI")
    logger.info(f"📊 Model: {EMBEDDING_MODEL}")
    logger.info(f"📊 Base URL: {VOYAGE_BASE_URL}")
    logger.info(f"📊 Batch size: {BATCH_SIZE}")

    # Connect to database
    from sqlalchemy.ext.asyncio import create_async_engine

    engine = create_async_engine(DATABASE_URL)

    async with engine.begin() as conn:
        # Fetch all chunks
        chunks = await fetch_chunks(conn)
        total_chunks = len(chunks)

        if total_chunks == 0:
            logger.warning("⚠️  No chunks found to re-index. Exiting.")
            return

        logger.info(f"📊 Found {total_chunks} chunks to re-index")
        logger.info(f"📊 Embedding dimension: 512 (voyage-4-lite)")

        success = 0
        failed = 0

        # Process chunks in batches
        for i in range(0, total_chunks, BATCH_SIZE):
            batch = chunks[i : i + BATCH_SIZE]
            batch_num = i // BATCH_SIZE + 1

            try:
                # Prepare texts for embedding
                texts = [c["content"] for c in batch]

                logger.info(
                    f"📦 Processing batch {batch_num}: chunks {i + 1}-{min(i + BATCH_SIZE, total_chunks)}"
                )

                # Generate embeddings with Voyage AI
                embeddings = await generate_embeddings(client, texts)

                # Verify embedding dimension
                if embeddings:
                    emb_dim = len(embeddings[0])
                    if emb_dim != 512:
                        logger.error(
                            f"❌ Invalid embedding dimension: {emb_dim}. Expected 512."
                        )
                        raise ValueError(f"Expected 512 dimensions, got {emb_dim}")

                # Update each chunk's embedding
                for chunk, emb in zip(batch, embeddings):
                    await update_embedding(conn, chunk["id"], emb)
                    logger.debug(
                        f"  ✅ Chunk {chunk['id']}: embedding generated ({len(emb)}d)"
                    )

                success += len(batch)
                logger.info(
                    f"✅ Batch {batch_num} completed: {len(batch)} chunks embedded ({i + len(batch)}/{total_chunks})"
                )

            except Exception as e:
                failed += len(batch)
                logger.error(f"❌ Batch {batch_num} failed: {e}")
                logger.exception(e)

        # Commit all changes
        await conn.commit()

        # Validate results
        result = await conn.execute(
            text("SELECT COUNT(*) FROM chunks WHERE embedding IS NOT NULL")
        )
        non_null = result.scalar()

        logger.info("\n" + "=" * 60)
        logger.info("🎉 Re-index Complete!")
        logger.info("=" * 60)
        logger.info(f"📊 Total chunks processed: {total_chunks}")
        logger.info(f"✅ Success: {success}")
        logger.info(f"❌ Failed: {failed}")
        logger.info(f"📊 Non-null embeddings: {non_null}/{total_chunks}")
        logger.info("=" * 60)

        if non_null == total_chunks:
            logger.info("✅ All chunks successfully migrated to Voyage AI!")
        else:
            logger.warning(
                f"⚠️  {total_chunks - non_null} chunks still have null embeddings"
            )

    # Clean up
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
