"""Document controller for RAG platform"""

import logging
from typing import List, Annotated

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    status,
    HTTPException,
    BackgroundTasks,
)
from uuid import UUID

from app.auth.service import get_current_user
from app.auth import model
from app.database.core import AsyncSession, get_db
from app.documents.model import DocumentResponse
from app.documents.service import DocumentService

router = APIRouter(prefix="/documents", tags=["Documents"])
document_service = DocumentService()

# Type alias for dependency injection
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.post(
    "/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED
)
async def upload_document(
    db: DbSession,
    current_user: Annotated[model.TokenData, Depends(get_current_user)],
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """Upload a document for ingestion into the RAG system (PDF, DOCX, XLSX, XLS, PPTX, TXT, MD, CSV)"""
    user_id = UUID(current_user.user_id)
    return await document_service.create_document(db, user_id, file, background_tasks)


@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    db: DbSession,
    current_user: Annotated[model.TokenData, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 100,
):
    """List all documents for the authenticated user"""
    user_id = UUID(current_user.user_id)
    return await document_service.get_documents(db, user_id, skip, limit)


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    db: DbSession,
    current_user: Annotated[model.TokenData, Depends(get_current_user)],
    document_id: UUID,
):
    """Get a specific document by ID"""
    user_id = UUID(current_user.user_id)
    document = await document_service.get_document(db, document_id, user_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    db: DbSession,
    current_user: Annotated[model.TokenData, Depends(get_current_user)],
    document_id: UUID,
):
    """Delete a document and all its chunks"""
    user_id = UUID(current_user.user_id)
    success = await document_service.delete_document(db, document_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")


@router.get("/{document_id}/status")
async def get_document_status(
    db: DbSession,
    current_user: Annotated[model.TokenData, Depends(get_current_user)],
    document_id: UUID,
):
    """Get the ingestion status of a document"""
    user_id = UUID(current_user.user_id)
    return await document_service.get_document_status(db, document_id, user_id)
