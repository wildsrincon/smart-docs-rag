from pydantic import BaseModel


class TodoStats(BaseModel):
    total: int
    completed: int
    pending: int
    by_priority: dict[str, int]
    completed_this_week: int
