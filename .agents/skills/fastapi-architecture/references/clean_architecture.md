# FastAPI Clean Architecture Implementation Guide

This document provides detailed implementation patterns for clean architecture in FastAPI.

## Dependency Injection with FastAPI

FastAPI has excellent built-in dependency injection. Use it to maintain clean boundaries.

### Basic DI Pattern

```python
# api/dependencies.py
from fastapi import Depends
from app.services.user_service import UserService
from app.infrastructure.repositories.sql_user_repo import SqlUserRepository
from app.core.interfaces import UserRepository

def get_user_repository() -> UserRepository:
    """Provide repository instance."""
    return SqlUserRepository()

def get_user_service(
    repo: UserRepository = Depends(get_user_repository)
) -> UserService:
    """Provide service with dependencies injected."""
    return UserService(repo)

# api/v1/routers/users.py
from fastapi import APIRouter, Depends
from app.api.dependencies import get_user_service

router = APIRouter()

@router.post("/users")
async def create_user(
    user_data: UserCreateDTO,
    service: UserService = Depends(get_user_service)
):
    """Create user endpoint - business logic in service."""
    return await service.create_user(user_data)
```

### Override Dependencies for Testing

```python
# tests/conftest.py
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import AsyncMock

def test_create_user_with_mock():
    # Override repository for testing
    mock_repo = AsyncMock()

    async def override_get_user_repository():
        return mock_repo

    app.dependency_overrides[get_user_repository] = override_get_user_repository

    client = TestClient(app)
    response = client.post("/api/v1/users", json={"email": "test@example.com"})

    app.dependency_overrides.clear()

    assert response.status_code == 201
```

## Service Layer Implementation

### Service with Multiple Dependencies

```python
# services/order_service.py
from app.core.interfaces import OrderRepository, UserRepository, EmailService
from app.core.entities import Order

class OrderService:
    def __init__(
        self,
        order_repo: OrderRepository,
        user_repo: UserRepository,
        email_service: EmailService
    ):
        self.order_repo = order_repo
        self.user_repo = user_repo
        self.email_service = email_service

    async def create_order(
        self,
        user_id: int,
        items: list[OrderItem]
    ) -> Order:
        """Create order with validation and notifications."""
        # Business logic
        user = await self.user_repo.find_by_id(user_id)
        if not user:
            raise ValueError("User not found")

        order = Order(user_id=user_id, items=items)
        order.calculate_total()

        saved_order = await self.order_repo.save(order)

        # Send notification
        await self.email_service.send_order_confirmation(
            user.email,
            saved_order
        )

        return saved_order
```

## Repository Pattern

### Interface Definition

```python
# core/interfaces.py
from abc import ABC, abstractmethod
from typing import Optional
from app.core.entities import User

class UserRepository(ABC):
    """Interface for user data access."""

    @abstractmethod
    async def find_by_id(self, user_id: int) -> Optional[User]:
        """Find user by ID."""
        pass

    @abstractmethod
    async def find_by_email(self, email: str) -> Optional[User]:
        """Find user by email."""
        pass

    @abstractmethod
    async def save(self, user: User) -> User:
        """Save user to database."""
        pass

    @abstractmethod
    async def delete(self, user_id: int) -> bool:
        """Delete user from database."""
        pass
```

### SQL Implementation

```python
# infrastructure/repositories/sql_user_repo.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.interfaces import UserRepository
from app.core.entities import User
from app.infrastructure.database.models import UserModel

class SqlUserRepository(UserRepository):
    def __init__(self, session: AsyncSession):
        self.session = session

    async def find_by_id(self, user_id: int) -> Optional[User]:
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == user_id)
        )
        db_user = result.scalar_one_or_none()
        return User(**db_user.to_dict()) if db_user else None

    async def find_by_email(self, email: str) -> Optional[User]:
        result = await self.session.execute(
            select(UserModel).where(UserModel.email == email)
        )
        db_user = result.scalar_one_or_none()
        return User(**db_user.to_dict()) if db_user else None

    async def save(self, user: User) -> User:
        db_user = UserModel(
            email=user.email,
            hashed_password=user.hashed_password
        )
        self.session.add(db_user)
        await self.session.commit()
        await self.session.refresh(db_user)
        return User(**db_user.to_dict())
```

### Mock Implementation for Testing

```python
# infrastructure/repositories/mock_user_repo.py
from typing import Dict, Optional
from app.core.interfaces import UserRepository
from app.core.entities import User

class MockUserRepository(UserRepository):
    """In-memory repository for testing."""

    def __init__(self):
        self._users: Dict[int, User] = {}
        self._email_index: Dict[str, int] = {}
        self._next_id = 1

    async def find_by_id(self, user_id: int) -> Optional[User]:
        return self._users.get(user_id)

    async def find_by_email(self, email: str) -> Optional[User]:
        user_id = self._email_index.get(email)
        if user_id:
            return self._users[user_id]
        return None

    async def save(self, user: User) -> User:
        if user.id is None:
            user.id = self._next_id
            self._next_id += 1

        self._users[user.id] = user
        self._email_index[user.email] = user.id
        return user
```

## Domain Entities

### Entity with Behavior

```python
# core/entities.py
from dataclasses import dataclass
from datetime import datetime
from typing import List

@dataclass
class User:
    id: int | None = None
    email: str = ""
    hashed_password: str = ""
    is_active: bool = True
    created_at: datetime | None = None

    def verify_password(self, password: str) -> bool:
        """Verify password against stored hash."""
        from app.core.security import verify_password
        return verify_password(password, self.hashed_password)

    def set_password(self, password: str) -> None:
        """Hash and set password."""
        from app.core.security import get_password_hash
        self.hashed_password = get_password_hash(password)

@dataclass
class Order:
    id: int | None = None
    user_id: int = 0
    items: List["OrderItem"] = None
    total: float = 0.0
    status: str = "pending"
    created_at: datetime | None = None

    def __post_init__(self):
        if self.items is None:
            self.items = []

    def calculate_total(self) -> None:
        """Calculate order total from items."""
        self.total = sum(item.price * item.quantity for item in self.items)

    def can_be_cancelled(self) -> bool:
        """Check if order can be cancelled."""
        return self.status in ["pending", "processing"]
```

## API Layer (DTOs)

### Request/Response DTOs

```python
# api/v1/schemas/user_schemas.py
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserCreateDTO(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    name: str = Field(..., min_length=2, max_length=50)

class UserUpdateDTO(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=50)
    is_active: bool | None = None

class UserResponseDTO(BaseModel):
    id: int
    email: str
    name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserListResponseDTO(BaseModel):
    users: list[UserResponseDTO]
    total: int
    page: int
    page_size: int
```

## Error Handling

### Custom Exceptions

```python
# core/exceptions.py
from fastapi import HTTPException, status

class DomainException(Exception):
    """Base exception for domain errors."""
    pass

class NotFoundException(DomainException):
    """Resource not found."""
    pass

class ValidationException(DomainException):
    """Validation failed."""
    pass

class UnauthorizedException(DomainException):
    """Unauthorized access."""
    pass

# Convert domain exceptions to HTTP responses
# main.py or in middleware
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(DomainException)
async def domain_exception_handler(request: Request, exc: DomainException):
    status_code = status.HTTP_400_BAD_REQUEST

    if isinstance(exc, NotFoundException):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, UnauthorizedException):
        status_code = status.HTTP_401_UNAUTHORIZED

    return JSONResponse(
        status_code=status_code,
        content={"detail": str(exc)}
    )
```

## Transaction Management

### Unit of Work Pattern

```python
# infrastructure/database/unit_of_work.py
from abc import ABC, abstractmethod
from typing import TypeVar, Type
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar('T')

class UnitOfWork(ABC):
    """Manage database transactions."""

    @abstractmethod
    async def __aenter__(self):
        pass

    @abstractmethod
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

    @abstractmethod
    async def commit(self):
        pass

    @abstractmethod
    async def rollback(self):
        pass

class SqlAlchemyUnitOfWork(UnitOfWork):
    def __init__(self, session_factory):
        self.session_factory = session_factory

    async def __aenter__(self):
        self.session = self.session_factory()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await self.rollback()
        await self.session.close()

    async def commit(self):
        await self.session.commit()

    async def rollback(self):
        await self.session.rollback()
```

## Key Principles

1. **Dependency Direction**: Inner layers (core) must NOT depend on outer layers (infrastructure)
2. **Interface Segregation**: Define specific interfaces for each use case
3. **Testability**: Use dependency injection to easily swap implementations
4. **Domain First**: Start with domain entities and business rules
5. **Separation of Concerns**: Each layer has a single responsibility
