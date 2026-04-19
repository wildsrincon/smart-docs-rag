"""Redis pub/sub notifier for cross-worker WebSocket notifications.

When running multiple uvicorn workers each process has its own in-memory
WebSocket registry. A notification published by worker-2 (e.g. ingestion
background task) would never reach a user connected to worker-1.

This module solves that by routing notifications through Redis:
  Publisher  → redis_notifier.publish(user_id, message)  → Redis channel ws:{user_id}
  Subscriber → redis_notifier.subscribe(user_id)          → yields messages from that channel

If REDIS_URL is not configured the module degrades gracefully:
  - publish()   returns False (caller falls back to direct send)
  - subscribe() yields nothing (no-op)
"""

import asyncio
import json
import logging
from typing import AsyncGenerator
from uuid import UUID

logger = logging.getLogger(__name__)

try:
    import redis.asyncio as aioredis

    _REDIS_AVAILABLE = True
except ImportError:
    _REDIS_AVAILABLE = False
    logger.warning(
        "redis package not installed. "
        "WebSocket notifications will only work in single-worker deployments. "
        "Install with: pip install redis[asyncio]"
    )


class RedisNotifier:
    """Redis pub/sub bridge for cross-worker WebSocket notifications."""

    def __init__(self) -> None:
        self._redis_url: str = ""
        self._client: "aioredis.Redis | None" = None  # type: ignore[name-defined]

    def configure(self, redis_url: str) -> None:
        """Set the Redis URL. Called once at application startup."""
        self._redis_url = redis_url
        self._client = None  # Reset so next call to _get_client creates a fresh one

    @property
    def is_available(self) -> bool:
        return bool(self._redis_url and _REDIS_AVAILABLE)

    async def _get_client(self) -> "aioredis.Redis | None":  # type: ignore[name-defined]
        if not self.is_available:
            return None
        if self._client is None:
            self._client = aioredis.from_url(self._redis_url, decode_responses=True)
        return self._client

    async def publish(self, user_id: UUID, message: dict) -> bool:
        """Publish a notification to the user's channel.

        Returns True if published to Redis, False if Redis is not available
        (caller should fall back to direct in-process send).
        """
        client = await self._get_client()
        if client is None:
            return False
        try:
            await client.publish(f"ws:{user_id}", json.dumps(message))
            return True
        except Exception as e:
            logger.error(f"Redis publish error for user {user_id}: {e}")
            return False

    async def subscribe(self, user_id: UUID) -> AsyncGenerator[dict, None]:
        """Subscribe to the user's notification channel and yield messages.

        This is a long-running async generator — run it inside an asyncio.Task.
        Raises asyncio.CancelledError when the task is cancelled (on disconnect).
        """
        client = await self._get_client()
        if client is None:
            return

        channel = f"ws:{user_id}"
        pubsub = client.pubsub()
        try:
            await pubsub.subscribe(channel)
            logger.debug(f"Redis: subscribed to channel {channel}")
            async for raw in pubsub.listen():
                if raw["type"] == "message":
                    try:
                        yield json.loads(raw["data"])
                    except (json.JSONDecodeError, TypeError):
                        logger.warning(f"Redis: malformed message on {channel}: {raw['data']!r}")
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.error(f"Redis subscribe error on {channel}: {e}")
        finally:
            try:
                await pubsub.unsubscribe(channel)
                await pubsub.aclose()
            except Exception:
                pass


# Module-level singleton — configure() is called in main.py startup
redis_notifier = RedisNotifier()
