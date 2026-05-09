import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, String, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from app.core.config import settings
from ..database.base import Base


class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    content = Column(Text, nullable=False)
    embedding = Column(Vector(settings.EMBEDDING_DIMENSION))
    chunk_index = Column(Integer, nullable=False)
    token_count = Column(Integer)
    chunk_metadata = Column(Text)  # JSON string (page number, section, etc.)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self):
        return f"<Chunk(id='{self.id}', document_id='{self.document_id}', index={self.chunk_index})>"
