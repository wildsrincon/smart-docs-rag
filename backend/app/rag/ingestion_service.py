"""Document ingestion service for RAG platform"""

import logging
import io
from typing import Optional
from uuid import UUID
from datetime import datetime, timezone

import pdfplumber
from docx import Document
from openpyxl import load_workbook
from pptx import Presentation
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.config import settings
from app.database.core import AsyncSessionLocal
from app.entities.document import Document, IngestionStatus
from app.rag.chunker import Chunker
from app.rag.vector_store import VectorStore

logger = logging.getLogger(__name__)


class IngestionService:
    """Handles document ingestion pipeline: extract -> chunk -> embed -> store"""

    def __init__(self):
        self.chunker = Chunker()
        self.vector_store = VectorStore()
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def ingest_document(
        self,
        document_id: UUID,
        user_id: UUID,
        file_content: bytes,
        filename: str,
    ) -> dict:
        """
        Full ingestion pipeline for a document.

        Args:
            document_id: Document UUID
            user_id: User UUID
            file_content: Document file bytes (PDF, DOCX, XLSX, PPTX, TXT, MD)
            filename: Original filename

        Returns:
            Dict with status and metrics
        """
        async with AsyncSessionLocal() as db:
            try:
                print(f"[DEBUG] Starting ingestion for document {document_id}")
                logger.info(f"Starting ingestion for document {document_id}")
                # Update document status to processing
                await self._update_document_status(
                    db, document_id, IngestionStatus.PROCESSING, 0
                )
                await db.commit()

                # Step 1: Extract text from document
                text = await self._extract_text(file_content, filename)
                if not text:
                    raise ValueError("No text extracted from document")

                # Step 2: Chunk text
                logger.info("Chunking text")
                chunks_data = self.chunker.create_chunks(
                    text, metadata={"filename": filename}
                )

                total_chunks = len(chunks_data)

                # Validate chunks were generated
                if total_chunks == 0:
                    logger.error(f"Document {document_id} produced 0 chunks")
                    await self._update_document_status(
                        db,
                        document_id,
                        IngestionStatus.FAILED,
                        0,
                        error_message="El documento no tiene suficiente contenido para ser procesado (0 chunks generados)",
                    )
                    await db.commit()
                    raise ValueError(
                        "Document has insufficient content (0 chunks generated)"
                    )

                await self._update_document_status(
                    db, document_id, IngestionStatus.PROCESSING, 10
                )
                await db.commit()

                # Step 3: Generate embeddings
                logger.info(f"Generating embeddings for {total_chunks} chunks")
                embeddings = await self._generate_embeddings(
                    [chunk["content"] for chunk in chunks_data]
                )

                # Step 4: Store chunks with embeddings
                logger.info("Storing chunks in database")
                chunk_tuples = [
                    (
                        document_id,
                        user_id,
                        chunk["content"],
                        embedding,
                        chunk["chunk_index"],
                        chunk["token_count"],
                        str(chunk.get("metadata", {})),
                    )
                    for chunk, embedding in zip(chunks_data, embeddings)
                ]

                await self.vector_store.add_chunks(db, chunk_tuples)

                # Update document as completed
                await self._update_document(
                    db,
                    document_id,
                    {
                        "status": IngestionStatus.COMPLETED,
                        "total_chunks": total_chunks,
                        "processed_chunks": total_chunks,
                        "processed_at": datetime.now(timezone.utc),
                    },
                )
                await db.commit()

                logger.info(f"Document ingestion completed: {document_id}")
                return {
                    "status": "completed",
                    "total_chunks": total_chunks,
                    "total_tokens": sum(chunk["token_count"] for chunk in chunks_data),
                }

            except Exception as e:
                logger.error(f"Error ingesting document {document_id}: {e}")
                await self._update_document_status(
                    db,
                    document_id,
                    IngestionStatus.FAILED,
                    0,
                    error_message=str(e),
                )
                await db.commit()
                raise

    async def _extract_text(self, file_content: bytes, filename: str) -> str:
        """Extract text from file based on extension"""
        ext = filename.lower().split(".")[-1]
        logger.info(f"Extracting text from {ext} file: {filename}")

        try:
            if ext == "pdf":
                return await self._extract_pdf_text(file_content)
            elif ext == "docx":
                return await self._extract_docx_text(file_content)
            elif ext in ("xlsx", "xls"):
                return await self._extract_excel_text(file_content)
            elif ext == "pptx":
                return await self._extract_pptx_text(file_content)
            elif ext in ("txt", "md"):
                return await self._extract_text_plain(file_content)
            else:
                raise ValueError(f"Unsupported file format: {ext}")
        except Exception as e:
            logger.error(f"Error extracting text from {filename}: {e}")
            raise

    async def _extract_pdf_text(self, file_content: bytes) -> str:
        """Extract text from PDF using pdfplumber"""
        try:
            text = ""
            with pdfplumber.open(io.BytesIO(file_content)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting PDF text: {e}")
            raise

    async def _extract_docx_text(self, file_content: bytes) -> str:
        """Extract text from Word document"""
        try:
            doc = Document(io.BytesIO(file_content))
            text = ""
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting DOCX text: {e}")
            raise

    async def _extract_excel_text(self, file_content: bytes) -> str:
        """Extract text from Excel spreadsheet"""
        try:
            workbook = load_workbook(
                io.BytesIO(file_content), read_only=True, data_only=True
            )
            text = ""
            for sheet_name in workbook.sheetnames:
                sheet = workbook[sheet_name]
                text += f"\n--- Sheet: {sheet_name} ---\n"
                for row in sheet.iter_rows(values_only=True):
                    row_text = " ".join(
                        str(cell) if cell is not None else "" for cell in row
                    )
                    if row_text.strip():
                        text += row_text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting Excel text: {e}")
            raise

    async def _extract_pptx_text(self, file_content: bytes) -> str:
        """Extract text from PowerPoint presentation"""
        try:
            prs = Presentation(io.BytesIO(file_content))
            text = ""
            for i, slide in enumerate(prs.slides):
                text += f"\n--- Slide {i + 1} ---\n"
                for shape in slide.shapes:
                    if hasattr(shape, "text") and shape.text.strip():
                        text += shape.text + "\n"
            return text.strip()
        except Exception as e:
            logger.error(f"Error extracting PPTX text: {e}")
            raise

    async def _extract_text_plain(self, file_content: bytes) -> str:
        """Extract text from plain text or markdown file"""
        try:
            text = file_content.decode("utf-8")
            return text.strip()
        except UnicodeDecodeError:
            try:
                text = file_content.decode("latin-1")
                return text.strip()
            except Exception as e:
                logger.error(f"Error decoding text file: {e}")
                raise ValueError(
                    "Could not decode text file. Ensure it's UTF-8 or Latin-1 encoded."
                )
        except Exception as e:
            logger.error(f"Error extracting plain text: {e}")
            raise

    async def _generate_embeddings(
        self, texts: list[str], batch_size: int = 100
    ) -> list[list[float]]:
        """
        Generate embeddings for texts using OpenAI API.

        Args:
            texts: List of text strings
            batch_size: Number of texts to embed at once

        Returns:
            List of embedding vectors
        """
        all_embeddings = []

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            logger.info(f"Generating embeddings for batch {i // batch_size + 1}")

            response = await self.openai_client.embeddings.create(
                model=settings.OPENAI_EMBEDDING_MODEL, input=batch
            )

            batch_embeddings = [item.embedding for item in response.data]
            all_embeddings.extend(batch_embeddings)

            logger.info(
                f"Batch {i // batch_size + 1} complete: {len(batch_embeddings)} embeddings"
            )

        return all_embeddings

    async def _update_document_status(
        self,
        db: AsyncSession,
        document_id: UUID,
        status: IngestionStatus,
        progress: int,
        error_message: Optional[str] = None,
    ) -> None:
        """Update document status and progress"""
        await db.execute(
            update(Document)
            .where(Document.id == document_id)
            .values(
                status=status, processed_chunks=progress, error_message=error_message
            )
        )

    async def _update_document(
        self, db: AsyncSession, document_id: UUID, updates: dict
    ) -> None:
        """Update document with multiple fields"""
        await db.execute(
            update(Document).where(Document.id == document_id).values(**updates)
        )

    async def get_document(
        self, db: AsyncSession, document_id: UUID, user_id: UUID
    ) -> Optional[Document]:
        """Get document by ID with user isolation"""
        result = await db.execute(
            select(Document)
            .where(Document.id == document_id)
            .where(Document.user_id == user_id)
        )
        return result.scalar_one_or_none()
