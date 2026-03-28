import uuid
from enum import Enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    DateTime,
    String,
    ForeignKey,
    Integer,
    Text,
    Enum as SQLEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from ..database.base import Base


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


def _enum_values(enum_cls: type[Enum]) -> list[str]:
    return [member.value for member in enum_cls]


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    role = Column(
        SQLEnum(
            MessageRole,
            name="messagerole",
            values_callable=_enum_values,
            create_type=False,
            validate_strings=True,
        ),
        nullable=False,
    )
    content = Column(Text, nullable=False)
    tokens = Column(Integer)  # Input tokens for user, output tokens for assistant
    document_ids = Column(Text)  # JSON array of document UUIDs used in context
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    def __repr__(self):
        return f"<Message(id='{self.id}', role='{self.role}', conversation_id='{self.conversation_id}')>"
