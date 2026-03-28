from uuid import UUID
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, HttpUrl


ProviderType = Literal["manual", "google"]


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    google_id: str | None = None
    provider: ProviderType | None = "manual"
    avatar_url: str | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    new_password_confirm: str
