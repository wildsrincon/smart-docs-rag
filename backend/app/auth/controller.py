from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
    OAuth2PasswordRequestForm,
)
from starlette import status

from ..database.core import AsyncSession, get_db
from ..rate_limiter import limiter
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
    Alternative to the OAuth2PasswordRequestForm based /auth/login endpoint.
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
        # Try to decode and verify the token
        from jwt import PyJWTError, decode

        payload = decode(
            credentials.credentials, service.SECRET_KEY, algorithms=[service.ALGORITHM]
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
    The client should discard the token from storage.
    """
    return {
        "message": "Successfully logged out",
        "instruction": "Client should remove token from storage",
    }
