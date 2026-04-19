"""Reindex all chunks with GLM embedding-3 (2048d).

Usage:
    python -m scripts.reindex_chunks
    ZHIPUAI_API_KEY=xxx python -m scripts.reindex_chunks
"""

import asyncio
import logging
import os
import sys

from dotenv import load_dotenv
from openai import AsyncOpenAI
from sqlalchemy import text

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@db:5432/app_db",
)
ZHIPUAI_API_KEY = os.getenv("ZHIPUAI_API_KEY", "")
ZHIPUAI_BASE_URL = os.getenv(
    "ZHIPUAI_BASE_URL", "https://open.bigmodel.cn/api/paas/v4/"
)
EMBEDDING_MODEL = os.getenv("ZHIPUAI_EMBEDDING_MODEL", "embedding-3")
BATCH_SIZE = 5


async def get_db_connection():
    from sqlalchemy.ext.asyncio import create_async_engine

    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        yield conn
    await engine.dispose()


async def fetch_chunks(conn) -> list[dict]:
    result = await conn.execute(
        text("SELECT id, content FROM chunks ORDER BY created_at")
    )
    rows = result.fetchall()
    return [{"id": str(row[0]), "content": row[1]} for row in rows]


async def generate_embeddings(
    client: AsyncOpenAI, texts: list[str]
) -> list[list[float]]:
    response = await client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [item.embedding for item in response.data]


async def update_embedding(conn, chunk_id: str, embedding: list[float]):
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
    await conn.execute(
        text("UPDATE chunks SET embedding = :emb WHERE id = :id"),
        {"emb": embedding_str, "id": chunk_id},
    )


async def main():
    if not ZHIPUAI_API_KEY:
        logger.error("ZHIPUAI_API_KEY not set. Cannot reindex.")
        sys.exit(1)

    client = AsyncOpenAI(api_key=ZHIPUAI_API_KEY, base_url=ZHIPUAI_BASE_URL)
    logger.info(f"Using model: {EMBEDDING_MODEL}, base_url: {ZHIPUAI_BASE_URL}")

    from sqlalchemy.ext.asyncio import create_async_engine

    engine = create_async_engine(DATABASE_URL)

    async with engine.begin() as conn:
        chunks = await fetch_chunks(conn)
        logger.info(f"Found {len(chunks)} chunks to reindex")

        success = 0
        failed = 0

        for i in range(0, len(chunks), BATCH_SIZE):
            batch = chunks[i : i + BATCH_SIZE]
            try:
                texts = [c["content"] for c in batch]
                embeddings = await generate_embeddings(client, texts)

                for chunk, emb in zip(batch, embeddings):
                    await update_embedding(conn, chunk["id"], emb)

                success += len(batch)
                logger.info(
                    f"Batch {i // BATCH_SIZE + 1}: {len(batch)} chunks embedded ({i + len(batch)}/{len(chunks)})"
                )
            except Exception as e:
                failed += len(batch)
                logger.error(f"Batch {i // BATCH_SIZE + 1} failed: {e}")

        await conn.commit()

        result = await conn.execute(
            text("SELECT COUNT(*) FROM chunks WHERE embedding IS NOT NULL")
        )
        non_null = result.scalar()
        logger.info(
            f"Reindex complete. Success: {success}, Failed: {failed}, Non-null embeddings: {non_null}"
        )

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
