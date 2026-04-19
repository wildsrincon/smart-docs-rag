import logging
from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID, uuid4

import jwt
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt import ExpiredSignatureError, PyJWTError
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..auth import model
from ..auth.google_oauth_service import GoogleOAuthService, get_google_oauth_service
from ..entities.user import User
from ..exceptions import AuthenticationError

oauth2_bearer = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return bcrypt_context.hash(password)


async def authenticate_user(email: str, password: str, db: AsyncSession) -> User | bool:
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        logging.warning(f"Failed authentication attempt for email: {email}")
        return False
    return user


def create_access_token(
    email: str, user_id: UUID, expires_delta: timedelta, provider: str = "manual"
) -> str:
    encode = {
        "sub": email,
        "id": str(user_id),
        "exp": datetime.now(timezone.utc) + expires_delta,
        "provider": provider,
    }
    return jwt.encode(encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_token(token: str) -> model.TokenData:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("id")
        provider: str = payload.get("provider", "manual")
        return model.TokenData(user_id=user_id, provider=provider)
    except ExpiredSignatureError:
        logging.warning("Token verification failed: Token has expired")
        raise AuthenticationError()
    except PyJWTError as e:
        logging.warning(f"Token verification failed: {str(e)}")
        raise AuthenticationError()


async def register_user(
    db: AsyncSession, register_user_request: model.RegisterUserRequest
) -> None:
    try:
        create_user_model = User(
            id=uuid4(),
            email=register_user_request.email,
            first_name=register_user_request.first_name,
            last_name=register_user_request.last_name,
            password_hash=get_password_hash(register_user_request.password),
            provider="manual",
        )
        db.add(create_user_model)
        await db.commit()
    except Exception as e:
        logging.error(
            f"Failed to register user: {register_user_request.email}. Error: {str(e)}"
        )
        await db.rollback()
        raise


def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]) -> model.TokenData:
    return verify_token(token)


async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: AsyncSession
) -> model.Token:
    user = await authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise AuthenticationError()
    token = create_access_token(
        user.email,
        user.id,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        provider=user.provider or "manual",
    )
    return model.Token(
        access_token=token, token_type="bearer", provider=user.provider or "manual"
    )


async def login_simple(login_data: model.LoginRequest, db: AsyncSession) -> model.Token:
    """Simple login with JSON body (works better with Swagger UI)"""
    user = await authenticate_user(login_data.email, login_data.password, db)
    if not user:
        raise AuthenticationError()
    token = create_access_token(
        user.email,
        user.id,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        provider=user.provider or "manual",
    )
    return model.Token(
        access_token=token, token_type="bearer", provider=user.provider or "manual"
    )


async def google_oauth_login(
    google_service: GoogleOAuthService,
) -> model.GoogleLoginUrlResponse:
    """
    Generate Google OAuth authorization URL

    Args:
        google_service: Google OAuth service instance

    Returns:
        GoogleLoginUrlResponse with authorization URL and state token
    """
    auth_url, state = google_service.generate_authorization_url()
    return model.GoogleLoginUrlResponse(authorization_url=auth_url, state=state)


async def handle_google_callback(
    code: str,
    state: str,
    db: AsyncSession,
    google_service: GoogleOAuthService,
) -> model.OAuthTokenResponse:
    """
    Handle Google OAuth callback and return JWT token

    Args:
        code: Authorization code from Google
        state: State token for CSRF protection
        db: Database session
        google_service: Google OAuth service instance

    Returns:
        OAuthTokenResponse with JWT access token
    """
    logging.info("Google OAuth callback started - exchanging code for token")
    logging.debug(f"Code length: {len(code)}, State: {state[:20]}...")

    # Exchange code for token
    token_response = await google_service.exchange_code_for_token(code, state)
    logging.info("Google token exchange successful")

    # Get user info from Google
    google_user = await google_service.get_user_info(token_response.access_token)
    logging.info(f"Got Google user info: {google_user.email}")

    # Find or create user
    user = await google_service.find_or_create_user(google_user, db)
    logging.info(f"User found/created: {user.id} - {user.email}")

    # Generate JWT token
    token = create_access_token(
        user.email,
        user.id,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        provider="google",
    )
    logging.info(f"Generated JWT token for user: {user.email}")

    logging.info(f"Google OAuth login successful for user: {user.email}")

    return model.OAuthTokenResponse(
        access_token=token, token_type="bearer", provider="google"
    )


async def unlink_google_account(
    user_id: UUID,
    db: AsyncSession,
    google_service: GoogleOAuthService,
) -> None:
    """
    Unlink Google account from user

    Args:
        user_id: User ID
        db: Database session
        google_service: Google OAuth service instance
    """
    await google_service.unlink_google_account(user_id, db)
    logging.info(f"Google account unlinked for user_id: {user_id}")
