from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.entities.document import IngestionStatus


class DocumentCreate(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    file_size: int = Field(..., gt=0)


class DocumentResponse(BaseModel):
    id: UUID
    user_id: UUID
    filename: str
    file_size: int | None
    status: IngestionStatus
    total_chunks: int
    processed_chunks: int
    error_message: str | None
    metadata: str | None = Field(alias="chunk_metadata")
    created_at: datetime
    processed_at: datetime | None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class DocumentUploadResponse(BaseModel):
    document_id: UUID
    status: IngestionStatus
    message: str


__all__ = ["DocumentCreate", "DocumentResponse", "DocumentUploadResponse"]
