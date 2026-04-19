"""Google OAuth Service

Handles authentication with Google OAuth 2.0,
including authorization URL generation, token exchange,
and user account creation/linking.
"""

import hashlib
import hmac
import logging
import time
from secrets import token_urlsafe
from typing import Annotated
from uuid import UUID, uuid4

from authlib.integrations.httpx_client import AsyncOAuth2Client as OAuth2Session
from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..auth import model
from ..entities.user import User
from ..exceptions import AuthenticationError

STATE_EXPIRY_SECONDS = 600


# Google OAuth endpoints
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

# OAuth scopes required
GOOGLE_OAUTH_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]


def _sign_state(payload: str) -> str:
    return hmac.new(
        settings.SECRET_KEY.encode(), payload.encode(), hashlib.sha256
    ).hexdigest()


def _build_signed_state() -> str:
    raw = f"{int(time.time())}:{token_urlsafe(32)}"
    sig = _sign_state(raw)
    return f"{raw}:{sig}"


def _verify_signed_state(state: str) -> bool:
    try:
        parts = state.split(":")
        if len(parts) != 3:
            return False
        ts_str, _random, sig = parts
        expected_sig = _sign_state(f"{ts_str}:{_random}")
        if not hmac.compare_digest(sig, expected_sig):
            return False
        if time.time() - int(ts_str) > STATE_EXPIRY_SECONDS:
            return False
        return True
    except (ValueError, IndexError):
        return False


class GoogleOAuthService:
    """Service for Google OAuth authentication flow"""

    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI

    def is_enabled(self) -> bool:
        """Check if Google OAuth is properly configured"""
        return settings.google_oauth_enabled

    def create_oauth_session(self, state: str | None = None) -> OAuth2Session:
        """Create an OAuth2 session for Google"""
        if not self.is_enabled():
            raise AuthenticationError("Google OAuth is not configured")

        if state is None:
            state = token_urlsafe(32)

        return OAuth2Session(
            client_id=self.client_id,
            redirect_uri=self.redirect_uri,
            scope=GOOGLE_OAUTH_SCOPES,
            state=state,
        )

    def generate_authorization_url(self) -> tuple[str, str]:
        """
        Generate Google OAuth authorization URL

        Returns:
            Tuple of (authorization_url, state_token)
        """
        if not self.is_enabled():
            raise AuthenticationError("Google OAuth is not configured")

        state = _build_signed_state()
        oauth = self.create_oauth_session(state)
        authorization_url, state = oauth.create_authorization_url(
            GOOGLE_AUTH_URL,
            state=state,
            access_type="offline",
            prompt="consent",
        )
        return authorization_url, state

    async def exchange_code_for_token(
        self, code: str, state: str
    ) -> model.GoogleTokenResponse:
        """
        Exchange authorization code for access token

        Args:
            code: Authorization code from Google callback
            state: State token for CSRF protection

        Returns:
            GoogleTokenResponse with access and ID tokens
        """
        if not self.is_enabled():
            raise AuthenticationError("Google OAuth is not configured")

        if not _verify_signed_state(state):
            logging.warning(f"State verification failed for state: {state[:30]}...")
            raise AuthenticationError("Invalid or expired state parameter")

        async with self.create_oauth_session(state) as oauth:
            try:
                token_data = await oauth.fetch_token(
                    GOOGLE_TOKEN_URL,
                    code=code,
                    client_secret=self.client_secret,
                )
                logging.info("Successfully exchanged code for Google token")
                return model.GoogleTokenResponse(**token_data)
            except AuthenticationError:
                raise
            except Exception as e:
                logging.error(
                    f"Failed to exchange code for token: {str(e)}", exc_info=True
                )
                raise AuthenticationError("Failed to authenticate with Google")

    async def get_user_info(self, access_token: str) -> model.GoogleUserInfo:
        """
        Get user information from Google using access token

        Args:
            access_token: OAuth access token

        Returns:
            GoogleUserInfo with user details
        """
        async with OAuth2Session(token={"access_token": access_token}) as oauth:
            try:
                response = await oauth.get(GOOGLE_USERINFO_URL)
                response.raise_for_status()
                return model.GoogleUserInfo(**response.json())
            except Exception as e:
                logging.error(f"Failed to fetch user info from Google: {str(e)}")
                raise AuthenticationError(
                    "Failed to fetch user information from Google"
                )

    async def find_or_create_user(
        self, google_user: model.GoogleUserInfo, db: AsyncSession
    ) -> User:
        """
        Find existing user by Google ID or email, or create new user

        Args:
            google_user: Google user information
            db: Database session

        Returns:
            User entity

        Raises:
            AuthenticationError: If email exists but is linked to a different provider
        """
        # First, try to find user by Google ID
        result = await db.execute(
            select(User).filter(User.google_id == google_user.google_id)
        )
        user = result.scalar_one_or_none()

        if user:
            logging.info(f"Found existing user by Google ID: {user.email}")
            return user

        # If not found by Google ID, try by email
        result = await db.execute(select(User).filter(User.email == google_user.email))
        user = result.scalar_one_or_none()

        if user:
            # User exists with this email but not linked to Google
            if user.provider == "google":
                # User was previously linked to Google but with a different Google ID
                # Update Google ID
                user.google_id = google_user.google_id
                user.avatar_url = google_user.picture
                await db.commit()
                await db.refresh(user)
                logging.info(f"Updated Google ID for existing user: {user.email}")
                return user
            else:
                # User has a manual account with this email
                # Link Google account to existing manual account
                logging.info(
                    f"Linking Google account to existing manual user: {user.email}"
                )
                user.google_id = google_user.google_id
                user.provider = "google"
                user.avatar_url = google_user.picture
                await db.commit()
                await db.refresh(user)
                return user
        else:
            # Create new user
            logging.info(f"Creating new user from Google OAuth: {google_user.email}")
            new_user = User(
                id=uuid4(),
                email=google_user.email,
                first_name=google_user.given_name,
                last_name=google_user.family_name,
                password_hash="",  # No password for OAuth users
                google_id=google_user.google_id,
                provider="google",
                avatar_url=google_user.picture,
                is_active=True,
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            return new_user

    async def unlink_google_account(self, user_id: UUID, db: AsyncSession) -> None:
        """
        Unlink Google account from user

        Args:
            user_id: User ID
            db: Database session

        Raises:
            AuthenticationError: If user is not linked to Google or has no password
        """
        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise AuthenticationError("User not found")

        if user.provider != "google":
            raise AuthenticationError("User is not linked to a Google account")

        if not user.password_hash:
            raise AuthenticationError(
                "Cannot unlink Google account - no password set. "
                "Please set a password first."
            )

        # Unlink Google account
        user.google_id = None
        user.provider = "manual"
        user.avatar_url = None
        await db.commit()
        logging.info(f"Unlinked Google account for user: {user.email}")


# Global service instance
google_oauth_service = GoogleOAuthService()


def get_google_oauth_service() -> GoogleOAuthService:
    """Dependency to get Google OAuth service instance"""
    return google_oauth_service
