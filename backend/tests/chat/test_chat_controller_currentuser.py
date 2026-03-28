"""Tests for Chat Controller endpoints with CurrentUser authentication"""

import pytest
import pytest_asyncio
from uuid import uuid4
from datetime import timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.auth.service import create_access_token
from app.chat.model import ConversationCreate, ConversationResponse
from app.database.core import AsyncSession, get_db
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


class TestChatControllerCurrentUser:
    """Test Chat controller endpoints with CurrentUser auth"""

    @pytest.fixture
    def test_client(self, db_session: AsyncSession):
        """Create test client with database override"""
        def override_get_db():
            return db_session
        
        app.dependency_overrides[get_db] = override_get_db
        yield TestClient(app)
        app.dependency_overrides.clear()

    @pytest.fixture
    def auth_token(self, test_user):
        """Create auth token for test user"""
        return create_access_token(
            email=test_user.email,
            user_id=test_user.id,
            expires_delta=timedelta(minutes=30),
        )

    def test_create_conversation_success(
        self, test_client: TestClient, test_user, auth_token: str
    ):
        """Test creating a conversation with CurrentUser auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = test_client.post(
            "/api/v1/chat/conversations",
            json={"title": "Test Conversation"},
            headers=headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Test Conversation"
        assert "id" in data

    def test_create_conversation_invalid_token(
        self, test_client: TestClient
    ):
        """Test creating a conversation with invalid CurrentUser auth"""
        headers = {"Authorization": "Bearer invalid_token"}
        
        response = test_client.post(
            "/api/v1/chat/conversations",
            json={"title": "Test Conversation"},
            headers=headers
        )
        
        assert response.status_code == 401

    def test_list_conversations_success(
        self, test_client: TestClient, test_user, auth_token: str
    ):
        """Test listing conversations with CurrentUser auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create multiple conversations
        for i in range(3):
            test_client.post(
                "/api/v1/chat/conversations",
                json={"title": f"Conversation {i}"},
                headers=headers
            )
        
        response = test_client.get(
            "/api/v1/chat/conversations",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    def test_list_conversations_with_pagination(
        self, test_client: TestClient, test_user, auth_token: str
    ):
        """Test listing conversations with pagination using CurrentUser auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create 5 conversations
        for i in range(5):
            test_client.post(
                "/api/v1/chat/conversations",
                json={"title": f"Conversation {i}"},
                headers=headers
            )
        
        # Test with skip=2 and limit=2
        response = test_client.get(
            "/api/v1/chat/conversations?skip=2&limit=2",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_get_conversation_success(
        self, test_client: TestClient, test_user, auth_token: str
    ):
        """Test getting a conversation with CurrentUser auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create conversation
        create_response = test_client.post(
            "/api/v1/chat/conversations",
            json={"title": "Test Conversation"},
            headers=headers
        )
        conversation_id = create_response.json()["id"]
        
        # Get conversation
        response = test_client.get(
            f"/api/v1/chat/conversations/{conversation_id}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == conversation_id
        assert data["title"] == "Test Conversation"

    def test_get_conversation_not_found(
        self, test_client: TestClient, test_user, auth_token: str
    ):
        """Test getting a non-existent conversation with CurrentUser auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = test_client.get(
            f"/api/v1/chat/conversations/{uuid4()}",
            headers=headers
        )
        
        assert response.status_code == 404

    def test_get_conversation_history_success(
        self, test_client: TestClient, test_user, auth_token: str
    ):
        """Test getting conversation history with CurrentUser auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create conversation
        create_response = test_client.post(
            "/api/v1/chat/conversations",
            json={"title": "Test Conversation"},
            headers=headers
        )
        conversation_id = create_response.json()["id"]
        
        # Get history
        response = test_client.get(
            f"/api/v1/chat/conversations/{conversation_id}/history",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "conversation_id" in data
        assert "messages" in data

    def test_get_conversation_history_not_found(
        self, test_client: TestClient, test_user, auth_token: str
    ):
        """Test getting history for non-existent conversation with CurrentUser auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        response = test_client.get(
            f"/api/v1/chat/conversations/{uuid4()}/history",
            headers=headers
        )
        
        assert response.status_code == 404
