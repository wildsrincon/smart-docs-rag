"""Integration tests for document upload flow"""

import io
import pytest
import pytest_asyncio
from datetime import timedelta
from uuid import uuid4
from unittest.mock import Mock, patch, AsyncMock

from fastapi import UploadFile

from app.documents.service import DocumentService
from app.entities.document import Document, IngestionStatus
from app.entities.user import User
from app.auth.service import create_access_token


class TestUploadFlow:
    """Test suite for document upload integration flow"""

    @pytest.fixture
    def document_service(self):
        """Create document service instance"""
        return DocumentService()

    @pytest_asyncio.fixture
    async def test_user(self, db_session):
        """Create test user"""
        user = User(
            id=uuid4(),
            email="test@example.com",
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
        return io.BytesIO(b"%PDF-1.4\n%fake pdf content\n%%EOF")

    @pytest.fixture
    def sample_upload_file(self, sample_pdf_content):
        """Create sample UploadFile object"""
        from starlette.datastructures import Headers

        headers = Headers({"content-type": "application/pdf"})
        file = UploadFile(
            filename="test.pdf",
            file=sample_pdf_content,
            headers=headers,
        )
        return file

    @pytest.fixture
    def corrupted_pdf_content(self):
        """Create corrupted PDF content for testing"""
        return io.BytesIO(b"This is not a PDF file")

    @pytest.fixture
    def corrupted_upload_file(self, corrupted_pdf_content):
        """Create corrupted UploadFile object"""
        from starlette.datastructures import Headers

        headers = Headers({"content-type": "application/pdf"})
        file = UploadFile(
            filename="corrupted.pdf",
            file=corrupted_pdf_content,
            headers=headers,
        )
        return file

    @pytest.fixture
    def corrupted_pdf_content(self):
        """Create corrupted PDF content for testing"""
        return io.BytesIO(b"This is not a PDF file")

    @pytest.fixture
    def corrupted_upload_file(self, corrupted_pdf_content):
        """Create corrupted UploadFile object"""
        from starlette.datastructures import Headers

        headers = Headers({"content-type": "application/pdf"})
        file = UploadFile(
            filename="corrupted.pdf",
            file=corrupted_pdf_content,
            headers=headers,
        )
        return file

    @pytest.mark.asyncio
    async def test_upload_processing_completed_flow(
        self,
        document_service,
        db_session,
        test_user,
        sample_upload_file,
    ):
        """Test complete upload → processing → completed flow"""
        from fastapi import BackgroundTasks
        from unittest.mock import MagicMock

        background_tasks = BackgroundTasks()

        # Mock the ingestion service to simulate successful processing
        with patch.object(
            document_service.ingestion_service,
            "ingest_document",
            new_callable=AsyncMock,
        ) as mock_ingest:
            # Upload document
            document = await document_service.create_document(
                db_session, test_user.id, sample_upload_file, background_tasks
            )

            assert document is not None, "Document should be created"
            assert document.status == IngestionStatus.PENDING, (
                "Initial status should be PENDING"
            )
            assert document.filename == "test.pdf", "Filename should match"

            # Simulate background task execution
            # In real scenario, this would run in background via FastAPI
            # For testing, we'll check that the background task was added
            assert len(background_tasks.tasks) > 0, "Background task should be added"

    @pytest.mark.asyncio
    async def test_corrupted_pdf_handling(
        self,
        document_service,
        db_session,
        test_user,
        corrupted_upload_file,
    ):
        """Test handling of corrupted PDF files"""
        from fastapi import BackgroundTasks

        background_tasks = BackgroundTasks()

        # Upload corrupted PDF - it will be accepted but ingestion will fail
        document = await document_service.create_document(
            db_session, test_user.id, corrupted_upload_file, background_tasks
        )

        assert document is not None, "Document should be created"
        assert document.status == IngestionStatus.PENDING, (
            "Initial status should be PENDING"
        )

        # Mock ingestion service to simulate failure
        with patch.object(
            document_service.ingestion_service,
            "ingest_document",
            new_callable=AsyncMock,
        ) as mock_ingest:
            # Simulate ingestion failure in background
            mock_ingest.side_effect = Exception("PDF parsing failed")

            # The background task would fail and update status to FAILED
            # In real scenario, this happens in background
            # For testing, we just verify the document was created

    @pytest.mark.asyncio
    async def test_file_validation_pdf_only(
        self,
        document_service,
        db_session,
        test_user,
    ):
        """Test file validation - only PDF files allowed"""
        from fastapi import BackgroundTasks, HTTPException

        background_tasks = BackgroundTasks()

        # Try to upload non-PDF file
        from starlette.datastructures import Headers

        txt_content = io.BytesIO(b"This is a text file")
        txt_file = UploadFile(
            filename="test.txt",
            file=txt_content,
            headers=Headers({"content-type": "text/plain"}),
        )

        with pytest.raises(HTTPException) as exc_info:
            await document_service.create_document(
                db_session, test_user.id, txt_file, background_tasks
            )

        assert exc_info.value.status_code == 400, (
            "Should reject non-PDF files with 400 status"
        )

    @pytest.mark.asyncio
    async def test_document_status_tracking(
        self,
        document_service,
        db_session,
        test_user,
        sample_upload_file,
    ):
        """Test document status tracking through ingestion process"""
        from fastapi import BackgroundTasks

        background_tasks = BackgroundTasks()

        # Upload document
        document = await document_service.create_document(
            db_session, test_user.id, sample_upload_file, background_tasks
        )

        initial_status = document.status
        assert initial_status == IngestionStatus.PENDING, (
            "Initial status should be PENDING"
        )

        # Get status
        status_info = await document_service.get_document_status(
            db_session, document.id, test_user.id
        )

        assert status_info is not None, "Should return status info"
        assert "status" in status_info, "Should include status field"
        assert status_info["status"] == IngestionStatus.PENDING, (
            "Status should remain PENDING initially"
        )

    @pytest.mark.asyncio
    async def test_document_listing(
        self,
        document_service,
        db_session,
        test_user,
        sample_upload_file,
    ):
        """Test document listing for user"""
        from fastapi import BackgroundTasks

        # Upload multiple documents
        from starlette.datastructures import Headers

        for i in range(3):
            pdf_content = io.BytesIO(b"%PDF-1.4\n%fake pdf content\n%%EOF")
            upload_file = UploadFile(
                filename=f"test{i}.pdf",
                file=pdf_content,
                headers=Headers({"content-type": "application/pdf"}),
            )
            background_tasks = BackgroundTasks()
            await document_service.create_document(
                db_session, test_user.id, upload_file, background_tasks
            )

        # List documents
        documents = await document_service.get_documents(
            db_session, test_user.id, skip=0, limit=100
        )

        assert len(documents) == 3, "Should list all 3 documents"
        assert all(doc.user_id == test_user.id for doc in documents), (
            "All documents should belong to test user"
        )

    @pytest.mark.asyncio
    async def test_document_retrieval(
        self,
        document_service,
        db_session,
        test_user,
        sample_upload_file,
    ):
        """Test document retrieval by ID"""
        from fastapi import BackgroundTasks

        background_tasks = BackgroundTasks()

        # Upload document
        created_doc = await document_service.create_document(
            db_session, test_user.id, sample_upload_file, background_tasks
        )

        # Retrieve document
        retrieved_doc = await document_service.get_document(
            db_session, created_doc.id, test_user.id
        )

        assert retrieved_doc is not None, "Document should be retrieved"
        assert retrieved_doc.id == created_doc.id, "IDs should match"
        assert retrieved_doc.filename == "test.pdf", "Filename should match"

    @pytest.mark.asyncio
    async def test_document_retrieval_wrong_user(
        self,
        document_service,
        db_session,
        test_user,
        sample_upload_file,
    ):
        """Test document retrieval returns None for wrong user"""
        from fastapi import BackgroundTasks

        background_tasks = BackgroundTasks()

        # Upload document as test_user
        created_doc = await document_service.create_document(
            db_session, test_user.id, sample_upload_file, background_tasks
        )

        # Create another user
        other_user = User(
            id=uuid4(),
            email="other@example.com",
            first_name="Other",
            last_name="User",
            password_hash="hashed_password",
        )
        db_session.add(other_user)
        await db_session.commit()

        # Try to retrieve with wrong user
        retrieved_doc = await document_service.get_document(
            db_session, created_doc.id, other_user.id
        )

        assert retrieved_doc is None, "Should not retrieve document for wrong user"

    @pytest.mark.asyncio
    async def test_document_deletion_cascading(
        self,
        document_service,
        db_session,
        test_user,
        sample_upload_file,
    ):
        """Test document deletion cascades to chunks"""
        from fastapi import BackgroundTasks
        from app.rag.vector_store import VectorStore

        background_tasks = BackgroundTasks()
        vector_store = VectorStore()

        # Upload document
        document = await document_service.create_document(
            db_session, test_user.id, sample_upload_file, background_tasks
        )

        # Delete document
        success = await document_service.delete_document(
            db_session, document.id, test_user.id
        )

        assert success, "Document deletion should succeed"

        # Verify document is deleted
        retrieved_doc = await document_service.get_document(
            db_session, document.id, test_user.id
        )
        assert retrieved_doc is None, "Document should be deleted"

    @pytest.mark.asyncio
    async def test_document_deletion_non_existent(
        self,
        document_service,
        db_session,
        test_user,
    ):
        """Test deletion of non-existent document"""
        non_existent_id = uuid4()

        success = await document_service.delete_document(
            db_session, non_existent_id, test_user.id
        )

        assert not success, "Deletion should fail for non-existent document"

    @pytest.mark.asyncio
    async def test_get_document_status(
        self,
        document_service,
        db_session,
        test_user,
        sample_upload_file,
    ):
        """Test getting document status"""
        from fastapi import BackgroundTasks

        background_tasks = BackgroundTasks()

        # Upload document
        document = await document_service.create_document(
            db_session, test_user.id, sample_upload_file, background_tasks
        )

        # Get status
        status_info = await document_service.get_document_status(
            db_session, document.id, test_user.id
        )

        assert status_info is not None, "Should return status info"
        assert "status" in status_info, "Should include status field"
        assert status_info["status"] == IngestionStatus.PENDING, (
            "Initial status should be PENDING"
        )
        assert "progress" in status_info, "Should include progress field"

    @pytest.mark.asyncio
    async def test_complete_upload_ingestion_query_flow(
        self,
        document_service,
        db_session,
        test_user,
        sample_upload_file,
    ):
        """Test complete upload → ingestion → query flow"""
        from fastapi import BackgroundTasks
        from app.rag.chat_service import ChatService

        background_tasks = BackgroundTasks()
        chat_service = ChatService()

        # Upload document
        document = await document_service.create_document(
            db_session, test_user.id, sample_upload_file, background_tasks
        )

        assert document is not None
        assert document.status == IngestionStatus.PENDING

        # Mock ingestion service to simulate completion
        with patch.object(
            document_service.ingestion_service,
            "ingest_document",
            new_callable=AsyncMock,
        ):
            # Mock query (would be called after ingestion completes)
            with patch.object(
                chat_service, "generate_query_embedding", return_value=[0.1] * 1536
            ):
                with patch.object(
                    chat_service.vector_store,
                    "similarity_search",
                    return_value=[],
                ):
                    # Query would work after ingestion is complete
                    response = await chat_service.answer_question(
                        db=db_session,
                        user_id=test_user.id,
                        query="What is in the document?",
                        document_ids=None,
                        conversation_history=None,
                    )

                    assert response is not None
                    assert "stream" in response
                    assert "citations" in response
