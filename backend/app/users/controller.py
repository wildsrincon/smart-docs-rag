from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from ..auth.service import get_current_user
from ..auth import model as auth_model
from ..database.core import AsyncSession, get_db
from . import model, service

router = APIRouter(prefix="/users", tags=["Users"])

# Type alias for dependency injection
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/me", response_model=model.UserResponse)
async def get_current_user(
    current_user: Annotated[auth_model.TokenData, Depends(get_current_user)],
    db: DbSession,
):
    return await service.get_user_by_id(db, current_user.get_uuid())


@router.get("/", response_model=List[model.UserResponse])
async def get_all_users(db: DbSession):
    """Get all registered users (admin/debug route)"""
    return await service.get_all_users(db)


@router.put("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    password_change: model.PasswordChange,
    db: DbSession,
    current_user: Annotated[auth_model.TokenData, Depends(get_current_user)],
):
    return await service.change_password(db, current_user.get_uuid(), password_change)
