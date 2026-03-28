"""Tests for Documents Controller endpoints with CurrentUser authentication"""

import pytest
import pytest_asyncio
from uuid import uuid4
from datetime import timedelta
from fastapi.testclient import TestClient
from io import BytesIO

from app.main import app
from app.auth.service import verify_token, create_access_token
from app.documents.model import DocumentResponse
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


class TestDocumentsControllerCurrentUser:
    """Test Documents controller endpoints with CurrentUser auth"""

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

    @pytest.fixture
    def sample_pdf_content(self):
        """Create sample PDF content for testing"""
        return BytesIO(b"%PDF-1.4\n%fake pdf content for testing\n%%EOF")

    def test_upload_document_success(
        self,
        test_client: TestClient,
        test_user,
        auth_token: str,
        sample_pdf_content: BytesIO,
    ):
        """Test uploading a document with CurrentUser auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}

        response = test_client.post(
            "/api/v1/documents/upload",
            files={"file": ("test.pdf", sample_pdf_content, "application/pdf")},
            headers=headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["filename"] == "test.pdf"
        assert data["status"] in ["PENDING", "PROCESSING"]

    def test_upload_document_invalid_token(
        self, test_client: TestClient, sample_pdf_content: BytesIO
    ):
        """Test uploading with invalid CurrentUser auth"""
        headers = {"Authorization": "Bearer invalid_token"}

        response = test_client.post(
            "/api/v1/documents/upload",
            files={"file": ("test.pdf", sample_pdf_content, "application/pdf")},
            headers=headers,
        )

        assert response.status_code == 401

    def test_list_documents_success(
        self,
        test_client: TestClient,
        test_user,
        auth_token: str,
        sample_pdf_content: BytesIO,
    ):
        """Test listing documents with CurrentUser auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}

        # Create multiple documents
        for i in range(3):
            test_client.post(
                "/api/v1/documents/upload",
                files={"file": (f"test{i}.pdf", sample_pdf_content, "application/pdf")},
                headers=headers,
            )

        response = test_client.get("/api/v1/documents/", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    def test_list_documents_with_pagination(
        self,
        test_client: TestClient,
        test_user,
        auth_token: str,
        sample_pdf_content: BytesIO,
    ):
        """Test listing documents with pagination using CurrentUser auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}

        # Create 5 documents
        for i in range(5):
            test_client.post(
                "/api/v1/documents/upload",
                files={"file": (f"test{i}.pdf", sample_pdf_content, "application/pdf")},
                headers=headers,
            )

        response = test_client.get("/api/v1/documents/?skip=2&limit=2", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_get_document_success(
        self,
        test_client: TestClient,
        test_user,
        auth_token: str,
        sample_pdf_content: BytesIO,
    ):
        """Test getting a document with CurrentUser auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}

        # Create document
        create_response = test_client.post(
            "/api/v1/documents/upload",
            files={"file": ("test.pdf", sample_pdf_content, "application/pdf")},
            headers=headers,
        )
        document_id = create_response.json()["id"]

        # Get document
        response = test_client.get(f"/api/v1/documents/{document_id}", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == document_id
        assert data["filename"] == "test.pdf"

    def test_get_document_not_found(
        self, test_client: TestClient, test_user, auth_token: str
    ):
        """Test getting a non-existent document with CurrentUser auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}

        response = test_client.get(f"/api/v1/documents/{uuid4()}", headers=headers)

        assert response.status_code == 404

    def test_delete_document_success(
        self,
        test_client: TestClient,
        test_user,
        auth_token: str,
        sample_pdf_content: BytesIO,
    ):
        """Test deleting a document with CurrentUser auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}

        # Create document
        create_response = test_client.post(
            "/api/v1/documents/upload",
            files={"file": ("test.pdf", sample_pdf_content, "application/pdf")},
            headers=headers,
        )
        document_id = create_response.json()["id"]

        # Delete document
        response = test_client.delete(
            f"/api/v1/documents/{document_id}", headers=headers
        )

        assert response.status_code == 204

        # Verify deletion
        get_response = test_client.get(
            f"/api/v1/documents/{document_id}", headers=headers
        )
        assert get_response.status_code == 404

    def test_delete_document_not_found(
        self, test_client: TestClient, test_user, auth_token: str
    ):
        """Test deleting a non-existent document with CurrentUser auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}

        response = test_client.delete(f"/api/v1/documents/{uuid4()}", headers=headers)

        assert response.status_code == 404

    def test_get_document_status_success(
        self,
        test_client: TestClient,
        test_user,
        auth_token: str,
        sample_pdf_content: BytesIO,
    ):
        """Test getting document status with CurrentUser auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}

        # Create document
        create_response = test_client.post(
            "/api/v1/documents/upload",
            files={"file": ("test.pdf", sample_pdf_content, "application/pdf")},
            headers=headers,
        )
        document_id = create_response.json()["id"]

        # Get status
        response = test_client.get(
            f"/api/v1/documents/{document_id}/status", headers=headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "status" in data
        assert "total_chunks" in data
        assert "processed_chunks" in data

    def test_get_document_status_not_found(
        self, test_client: TestClient, test_user, auth_token: str
    ):
        """Test getting status for non-existent document with CurrentUser auth"""
        headers = {"Authorization": f"Bearer {auth_token}"}

        response = test_client.get(
            f"/api/v1/documents/{uuid4()}/status", headers=headers
        )

        assert response.status_code == 404
