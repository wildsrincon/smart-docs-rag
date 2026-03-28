"""Tests for Chat Controller endpoints"""

import pytest
import pytest_asyncio
from uuid import uuid4
from datetime import timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.auth.service import verify_token, create_access_token
from app.chat.model import ConversationCreate, ConversationResponse
from app.entities.user import User
from app.database.core import AsyncSession, get_db


class TestChatController:
    """Test Chat controller endpoints"""

    @pytest.fixture
    def test_client(self, db_session: AsyncSession):
        """Create test client with database override"""

        def override_get_db():
            return db_session

        app.dependency_overrides[get_db] = override_get_db
        yield TestClient(app)
        app.dependency_overrides.clear()

    @pytest_asyncio.fixture
    async def test_user(self, db_session: AsyncSession):
        """Create test user"""
        user = User(
            id=uuid4(),
            email=f"test-{uuid4()}@example.com",
            first_name="Test",
            last_name="User",
            password_hash="hashed_password",
        )
        db_session.add(user)
        await db_session.commit()
        return user

    @pytest.fixture
    def auth_token(self, test_user):
        """Create auth token for test user"""
        return create_access_token(
            email=test_user.email,
            user_id=test_user.id,
            expires_delta=timedelta(minutes=30),
        )

    @pytest.mark.asyncio
    async def test_create_conversation_success(
        self, test_client: TestClient, auth_token: str
    ):
        """Test creating a conversation successfully"""
        response = test_client.post(
            "/api/v1/chat/conversations",
            params={"token": auth_token},
            json={"title": "Test Conversation"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Conversation"
        assert "id" in data

    @pytest.mark.asyncio
    async def test_create_conversation_invalid_token(self, test_client: TestClient):
        """Test creating a conversation with invalid token"""
        response = test_client.post(
            "/api/v1/chat/conversations",
            params={"token": "invalid_token"},
            json={"title": "Test Conversation"},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_list_conversations_success(
        self, test_client: TestClient, auth_token: str
    ):
        """Test listing conversations successfully"""
        # Create multiple conversations
        for i in range(3):
            test_client.post(
                "/api/v1/chat/conversations",
                params={"token": auth_token},
                json={"title": f"Conversation {i}"},
            )

        response = test_client.get(
            "/api/v1/chat/conversations", params={"token": auth_token}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    @pytest.mark.asyncio
    async def test_list_conversations_with_pagination(
        self, test_client: TestClient, auth_token: str
    ):
        """Test listing conversations with pagination"""
        # Create 5 conversations
        for i in range(5):
            test_client.post(
                "/api/v1/chat/conversations",
                params={"token": auth_token},
                json={"title": f"Conversation {i}"},
            )

        # Test with skip=2 and limit=2
        response = test_client.get(
            "/api/v1/chat/conversations",
            params={"token": auth_token, "skip": 2, "limit": 2},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    @pytest.mark.asyncio
    async def test_get_conversation_success(
        self, test_client: TestClient, auth_token: str
    ):
        """Test getting a specific conversation"""
        # Create conversation
        create_response = test_client.post(
            "/api/v1/chat/conversations",
            params={"token": auth_token},
            json={"title": "Test Conversation"},
        )
        conversation_id = create_response.json()["id"]

        # Get conversation
        response = test_client.get(
            f"/api/v1/chat/conversations/{conversation_id}",
            params={"token": auth_token},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == conversation_id
        assert data["title"] == "Test Conversation"

    @pytest.mark.asyncio
    async def test_get_conversation_not_found(
        self, test_client: TestClient, auth_token: str
    ):
        """Test getting a conversation that doesn't exist"""
        response = test_client.get(
            f"/api/v1/chat/conversations/{uuid4()}", params={"token": auth_token}
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_conversation_history_success(
        self, test_client: TestClient, auth_token: str
    ):
        """Test getting conversation history"""
        # Create conversation
        create_response = test_client.post(
            "/api/v1/chat/conversations",
            params={"token": auth_token},
            json={"title": "Test Conversation"},
        )
        conversation_id = create_response.json()["id"]

        # Get history
        response = test_client.get(
            f"/api/v1/chat/conversations/{conversation_id}/history",
            params={"token": auth_token},
        )

        assert response.status_code == 200
        data = response.json()
        assert "conversation_id" in data
        assert "messages" in data

    @pytest.mark.asyncio
    async def test_get_conversation_history_not_found(
        self, test_client: TestClient, auth_token: str
    ):
        """Test getting history for non-existent conversation"""
        response = test_client.get(
            f"/api/v1/chat/conversations/{uuid4()}/history",
            params={"token": auth_token},
        )

        assert response.status_code == 404
