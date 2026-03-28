from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
    OAuth2PasswordRequestForm,
)
from starlette import status

from ..core.config import settings
from ..database.core import AsyncSession, get_db
from ..rate_limiter import limiter
from ..auth.google_oauth_service import get_google_oauth_service
from . import model, service

router = APIRouter(prefix="/auth", tags=["auth"])

# Type alias for dependency injection
DbSession = Annotated[AsyncSession, Depends(get_db)]

# JWT Security scheme
security = HTTPBearer()


@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
async def register_user(
    request: Request,
    db: DbSession,
    register_user_request: model.RegisterUserRequest,
):
    """Register a new user account"""
    return await service.register_user(db, register_user_request)


@router.post("/login", response_model=model.Token)
@limiter.limit("10/minute")
async def login_user(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DbSession,
):
    """
    Authenticate user and return JWT access token.

    This endpoint uses OAuth2PasswordRequestForm (application/x-www-form-urlencoded).
    For a simpler JSON-based login, use POST /auth/login-simple.
    """
    return await service.login_for_access_token(form_data, db)


@router.post("/login-simple", response_model=model.Token)
@limiter.limit("10/minute")
async def login_user_simple(
    request: Request,
    login_data: model.LoginRequest,
    db: DbSession,
):
    """
    Simple login endpoint that accepts JSON body.

    This works better with Swagger UI and other HTTP clients.
    Alternative to OAuth2PasswordRequestForm based /auth/login endpoint.
    """
    return await service.login_simple(login_data, db)


@router.post("/token", response_model=model.Token, include_in_schema=False)
@limiter.limit("10/minute")
async def login_for_access_token(
    request: Request,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DbSession,
):
    """
    Legacy endpoint for OAuth2 compatibility.

    OAuth2PasswordBearer expects this specific path format for automatic token handling.
    This endpoint is hidden from OpenAPI docs (include_in_schema=False)
    but kept for backward compatibility with OAuth2 clients.
    """
    return await service.login_for_access_token(form_data, db)


@router.get("/verify", response_model=dict)
async def verify_token_endpoint(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
):
    """
    Verify if a JWT token is valid without returning user data.

    Useful for client-side token validation before making API calls.
    Returns token payload information if valid, 401 if invalid.
    """
    try:
        # Try to decode and verify token
        from jwt import PyJWTError, decode

        payload = decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        return {
            "valid": True,
            "user_id": payload.get("id"),
            "email": payload.get("sub"),
            "expires_at": payload.get("exp"),
            "token_type": "Bearer",
        }
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        )


@router.post("/logout", response_model=dict)
async def logout_user(db: DbSession, token: Annotated[str, Depends(security)]):
    """
    Logout user endpoint.

    Since JWT is stateless, this is mainly for logging and client-side cleanup.
    The client should discard token from storage.
    """
    return {
        "message": "Successfully logged out",
        "instruction": "Client should remove token from storage",
    }


# Google OAuth endpoints


@router.get("/google/login", response_model=model.GoogleLoginUrlResponse)
@limiter.limit("5/minute")
async def google_oauth_login(
    request: Request,
    google_service: Annotated[object, Depends(get_google_oauth_service)],
):
    """
    Get Google OAuth authorization URL.

    Returns an authorization URL that the user should visit to authenticate with Google.
    The user will be redirected back to the redirect URI with an authorization code.
    """
    if not settings.google_oauth_enabled:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured",
        )
    return await service.google_oauth_login(google_service)


@router.get("/google/callback", response_model=model.OAuthTokenResponse)
@limiter.limit("5/minute")
async def google_oauth_callback(
    request: Request,
    code: Annotated[str, Query(...)],
    state: Annotated[str, Query(...)],
    db: DbSession,
    google_service: Annotated[object, Depends(get_google_oauth_service)],
):
    """
    Handle Google OAuth callback.

    Exchanges the authorization code for tokens and returns a JWT access token.
    This endpoint is called by Google after user authentication.
    """
    if not settings.google_oauth_enabled:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured",
        )
    return await service.handle_google_callback(code, state, db, google_service)


@router.delete("/google/unlink", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/hour")
async def unlink_google_account(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: DbSession,
    google_service: Annotated[object, Depends(get_google_oauth_service)],
):
    """
    Unlink Google account from user.

    Requires the user to have a password set, as they'll need to authenticate manually
    after unlinking. Users without a password cannot unlink their Google account.
    """
    if not settings.google_oauth_enabled:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth is not configured",
        )

    # Get user ID from token
    token_data = service.verify_token(credentials.credentials)
    if not token_data.user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    await service.unlink_google_account(UUID(token_data.user_id), db, google_service)
