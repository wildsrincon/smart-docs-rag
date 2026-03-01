import logging
from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.model import TokenData
from ..entities.todo import Todo
from ..exceptions import TodoCreationError, TodoNotFoundError


async def create_todo(
    current_user: TokenData, db: AsyncSession, todo: "TodoCreate"
) -> Todo:
    try:
        new_todo = Todo(**todo.model_dump())
        new_todo.user_id = current_user.get_uuid()
        db.add(new_todo)
        await db.commit()
        await db.refresh(new_todo)
        logging.info(f"Created new todo for user: {current_user.get_uuid()}")
        return new_todo
    except Exception as e:
        logging.error(
            f"Failed to create todo for user {current_user.get_uuid()}. Error: {str(e)}"
        )
        await db.rollback()
        raise TodoCreationError(str(e))


async def get_todos(current_user: TokenData, db: AsyncSession) -> list[Todo]:
    result = await db.execute(
        select(Todo).filter(Todo.user_id == current_user.get_uuid())
    )
    todos = result.scalars().all()
    logging.info(f"Retrieved {len(todos)} todos for user: {current_user.get_uuid()}")
    return todos


async def get_todo_by_id(
    current_user: TokenData, db: AsyncSession, todo_id: UUID
) -> Todo:
    result = await db.execute(
        select(Todo)
        .filter(Todo.id == todo_id)
        .filter(Todo.user_id == current_user.get_uuid())
    )
    todo = result.scalar_one_or_none()
    if not todo:
        logging.warning(f"Todo {todo_id} not found for user {current_user.get_uuid()}")
        raise TodoNotFoundError(todo_id)
    logging.info(f"Retrieved todo {todo_id} for user {current_user.get_uuid()}")
    return todo


async def update_todo(
    current_user: TokenData, db: AsyncSession, todo_id: UUID, todo_update: "TodoCreate"
) -> Todo:
    todo_data = todo_update.model_dump(exclude_unset=True)
    result = await db.execute(
        select(Todo)
        .filter(Todo.id == todo_id)
        .filter(Todo.user_id == current_user.get_uuid())
    )
    todo = result.scalar_one_or_none()
    if not todo:
        raise TodoNotFoundError(todo_id)
    for key, value in todo_data.items():
        setattr(todo, key, value)
    await db.commit()
    await db.refresh(todo)
    logging.info(
        f"Successfully updated todo {todo_id} for user {current_user.get_uuid()}"
    )
    return todo


async def complete_todo(
    current_user: TokenData, db: AsyncSession, todo_id: UUID
) -> Todo:
    todo = await get_todo_by_id(current_user, db, todo_id)
    if todo.is_completed:
        logging.debug(f"Todo {todo_id} is already completed")
        return todo
    todo.is_completed = True
    todo.completed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(todo)
    logging.info(
        f"Todo {todo_id} marked as completed by user {current_user.get_uuid()}"
    )
    return todo


async def delete_todo(current_user: TokenData, db: AsyncSession, todo_id: UUID) -> None:
    todo = await get_todo_by_id(current_user, db, todo_id)
    await db.delete(todo)
    await db.commit()
    logging.info(f"Todo {todo_id} deleted by user {current_user.get_uuid()}")
