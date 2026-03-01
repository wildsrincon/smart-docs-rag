from datetime import datetime
from typing import Optional, Union
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

from ..entities.todo import Priority

# Mapping of string priority names to enum values
PRIORITY_MAP = {
    "Low": Priority.Low,
    "Normal": Priority.Normal,
    "Medium": Priority.Medium,
    "High": Priority.High,
    "Top": Priority.Top,
}


class TodoBase(BaseModel):
    description: str
    due_date: Optional[Union[datetime, str]] = None
    priority: Priority = Priority.Medium

    @field_validator("due_date", mode="before")
    @classmethod
    def parse_due_date(cls, v):
        if v is None:
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, str):
            try:
                # Parse ISO format or date format (YYYY-MM-DD)
                if "T" in v:
                    return datetime.fromisoformat(v)
                return datetime.fromisoformat(v)
            except ValueError:
                raise ValueError("Invalid date format. Use YYYY-MM-DD or ISO format")
        return v

    @field_validator("priority", mode="before")
    @classmethod
    def parse_priority(cls, v):
        if isinstance(v, Priority):
            return v
        if isinstance(v, str):
            # Convert string priority name to enum value
            if v in PRIORITY_MAP:
                return PRIORITY_MAP[v]
            raise ValueError(
                f"Invalid priority: {v}. Must be one of: {list(PRIORITY_MAP.keys())}"
            )
        # If it's already the correct enum value (int), return as is
        try:
            return Priority(v)
        except ValueError:
            raise ValueError(
                f"Invalid priority: {v}. Must be one of: {list(PRIORITY_MAP.keys())}"
            )


class TodoCreate(TodoBase):
    pass


class TodoResponse(TodoBase):
    id: UUID
    is_completed: bool
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
