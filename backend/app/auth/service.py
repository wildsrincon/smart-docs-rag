import logging
from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID, uuid4

import jwt
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt import PyJWTError
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..entities.user import User
from ..exceptions import AuthenticationError
from . import model

# You would want to store this in an environment variable or a secret manager
SECRET_KEY = "197b2c37c391bed93fe80344fe73b806947a65e36206e05a1a23c2fa12702fe3"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

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


def create_access_token(email: str, user_id: UUID, expires_delta: timedelta) -> str:
    encode = {
        "sub": email,
        "id": str(user_id),
        "exp": datetime.now(timezone.utc) + expires_delta,
    }
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> model.TokenData:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("id")
        return model.TokenData(user_id=user_id)
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


CurrentUser = Annotated[model.TokenData, Depends(get_current_user)]


async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: AsyncSession
) -> model.Token:
    user = await authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise AuthenticationError()
    token = create_access_token(
        user.email, user.id, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return model.Token(access_token=token, token_type="bearer")


async def login_simple(login_data: model.LoginRequest, db: AsyncSession) -> model.Token:
    """Simple login with JSON body (works better with Swagger UI)"""
    user = await authenticate_user(login_data.email, login_data.password, db)
    if not user:
        raise AuthenticationError()
    token = create_access_token(
        user.email, user.id, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return model.Token(access_token=token, token_type="bearer")
