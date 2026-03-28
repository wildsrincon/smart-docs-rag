"""Chat service for conversation management and history"""

import logging
import json
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.entities.conversation import Conversation
from app.entities.message import Message, MessageRole
from app.chat.model import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    ChatHistoryResponse,
)

logger = logging.getLogger(__name__)


class ChatService:
    """Service for managing conversations and messages"""

    async def create_conversation(
        self, db: AsyncSession, user_id: UUID, title: str
    ) -> ConversationResponse:
        """Create a new conversation"""
        try:
            conversation = Conversation(user_id=user_id, title=title)
            db.add(conversation)
            await db.flush()

            logger.info(f"Created conversation: {conversation.id}")
            return ConversationResponse.model_validate(conversation)

        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            raise

    async def get_conversations(
        self, db: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[ConversationResponse]:
        """Get all conversations for a user"""
        try:
            result = await db.execute(
                select(Conversation)
                .where(Conversation.user_id == user_id)
                .order_by(Conversation.updated_at.desc())
                .offset(skip)
                .limit(limit)
            )
            conversations = result.scalars().all()
            return [ConversationResponse.model_validate(conv) for conv in conversations]

        except Exception as e:
            logger.error(f"Error getting conversations: {e}")
            raise

    async def get_conversation(
        self, db: AsyncSession, conversation_id: UUID, user_id: UUID
    ) -> Optional[ConversationResponse]:
        """Get a specific conversation by ID"""
        try:
            result = await db.execute(
                select(Conversation)
                .where(Conversation.id == conversation_id)
                .where(Conversation.user_id == user_id)
            )
            conversation = result.scalar_one_or_none()
            if not conversation:
                return None
            return ConversationResponse.model_validate(conversation)

        except Exception as e:
            logger.error(f"Error getting conversation: {e}")
            raise

    async def create_message(
        self,
        db: AsyncSession,
        conversation_id: UUID,
        user_id: UUID,
        role: MessageRole,
        content: str,
        tokens: Optional[int] = None,
        document_ids: Optional[List[UUID]] = None,
    ) -> MessageResponse:
        """Create a new message in a conversation"""
        try:
            message = Message(
                conversation_id=conversation_id,
                user_id=user_id,
                role=role,
                content=content,
                tokens=tokens,
                document_ids=json.dumps(document_ids) if document_ids else None,
            )
            db.add(message)
            await db.flush()

            # Update conversation timestamp
            await db.execute(
                select(Conversation).where(Conversation.id == conversation_id)
            )
            # Note: We need to actually update, but this is simplified

            logger.info(
                f"Created message: {message.id} in conversation {conversation_id}"
            )
            return MessageResponse.model_validate(message)

        except Exception as e:
            logger.error(f"Error creating message: {e}")
            raise

    async def get_conversation_history(
        self, db: AsyncSession, conversation_id: UUID, user_id: UUID
    ) -> Optional[List[MessageResponse]]:
        """Get all messages for a conversation"""
        try:
            # Verify conversation belongs to user
            conv_result = await db.execute(
                select(Conversation)
                .where(Conversation.id == conversation_id)
                .where(Conversation.user_id == user_id)
            )
            if not conv_result.scalar_one_or_none():
                return None

            # Get messages
            result = await db.execute(
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.created_at)
            )
            messages = result.scalars().all()
            return [MessageResponse.model_validate(msg) for msg in messages]

        except Exception as e:
            logger.error(f"Error getting conversation history: {e}")
            raise

    async def delete_conversation(
        self, db: AsyncSession, conversation_id: UUID, user_id: UUID
    ) -> bool:
        """Delete a conversation and its messages (CASCADE)"""
        try:
            result = await db.execute(
                select(Conversation)
                .where(Conversation.id == conversation_id)
                .where(Conversation.user_id == user_id)
            )
            conversation = result.scalar_one_or_none()
            if not conversation:
                return False

            await db.delete(conversation)
            await db.flush()

            logger.info(f"Deleted conversation: {conversation_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting conversation: {e}")
            raise

    async def update_conversation_title(
        self, db: AsyncSession, conversation_id: UUID, user_id: UUID, title: str
    ) -> Optional[ConversationResponse]:
        """Update a conversation's title"""
        try:
            result = await db.execute(
                select(Conversation)
                .where(Conversation.id == conversation_id)
                .where(Conversation.user_id == user_id)
            )
            conversation = result.scalar_one_or_none()
            if not conversation:
                return None

            conversation.title = title
            await db.flush()

            logger.info(f"Updated conversation title: {conversation_id} -> {title}")
            return ConversationResponse.model_validate(conversation)

        except Exception as e:
            logger.error(f"Error updating conversation title: {e}")
            raise

    def format_history_for_langchain(
        self, messages: List[MessageResponse]
    ) -> List[dict]:
        """Format messages for LangChain consumption"""
        return [{"role": msg.role.value, "content": msg.content} for msg in messages]
