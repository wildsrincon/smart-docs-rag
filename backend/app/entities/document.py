import uuid
from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import (
    Column,
    DateTime,
    String,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from ..database.base import Base


class IngestionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

    def __str__(self) -> str:
        return self.value


def _enum_values(enum_cls: type[Enum]) -> list[str]:
    return [member.value for member in enum_cls]


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    filename = Column(String(255), nullable=False)
    file_size = Column(Integer)  # bytes
    status = Column(
        SQLEnum(
            IngestionStatus,
            name="ingestionstatus",
            create_type=False,
            values_callable=lambda x: [e.value for e in x],
        ),
        default=IngestionStatus.PENDING,
        nullable=False,
        index=True,
    )
    total_chunks = Column(Integer, default=0)
    processed_chunks = Column(Integer, default=0)
    error_message = Column(Text)
    chunk_metadata = Column(Text)  # JSON string for additional metadata
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    processed_at = Column(DateTime(timezone=True))

    def __repr__(self):
        return f"<Document(id='{self.id}', filename='{self.filename}', status='{self.status}')>"
