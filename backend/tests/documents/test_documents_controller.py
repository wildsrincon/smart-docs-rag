"""Tests for Documents Controller endpoints"""

import pytest
import pytest_asyncio
from uuid import uuid4
from datetime import timedelta
from fastapi.testclient import TestClient
from io import BytesIO

from app.main import app
from app.auth.service import verify_token, create_access_token
from app.documents.model import DocumentResponse
from app.entities.user import User
from app.database.core import AsyncSession, get_db


class TestDocumentsController:
    """Test Documents controller endpoints"""

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

    @pytest.fixture
    def sample_pdf_content(self):
        """Create sample PDF content for testing"""
        return BytesIO(b"%PDF-1.4\n%fake pdf content for testing\n%%EOF")

    @pytest.mark.asyncio
    async def test_upload_document_success(
        self, test_client: TestClient, auth_token: str, sample_pdf_content: BytesIO
    ):
        """Test uploading a document successfully"""
        response = test_client.post(
            "/api/v1/documents/upload",
            params={"token": auth_token},
            files={"file": ("test.pdf", sample_pdf_content, "application/pdf")},
        )

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["filename"] == "test.pdf"
        assert data["status"] in ["PENDING", "PROCESSING"]

    @pytest.mark.asyncio
    async def test_upload_document_invalid_token(
        self, test_client: TestClient, sample_pdf_content: BytesIO
    ):
        """Test uploading a document with invalid token"""
        response = test_client.post(
            "/api/v1/documents/upload",
            params={"token": "invalid_token"},
            files={"file": ("test.pdf", sample_pdf_content, "application/pdf")},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_upload_document_no_file(
        self, test_client: TestClient, auth_token: str
    ):
        """Test uploading without a file"""
        response = test_client.post(
            "/api/v1/documents/upload",
            params={"token": auth_token},
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_upload_document_invalid_file_type(
        self, test_client: TestClient, auth_token: str
    ):
        """Test uploading a non-PDF file"""
        response = test_client.post(
            "/api/v1/documents/upload",
            params={"token": auth_token},
            files={"file": ("test.txt", BytesIO(b"not a pdf"), "text/plain")},
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_list_documents_success(
        self, test_client: TestClient, auth_token: str, sample_pdf_content: BytesIO
    ):
        """Test listing documents successfully"""
        # Create multiple documents
        for i in range(3):
            test_client.post(
                "/api/v1/documents/upload",
                params={"token": auth_token},
                files={"file": (f"test{i}.pdf", sample_pdf_content, "application/pdf")},
            )

        response = test_client.get("/api/v1/documents/", params={"token": auth_token})

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    @pytest.mark.asyncio
    async def test_list_documents_with_pagination(
        self, test_client: TestClient, auth_token: str, sample_pdf_content: BytesIO
    ):
        """Test listing documents with pagination"""
        # Create 5 documents
        for i in range(5):
            test_client.post(
                "/api/v1/documents/upload",
                params={"token": auth_token},
                files={"file": (f"test{i}.pdf", sample_pdf_content, "application/pdf")},
            )

        # Test with skip=2 and limit=2
        response = test_client.get(
            "/api/v1/documents/", params={"token": auth_token, "skip": 2, "limit": 2}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    @pytest.mark.asyncio
    async def test_get_document_success(
        self, test_client: TestClient, auth_token: str, sample_pdf_content: BytesIO
    ):
        """Test getting a specific document"""
        # Create document
        create_response = test_client.post(
            "/api/v1/documents/upload",
            params={"token": auth_token},
            files={"file": ("test.pdf", sample_pdf_content, "application/pdf")},
        )
        document_id = create_response.json()["id"]

        # Get document
        response = test_client.get(
            f"/api/v1/documents/{document_id}", params={"token": auth_token}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == document_id
        assert data["filename"] == "test.pdf"

    @pytest.mark.asyncio
    async def test_get_document_not_found(
        self, test_client: TestClient, auth_token: str
    ):
        """Test getting a document that doesn't exist"""
        response = test_client.get(
            f"/api/v1/documents/{uuid4()}", params={"token": auth_token}
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_document_unauthorized_user(
        self,
        test_client: TestClient,
        auth_token: str,
        sample_pdf_content: BytesIO,
        db_session: AsyncSession,
    ):
        """Test getting a document from another user"""
        # Create another user
        other_user = User(
            id=uuid4(),
            email=f"other-{uuid4()}@example.com",
            first_name="Other",
            last_name="User",
            password_hash="hashed_password",
        )
        db_session.add(other_user)
        await db_session.commit()

        other_token = create_access_token(
            email=other_user.email,
            user_id=other_user.id,
            expires_delta=timedelta(minutes=30),
        )

        # Create document with first user
        create_response = test_client.post(
            "/api/v1/documents/upload",
            params={"token": auth_token},
            files={"file": ("test.pdf", sample_pdf_content, "application/pdf")},
        )
        document_id = create_response.json()["id"]

        # Try to get document with other user
        response = test_client.get(
            f"/api/v1/documents/{document_id}", params={"token": other_token}
        )

        assert response.status_code == 404  # User isolation

    @pytest.mark.asyncio
    async def test_delete_document_success(
        self, test_client: TestClient, auth_token: str, sample_pdf_content: BytesIO
    ):
        """Test deleting a document successfully"""
        # Create document
        create_response = test_client.post(
            "/api/v1/documents/upload",
            params={"token": auth_token},
            files={"file": ("test.pdf", sample_pdf_content, "application/pdf")},
        )
        document_id = create_response.json()["id"]

        # Delete document
        response = test_client.delete(
            f"/api/v1/documents/{document_id}", params={"token": auth_token}
        )

        assert response.status_code == 204

        # Verify deletion
        get_response = test_client.get(
            f"/api/v1/documents/{document_id}", params={"token": auth_token}
        )
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_document_not_found(
        self, test_client: TestClient, auth_token: str
    ):
        """Test deleting a document that doesn't exist"""
        response = test_client.delete(
            f"/api/v1/documents/{uuid4()}", params={"token": auth_token}
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_get_document_status_success(
        self, test_client: TestClient, auth_token: str, sample_pdf_content: BytesIO
    ):
        """Test getting document status"""
        # Create document
        create_response = test_client.post(
            "/api/v1/documents/upload",
            params={"token": auth_token},
            files={"file": ("test.pdf", sample_pdf_content, "application/pdf")},
        )
        document_id = create_response.json()["id"]

        # Get status
        response = test_client.get(
            f"/api/v1/documents/{document_id}/status", params={"token": auth_token}
        )

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "status" in data
        assert "total_chunks" in data
        assert "processed_chunks" in data

    @pytest.mark.asyncio
    async def test_get_document_status_not_found(
        self, test_client: TestClient, auth_token: str
    ):
        """Test getting status for a non-existent document"""
        response = test_client.get(
            f"/api/v1/documents/{uuid4()}/status", params={"token": auth_token}
        )

        assert response.status_code == 404
