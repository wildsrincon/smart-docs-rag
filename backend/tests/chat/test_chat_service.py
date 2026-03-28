"""Unit tests for ChatService"""

import pytest
import pytest_asyncio
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession

from app.chat.service import ChatService
from app.chat.model import ConversationCreate, MessageCreate
from app.entities.conversation import Conversation
from app.entities.message import Message, MessageRole
from app.entities.user import User


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession):
    """Create test user"""
    import bcrypt

    user = User(
        id=uuid4(),
        email=f"test-{uuid4()}@example.com",
        first_name="Test",
        last_name="User",
        password_hash=bcrypt.hashpw("testpass".encode(), bcrypt.gensalt()).decode(),
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    return user


class TestChatServiceCreateConversation:
    """Test create_conversation method"""

    @pytest.mark.asyncio
    async def test_create_conversation_success(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test creating a conversation successfully"""
        chat_service = ChatService()
        result = await chat_service.create_conversation(
            db_session, test_user.id, "Test Conversation"
        )

        assert result.id is not None
        assert result.title == "Test Conversation"
        assert result.user_id == test_user.id


class TestChatServiceGetConversations:
    """Test get_conversations method"""

    @pytest.mark.asyncio
    async def test_get_conversations_success(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test getting all conversations for a user"""
        conv1 = Conversation(user_id=test_user.id, title="Conv 1")
        conv2 = Conversation(user_id=test_user.id, title="Conv 2")
        db_session.add(conv1)
        db_session.add(conv2)
        await db_session.commit()

        chat_service = ChatService()
        result = await chat_service.get_conversations(db_session, test_user.id)

        assert len(result) == 2
        assert result[0].title in ["Conv 1", "Conv 2"]
        assert result[1].title in ["Conv 1", "Conv 2"]


class TestChatServiceGetConversation:
    """Test get_conversation method"""

    @pytest.mark.asyncio
    async def test_get_conversation_success(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test getting a specific conversation"""
        conv = Conversation(user_id=test_user.id, title="Test Conv")
        db_session.add(conv)
        await db_session.commit()
        await db_session.refresh(conv)

        chat_service = ChatService()
        result = await chat_service.get_conversation(db_session, conv.id, test_user.id)

        assert result is not None
        assert result.id == conv.id
        assert result.title == "Test Conv"

    @pytest.mark.asyncio
    async def test_get_conversation_not_found(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test getting a conversation that doesn't exist"""
        chat_service = ChatService()
        result = await chat_service.get_conversation(db_session, uuid4(), test_user.id)

        assert result is None


class TestChatServiceCreateMessage:
    """Test create_message method"""

    @pytest.mark.asyncio
    async def test_create_message_success(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test creating a message successfully"""
        conv = Conversation(user_id=test_user.id, title="Test Conv")
        db_session.add(conv)
        await db_session.commit()
        await db_session.refresh(conv)

        chat_service = ChatService()
        result = await chat_service.create_message(
            db_session, conv.id, test_user.id, MessageRole.USER, "Hello"
        )

        assert result.id is not None
        assert result.content == "Hello"
        assert result.role == MessageRole.USER

    @pytest.mark.asyncio
    async def test_create_message_with_document_ids(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test creating a message with document IDs"""
        conv = Conversation(user_id=test_user.id, title="Test Conv")
        db_session.add(conv)
        await db_session.commit()
        await db_session.refresh(conv)

        chat_service = ChatService()
        doc_ids = [uuid4(), uuid4()]
        result = await chat_service.create_message(
            db_session,
            conv.id,
            test_user.id,
            MessageRole.ASSISTANT,
            "Response",
            document_ids=doc_ids,
        )

        assert result.id is not None
        assert result.content == "Response"
        assert result.role == MessageRole.ASSISTANT


class TestChatServiceGetConversationHistory:
    """Test get_conversation_history method"""

    @pytest.mark.asyncio
    async def test_get_conversation_history_success(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test getting conversation history"""
        conv = Conversation(user_id=test_user.id, title="Test Conv")
        db_session.add(conv)
        await db_session.commit()
        await db_session.refresh(conv)

        msg1 = Message(
            conversation_id=conv.id,
            user_id=test_user.id,
            role=MessageRole.USER,
            content="Hello",
        )
        msg2 = Message(
            conversation_id=conv.id,
            user_id=test_user.id,
            role=MessageRole.ASSISTANT,
            content="Hi there",
        )
        db_session.add(msg1)
        db_session.add(msg2)
        await db_session.commit()

        chat_service = ChatService()
        result = await chat_service.get_conversation_history(
            db_session, conv.id, test_user.id
        )

        assert result is not None
        assert len(result) == 2
        assert result[0].content == "Hello"
        assert result[1].content == "Hi there"

    @pytest.mark.asyncio
    async def test_get_conversation_history_not_found(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test getting history for a non-existent conversation"""
        chat_service = ChatService()
        result = await chat_service.get_conversation_history(
            db_session, uuid4(), test_user.id
        )

        assert result is None


class TestChatServiceFormatHistory:
    """Test format_history_for_langchain method"""

    @pytest.mark.asyncio
    async def test_format_history_for_langchain(self):
        """Test formatting messages for LangChain"""
        from app.chat.model import MessageResponse
        from datetime import datetime, timezone

        msg1 = MessageResponse(
            id=uuid4(),
            conversation_id=uuid4(),
            user_id=uuid4(),
            role=MessageRole.USER,
            content="Hello",
            created_at=datetime.now(timezone.utc),
        )
        msg2 = MessageResponse(
            id=uuid4(),
            conversation_id=uuid4(),
            user_id=uuid4(),
            role=MessageRole.ASSISTANT,
            content="Hi",
            created_at=datetime.now(timezone.utc),
        )

        chat_service = ChatService()
        result = chat_service.format_history_for_langchain([msg1, msg2])

        assert len(result) == 2
        assert result[0]["role"] == "user"
        assert result[0]["content"] == "Hello"
        assert result[1]["role"] == "assistant"
        assert result[1]["content"] == "Hi"
