from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, status

from ..auth.service import CurrentUser
from ..database.core import AsyncSession, get_db
from . import model, service
from .stats_service import get_todo_stats

router = APIRouter(prefix="/todos", tags=["Todos"])

# Type alias for dependency injection
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/stats")
async def get_stats(db: DbSession, current_user: CurrentUser):
    return await get_todo_stats(current_user, db)


@router.post(
    "/", response_model=model.TodoResponse, status_code=status.HTTP_201_CREATED
)
async def create_todo(db: DbSession, todo: model.TodoCreate, current_user: CurrentUser):
    return await service.create_todo(current_user, db, todo)


@router.get("/", response_model=List[model.TodoResponse])
async def get_todos(db: DbSession, current_user: CurrentUser):
    return await service.get_todos(current_user, db)


@router.get("/{todo_id}", response_model=model.TodoResponse)
async def get_todo(db: DbSession, todo_id: UUID, current_user: CurrentUser):
    return await service.get_todo_by_id(current_user, db, todo_id)


@router.put("/{todo_id}", response_model=model.TodoResponse)
async def update_todo(
    db: DbSession,
    todo_id: UUID,
    todo_update: model.TodoCreate,
    current_user: CurrentUser,
):
    return await service.update_todo(current_user, db, todo_id, todo_update)


@router.put("/{todo_id}/complete", response_model=model.TodoResponse)
async def complete_todo(db: DbSession, todo_id: UUID, current_user: CurrentUser):
    return await service.complete_todo(current_user, db, todo_id)


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(db: DbSession, todo_id: UUID, current_user: CurrentUser):
    await service.delete_todo(current_user, db, todo_id)
