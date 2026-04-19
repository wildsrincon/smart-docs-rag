"""WebSocket handler for real-time chat streaming"""

import asyncio
import json
import logging
from typing import Dict, Optional
from uuid import UUID

from fastapi import WebSocket, WebSocketDisconnect, status
from pydantic import ValidationError

from app.auth.service import verify_token, get_current_user
from app.notifications.redis_notifier import redis_notifier
from app.rag.model import (
    WebSocketMessage,
    UserQueryMessage,
    AssistantResponseMessage,
    ErrorMessage,
    StatusMessage,
    DocumentStatusMessage,
    UserQueryData,
    AssistantResponseData,
    ErrorData,
    StatusData,
    DocumentStatusData,
)
from app.rag.chat_service import ChatService
from app.chat.service import ChatService as ConversationService
from app.chat.model import MessageCreate, MessageResponse
from app.database.core import AsyncSession, get_db
from app.entities.message import MessageRole
from app.entities.document import IngestionStatus

logger = logging.getLogger(__name__)


class WebSocketHandler:
    """Manages WebSocket connections and message routing for RAG chat"""

    def __init__(self):
        self.active_connections: Dict[UUID, WebSocket] = {}
        self._listener_tasks: Dict[UUID, asyncio.Task] = {}
        self.chat_service = ChatService()
        self.conversation_service = ConversationService()

    async def connect(
        self, websocket: WebSocket, token: str
    ) -> tuple[bool, Optional[str], Optional[UUID]]:
        """
        Accept and authenticate WebSocket connection.

        Returns:
            Tuple of (success, error_message, user_id)
        """
        try:
            # Verify token
            token_data = verify_token(token)
            user_id = UUID(token_data.user_id)

            # Accept connection
            await websocket.accept()
            self.active_connections[user_id] = websocket

            # Start Redis subscriber task for cross-worker notifications
            if redis_notifier.is_available:
                task = asyncio.create_task(self._redis_listener(user_id, websocket))
                self._listener_tasks[user_id] = task
                logger.debug(f"Redis listener started for user {user_id}")

            logger.info(f"WebSocket connected for user {user_id}")

            # Send connection confirmation
            await self.send_message(
                user_id, {"type": "status", "data": {"state": "connected"}}
            )

            return True, None, user_id

        except Exception as e:
            logger.error(f"WebSocket connection failed: {e}")
            return False, str(e), None

    def disconnect(self, user_id: UUID) -> None:
        """Remove connection and cancel Redis listener task"""
        self.active_connections.pop(user_id, None)
        task = self._listener_tasks.pop(user_id, None)
        if task and not task.done():
            task.cancel()
        logger.info(f"WebSocket disconnected for user {user_id}")

    async def send_message(self, user_id: UUID, message: dict) -> bool:
        """
        Send message to specific user.

        Returns:
            True if sent successfully, False otherwise
        """
        try:
            if user_id in self.active_connections:
                websocket = self.active_connections[user_id]
                await websocket.send_json(message)
                return True
            return False
        except Exception as e:
            logger.error(f"Error sending message to user {user_id}: {e}")
            self.disconnect(user_id)
            return False

    async def broadcast_status(
        self, user_id: UUID, status: str, conversation_id: Optional[UUID] = None
    ) -> None:
        """Send status update to user"""
        message = {
            "type": "status",
            "data": {
                "state": status,
                "conversation_id": str(conversation_id) if conversation_id else None,
            },
        }
        await self.send_message(user_id, message)

    async def send_error(self, user_id: UUID, code: str, message: str) -> None:
        """Send error message to user"""
        error_message = {"type": "error", "data": {"code": code, "message": message}}
        await self.send_message(user_id, error_message)

    async def send_document_status(
        self, user_id: UUID, document_id: UUID, status: IngestionStatus, progress: int
    ) -> None:
        """Send document ingestion status update to user.

        Publishes via Redis so the notification reaches the user regardless of
        which worker they are connected to. Falls back to direct in-process send
        when Redis is not configured (single-worker mode).
        """
        message = {
            "type": "document_status",
            "data": {
                "document_id": str(document_id),
                "status": status.value,
                "progress": progress,
            },
        }
        published = await redis_notifier.publish(user_id, message)
        if not published:
            # Redis not available — direct send works only within the same worker
            await self.send_message(user_id, message)

    async def _redis_listener(self, user_id: UUID, websocket: WebSocket) -> None:
        """Background task: subscribe to Redis channel and forward messages to WebSocket."""
        try:
            async for message in redis_notifier.subscribe(user_id):
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(
                        f"Failed to forward Redis message to user {user_id}: {e}"
                    )
                    break
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Redis listener task error for user {user_id}: {e}")
        finally:
            logger.debug(f"Redis listener stopped for user {user_id}")

    async def handle_user_query(
        self, websocket: WebSocket, message: dict, user_id: UUID, db: AsyncSession
    ) -> None:
        """
        Handle user query message with RAG processing.

        Args:
            websocket: WebSocket connection
            message: Incoming message dict
            user_id: User UUID
            db: Database session
        """
        try:
            # Parse message
            data = UserQueryData(**message.get("data", {}))
            document_ids = [data.document_id] if data.document_id else None
            conversation_id = data.conversation_id

            # Create conversation if not provided
            if not conversation_id:
                conversation = await self.conversation_service.create_conversation(
                    db, user_id, "New Conversation"
                )
                conversation_id = conversation.id
            else:
                # Verify conversation exists
                conv = await self.conversation_service.get_conversation(
                    db, conversation_id, user_id
                )
                if not conv:
                    await self.send_error(
                        user_id, "NOT_FOUND", "Conversation not found"
                    )
                    return

            # Save user message
            await self.conversation_service.create_message(
                db, conversation_id, user_id, MessageRole.USER, data.text
            )
            await db.flush()

            # Send processing status
            await self.broadcast_status(user_id, "processing", conversation_id)

            # Get conversation history
            history_messages = await self.conversation_service.get_conversation_history(
                db, conversation_id, user_id
            )
            history = (
                self.conversation_service.format_history_for_langchain(history_messages)
                if history_messages
                else None
            )

            # Get RAG response
            language = data.language or "en"
            response_data = await self.chat_service.answer_question(
                db, user_id, data.text, document_ids, history, language=language
            )

            # Stream assistant response
            full_response = ""
            async for token in response_data["stream"]:
                full_response += token
                await self.send_message(
                    user_id,
                    {
                        "type": "assistant_response",
                        "data": {"token": token, "done": False},
                    },
                )

            # Send done message with citations
            citations = response_data.get("citations", [])
            await self.send_message(
                user_id,
                {
                    "type": "assistant_response",
                    "data": {
                        "token": "",
                        "done": True,
                        "citations": citations,
                    },
                },
            )

            # Save assistant message
            citation_data = response_data.get("citations", [])
            doc_ids = list(
                set(c.get("document_id") for c in citation_data if c.get("document_id"))
            )
            await self.conversation_service.create_message(
                db,
                conversation_id,
                user_id,
                MessageRole.ASSISTANT,
                full_response,
                tokens=None,
                document_ids=doc_ids,
            )
            await db.flush()

            # Send completion status
            await self.broadcast_status(user_id, "complete", conversation_id)

        except ValidationError as e:
            logger.error(f"Invalid message format: {e}")
            await self.send_error(user_id, "INVALID_FORMAT", "Invalid message format")
        except Exception as e:
            logger.error(f"Error handling user query: {e}")
            await self.send_error(user_id, "PROCESSING_ERROR", str(e))

    async def handle_message(
        self, websocket: WebSocket, message: dict, user_id: UUID, db: AsyncSession
    ) -> None:
        """
        Route incoming message to appropriate handler.

        Args:
            websocket: WebSocket connection
            message: Incoming message dict
            user_id: User UUID
            db: Database session
        """
        message_type = message.get("type")

        if message_type == "user_query":
            await self.handle_user_query(websocket, message, user_id, db)
        else:
            logger.warning(f"Unknown message type: {message_type}")
            await self.send_error(
                user_id, "UNKNOWN_TYPE", f"Unknown message type: {message_type}"
            )


# Global WebSocket handler instance
websocket_handler = WebSocketHandler()
