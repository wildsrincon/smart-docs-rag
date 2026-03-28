"""Additional tests for Documents Service to improve coverage to 70%+"""

import pytest
import pytest_asyncio
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from io import BytesIO

from app.documents.service import DocumentService
from app.documents.model import DocumentResponse
from app.entities.document import Document, IngestionStatus
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


class TestDocumentsServiceValidation:
    """Test validation logic in create_document"""

    @pytest.mark.asyncio
    async def test_create_document_file_too_large(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test creating a document that exceeds max file size"""
        from fastapi import HTTPException, UploadFile

        service = DocumentService()

        # Create a file that exceeds max size (assuming 10MB max)
        large_content = BytesIO(b"X" * 11 * 1024 * 1024)  # 11MB
        large_file = UploadFile(filename="test.pdf", file=large_content)

        from unittest.mock import Mock

        # Should raise HTTPException
        with pytest.raises(HTTPException, match="File size exceeds"):
            await service.create_document(db_session, test_user.id, large_file, Mock())

    @pytest.mark.asyncio
    async def test_create_document_unsupported_file_type(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test creating a document with unsupported file type"""
        from fastapi import HTTPException, UploadFile

        service = DocumentService()

        # Create a file with unsupported extension
        unsupported_file = UploadFile(
            filename="test.exe", file=BytesIO(b"some content")
        )

        from unittest.mock import Mock

        # Should raise HTTPException
        with pytest.raises(HTTPException, match="Unsupported file type"):
            await service.create_document(
                db_session, test_user.id, unsupported_file, Mock()
            )

    @pytest.mark.asyncio
    async def test_create_document_missing_filename(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test creating a document with no filename"""
        from fastapi import HTTPException, UploadFile

        service = DocumentService()

        # Create a file without filename
        no_filename_file = UploadFile(filename=None, file=BytesIO(b"content"))

        from unittest.mock import Mock

        # Should raise HTTPException
        with pytest.raises(HTTPException, match="No filename provided"):
            await service.create_document(
                db_session, test_user.id, no_filename_file, Mock()
            )


class TestDocumentsServiceGetDocument:
    """Test get_document method"""

    @pytest.mark.asyncio
    async def test_get_document_success(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test getting a document successfully"""
        # Create document
        document = Document(
            user_id=test_user.id,
            filename="test.pdf",
            file_size=1024,
            status=IngestionStatus.COMPLETED,
            total_chunks=3,
            processed_chunks=3,
        )
        db_session.add(document)
        await db_session.commit()
        await db_session.refresh(document)

        service = DocumentService()
        result = await service.get_document(db_session, document.id, test_user.id)

        assert result is not None
        assert result.id == document.id
        assert result.filename == "test.pdf"

    @pytest.mark.asyncio
    async def test_get_document_not_found(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test getting a document that doesn't exist"""
        service = DocumentService()
        result = await service.get_document(db_session, uuid4(), test_user.id)

        assert result is None

    @pytest.mark.asyncio
    async def test_get_document_wrong_user(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test getting a document from another user"""
        # Create another user
        import bcrypt

        other_user = User(
            id=uuid4(),
            email=f"other-{uuid4()}@example.com",
            first_name="Other",
            last_name="User",
            password_hash=bcrypt.hashpw("testpass".encode(), bcrypt.gensalt()).decode(),
            is_active=True,
        )
        db_session.add(other_user)
        await db_session.commit()

        # Create document with first user
        document = Document(
            user_id=test_user.id,
            filename="test.pdf",
            file_size=1024,
            status=IngestionStatus.COMPLETED,
        )
        db_session.add(document)
        await db_session.commit()

        service = DocumentService()
        result = await service.get_document(db_session, document.id, other_user.id)

        assert result is None  # User isolation


class TestDocumentsServiceDeleteDocument:
    """Test delete_document method"""

    @pytest.mark.asyncio
    async def test_delete_document_success(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test deleting a document successfully"""
        # Create document
        document = Document(
            user_id=test_user.id,
            filename="test.pdf",
            file_size=1024,
            status=IngestionStatus.COMPLETED,
        )
        db_session.add(document)
        await db_session.commit()

        service = DocumentService()
        result = await service.delete_document(db_session, document.id, test_user.id)

        assert result is True

    @pytest.mark.asyncio
    async def test_delete_document_not_found(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test deleting a document that doesn't exist"""
        service = DocumentService()
        result = await service.delete_document(db_session, uuid4(), test_user.id)

        assert result is False

    @pytest.mark.asyncio
    async def test_delete_document_wrong_user(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test deleting a document from another user"""
        # Create another user
        import bcrypt

        other_user = User(
            id=uuid4(),
            email=f"other-{uuid4()}@example.com",
            first_name="Other",
            last_name="User",
            password_hash=bcrypt.hashpw("testpass".encode(), bcrypt.gensalt()).decode(),
            is_active=True,
        )
        db_session.add(other_user)
        await db_session.commit()

        # Create document with first user
        document = Document(
            user_id=test_user.id,
            filename="test.pdf",
            file_size=1024,
            status=IngestionStatus.COMPLETED,
        )
        db_session.add(document)
        await db_session.commit()

        service = DocumentService()
        result = await service.delete_document(db_session, document.id, other_user.id)

        assert result is False  # User isolation


class TestDocumentsServiceGetDocumentStatus:
    """Test get_document_status method"""

    @pytest.mark.asyncio
    async def test_get_document_status_success(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test getting document status successfully"""
        # Create document
        document = Document(
            user_id=test_user.id,
            filename="test.pdf",
            file_size=1024,
            status=IngestionStatus.COMPLETED,
            total_chunks=10,
            processed_chunks=10,
        )
        db_session.add(document)
        await db_session.commit()

        service = DocumentService()
        result = await service.get_document_status(
            db_session, document.id, test_user.id
        )

        assert "document_id" in result
        assert result["status"] == "completed"
        assert result["progress"] == 100

    @pytest.mark.asyncio
    async def test_get_document_status_processing(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test getting document status while processing"""
        # Create document
        document = Document(
            user_id=test_user.id,
            filename="test.pdf",
            file_size=1024,
            status=IngestionStatus.PROCESSING,
            total_chunks=10,
            processed_chunks=5,
        )
        db_session.add(document)
        await db_session.commit()

        service = DocumentService()
        result = await service.get_document_status(
            db_session, document.id, test_user.id
        )

        assert result["status"] == IngestionStatus.PROCESSING
        assert result["progress"] == 50

    @pytest.mark.asyncio
    async def test_get_document_status_not_found(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test getting status for a non-existent document"""
        from fastapi import HTTPException

        service = DocumentService()

        with pytest.raises(HTTPException, match="Document not found"):
            await service.get_document_status(db_session, uuid4(), test_user.id)

    @pytest.mark.asyncio
    async def test_get_document_status_wrong_user(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test getting status for document from another user"""
        from fastapi import HTTPException

        service = DocumentService()

        # Create another user
        import bcrypt

        other_user = User(
            id=uuid4(),
            email=f"other-{uuid4()}@example.com",
            first_name="Other",
            last_name="User",
            password_hash=bcrypt.hashpw("testpass".encode(), bcrypt.gensalt()).decode(),
            is_active=True,
        )
        db_session.add(other_user)
        await db_session.commit()

        # Create document with first user
        document = Document(
            user_id=test_user.id,
            filename="test.pdf",
            file_size=1024,
            status=IngestionStatus.COMPLETED,
        )
        db_session.add(document)
        await db_session.commit()

        with pytest.raises(HTTPException, match="Document not found"):
            await service.get_document_status(db_session, document.id, other_user.id)


class TestDocumentsServiceErrorHandling:
    """Test error handling in get_documents"""

    @pytest.mark.asyncio
    async def test_get_documents_database_error(
        self, db_session: AsyncSession, test_user: User
    ):
        """Test error handling in get_documents"""
        # Mock execute to raise an exception
        original_execute = db_session.execute

        async def mock_execute_error(*args, **kwargs):
            raise Exception("Database error")

        db_session.execute = mock_execute_error

        service = DocumentService()

        with pytest.raises(Exception, match="Database error"):
            await service.get_documents(db_session, test_user.id)

        # Restore original
        db_session.execute = original_execute
