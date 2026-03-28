import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, String, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column

from ..database.base import Base

provider_enum = ENUM("manual", "google", name="provider", create_type=True)


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    google_id: Mapped[str | None] = mapped_column(
        String, unique=True, nullable=True, index=True
    )
    provider: Mapped[str | None] = mapped_column(
        provider_enum, nullable=True, default="manual"
    )
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    __table_args__ = (
        CheckConstraint(
            "(google_id IS NOT NULL AND provider = 'google') OR (google_id IS NULL AND provider = 'manual')",
            name="check_google_provider_consistency",
        ),
    )

    def __repr__(self):
        return f"<User(email='{self.email}', first_name='{self.first_name}', provider='{self.provider}')>"
