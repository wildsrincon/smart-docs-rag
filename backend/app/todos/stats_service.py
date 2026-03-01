import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.model import TokenData
from ..entities.todo import Todo
from ..todos.stats import TodoStats


async def get_todo_stats(current_user: TokenData, db: AsyncSession) -> TodoStats:
    """Get statistics for the current user's todos"""
    try:
        # Get all todos for user
        result = await db.execute(
            select(Todo).filter(Todo.user_id == current_user.get_uuid())
        )
        todos = result.scalars().all()

        # Calculate stats
        total = len(todos)
        completed = sum(1 for t in todos if t.is_completed)
        pending = total - completed

        # Count by priority (use enum name as string)
        by_priority = {}
        for todo in todos:
            priority_name = (
                todo.priority.name
                if hasattr(todo.priority, "name")
                else str(todo.priority)
            )
            by_priority[priority_name] = by_priority.get(priority_name, 0) + 1

        # Count completed this week
        one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
        completed_this_week = sum(
            1
            for t in todos
            if t.is_completed and t.completed_at and t.completed_at >= one_week_ago
        )

        logging.info(
            f"Generated stats for user {current_user.get_uuid()}: {total} total, {completed} completed"
        )

        return TodoStats(
            total=total,
            completed=completed,
            pending=pending,
            by_priority=by_priority,
            completed_this_week=completed_this_week,
        )
    except Exception as e:
        logging.error(
            f"Error generating stats for user {current_user.get_uuid()}: {str(e)}"
        )
        raise
