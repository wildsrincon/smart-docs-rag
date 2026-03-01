from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    first_name: str
    last_name: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    new_password_confirm: str
