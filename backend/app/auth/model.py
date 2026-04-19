from uuid import UUID
from typing import Literal

from pydantic import BaseModel, EmailStr, HttpUrl


class RegisterUserRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    password: str


class LoginRequest(BaseModel):
    """Simple login request with JSON body"""

    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    provider: str = "manual"


class TokenData(BaseModel):
    user_id: str | None = None
    provider: str | None = "manual"

    def get_uuid(self) -> UUID | None:
        if self.user_id:
            return UUID(self.user_id)
        return None


# Google OAuth Models

ProviderType = Literal["manual", "google"]


class GoogleUserInfo(BaseModel):
    """User info returned by Google OAuth"""

    sub: str | None = None  # Google ID (v2 endpoint)
    id: str | None = None  # Google ID (v1 endpoint)
    email: str
    email_verified: bool | None = None  # v2 endpoint
    verified_email: bool | None = None  # v1 endpoint
    name: str
    given_name: str
    family_name: str
    picture: str | None = None

    @property
    def google_id(self) -> str:
        """Get Google ID from either sub (v2) or id (v1)"""
        return self.sub or self.id or ""

    @property
    def is_email_verified(self) -> bool:
        """Get email verified from either email_verified (v2) or verified_email (v1)"""
        return (
            self.email_verified
            if self.email_verified is not None
            else self.verified_email
        )


class GoogleTokenResponse(BaseModel):
    """Response from Google token endpoint"""

    model_config = {"extra": "ignore"}

    access_token: str
    id_token: str
    expires_in: int
    token_type: str = "Bearer"
    scope: str


class OAuthTokenResponse(BaseModel):
    """Response after successful OAuth callback"""

    access_token: str
    token_type: str
    provider: ProviderType


class GoogleLoginUrlResponse(BaseModel):
    """Response with Google OAuth authorization URL"""

    authorization_url: str
    state: str
