import logging
from typing import List, cast
from uuid import UUID

from fastapi import BackgroundTasks, UploadFile, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.entities.document import Document, IngestionStatus
from app.documents.model import DocumentResponse
from app.rag.ingestion_service import IngestionService
from app.rag.vector_store import VectorStore

logger = logging.getLogger(__name__)


class DocumentService:
    """Service for document management and ingestion"""

    def __init__(self):
        self.ingestion_service = IngestionService()
        self.vector_store = VectorStore()

    async def create_document(
        self,
        db: AsyncSession,
        user_id: UUID,
        file: UploadFile,
        background_tasks: BackgroundTasks,
    ) -> DocumentResponse:
        """
        Upload and ingest a document.

        Args:
            db: Async database session
            user_id: User UUID
            file: Uploaded file
            background_tasks: FastAPI background tasks

        Returns:
            Created document response
        """
        print(f"[DEBUG] Creating document for user {user_id}")
        logger.info(f"Creating document for user {user_id}")
        try:
            # Validate file size
            file_size = 0
            content = await file.read()
            file_size = len(content)
            await file.seek(0)  # Reset file pointer

            min_size_bytes = 5 * 1024
            if file_size < min_size_bytes:
                raise HTTPException(
                    status_code=400,
                    detail="El archivo es demasiado pequeño para ser procesado. El tamaño mínimo es 5 KB.",
                )

            max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
            if file_size > max_size_bytes:
                raise HTTPException(
                    status_code=400,
                    detail=f"File size exceeds maximum of {settings.MAX_FILE_SIZE_MB}MB",
                )

            # Validate file extension
            if not file.filename:
                raise HTTPException(status_code=400, detail="No filename provided")

            file_ext = file.filename.split(".")[-1].lower()
            supported_extensions = settings.SUPPORTED_FILE_EXTENSIONS.split(",")
            if file_ext not in supported_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type. Supported types: {supported_extensions}",
                )

            # Create document record
            document = Document(
                user_id=user_id,
                filename=file.filename,
                file_size=file_size,
                status=IngestionStatus.PENDING,
                total_chunks=0,
                processed_chunks=0,
            )
            db.add(document)
            await db.flush()
            document_id = cast(UUID, document.id)

            # Commit the document to database BEFORE adding background task
            # This ensures the document_id exists when the background task runs
            await db.commit()

            # Add background task for ingestion
            print(f"[DEBUG] Adding background task for document {document_id}")
            logger.info(f"Adding background task for document {document_id}")
            background_tasks.add_task(
                self.ingestion_service.ingest_document,
                document_id,
                user_id,
                content,
                file.filename,
            )
            print(f"[DEBUG] Background task added for document {document_id}")
            logger.info(f"Background task added for document {document_id}")

            logger.info(f"Document uploaded: {document_id} - {file.filename}")
            return DocumentResponse.model_validate(document, from_attributes=True)

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating document: {e}")
            raise HTTPException(status_code=500, detail="Error uploading document")

    async def get_documents(
        self, db: AsyncSession, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[DocumentResponse]:
        """Get all documents for a user"""
        try:
            result = await db.execute(
                select(Document)
                .where(Document.user_id == user_id)
                .order_by(Document.created_at.desc())
                .offset(skip)
                .limit(limit)
            )
            documents = result.scalars().all()
            return [
                DocumentResponse.model_validate(doc, from_attributes=True)
                for doc in documents
            ]
        except Exception as e:
            logger.error(f"Error getting documents: {e}")
            raise

    async def get_document(
        self, db: AsyncSession, document_id: UUID, user_id: UUID
    ) -> DocumentResponse | None:
        """Get a specific document by ID"""
        try:
            result = await db.execute(
                select(Document)
                .where(Document.id == document_id)
                .where(Document.user_id == user_id)
            )
            document = result.scalar_one_or_none()
            if not document:
                return None
            return DocumentResponse.model_validate(document, from_attributes=True)
        except Exception as e:
            logger.error(f"Error getting document: {e}")
            raise

    async def delete_document(
        self, db: AsyncSession, document_id: UUID, user_id: UUID
    ) -> bool:
        """Delete a document and all its chunks"""
        try:
            # Delete chunks first
            deleted_chunks = await self.vector_store.delete_by_document_id(
                db, document_id
            )
            logger.info(f"Deleted {deleted_chunks} chunks for document {document_id}")

            result = await db.execute(
                select(Document)
                .where(Document.id == document_id)
                .where(Document.user_id == user_id)
            )
            document = result.scalar_one_or_none()

            if not document:
                return False

            await db.delete(document)
            await db.flush()
            logger.info(f"Deleted document {document_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting document: {e}")
            raise

    async def get_document_status(
        self, db: AsyncSession, document_id: UUID, user_id: UUID
    ) -> dict:
        """Get ingestion status of a document"""
        try:
            document = await self.ingestion_service.get_document(
                db, document_id, user_id
            )
            if not document:
                raise HTTPException(status_code=404, detail="Document not found")

            response = DocumentResponse.model_validate(document, from_attributes=True)

            progress = 0
            if response.total_chunks > 0:
                progress = int(
                    (response.processed_chunks / response.total_chunks) * 100
                )

            return {
                "document_id": str(response.id),
                "status": response.status.value,
                "progress": progress,
                "total_chunks": response.total_chunks,
                "processed_chunks": response.processed_chunks,
                "error_message": response.error_message,
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting document status: {e}")
            raise
