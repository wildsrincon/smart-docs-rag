---
name: fastapi-architecture
description: >
  Build FastAPI applications following Clean Architecture principles with comprehensive testing, security, and API best practices.
  Trigger: When structuring FastAPI projects, implementing clean architecture, writing tests, or applying security patterns.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## When to Use

- Structuring a new FastAPI project with clean architecture
- Organizing existing FastAPI codebase into layers
- Writing tests for FastAPI applications
- Implementing security best practices (CORS, rate limiting, auth)
- Designing API contracts with proper versioning and documentation
- Setting up project structure following SOLID principles

## Critical Patterns

### Project Structure (Clean Architecture)

```
app/
├── api/                 # Interface Layer (Routers, DTOs)
│   ├── v1/
│   │   └── routers/
│   └── dependencies.py
├── core/                # Domain Layer (Entities, Value Objects)
│   ├── entities.py
│   └── interfaces.py    # Repository interfaces
├── services/            # Application Layer (Business Logic)
│   ├── user_service.py
│   └── auth_service.py
├── infrastructure/      # Implementation Layer (DB, external services)
│   ├── database/
│   ├── repositories/    # Repository implementations
│   └── external_apis/
└── config/              # Configuration
    └── settings.py
```

**Key Rule**: Direction of dependencies MUST be:
- api → services → core
- infrastructure → core
- api NEVER depends on infrastructure

### Service Layer Pattern

```python
# services/user_service.py
from app.core.interfaces import UserRepository
from app.core.entities import User

class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def create_user(self, user_data: UserCreateDTO) -> User:
        # Business logic here
        user = User(**user_data.model_dump())
        return await self.user_repo.save(user)
```

### Repository Pattern

```python
# core/interfaces.py
from abc import ABC, abstractmethod
from app.core.entities import User

class UserRepository(ABC):
    @abstractmethod
    async def find_by_email(self, email: str) -> User | None:
        pass

    @abstractmethod
    async def save(self, user: User) -> User:
        pass

# infrastructure/repositories/sql_user_repo.py
class SqlUserRepository(UserRepository):
    async def find_by_email(self, email: str) -> User | None:
        # Implementation with SQLAlchemy
        pass
```

### Dependency Injection with FastAPI

```python
# api/dependencies.py
from fastapi import Depends
from app.infrastructure.repositories import SqlUserRepository
from app.services.user_service import UserService

def get_user_repository() -> UserRepository:
    return SqlUserRepository()

def get_user_service(
    repo: UserRepository = Depends(get_user_repository)
) -> UserService:
    return UserService(repo)

# api/v1/routers/users.py
router = APIRouter()

@router.post("/users")
async def create_user(
    user_data: UserCreateDTO,
    service: UserService = Depends(get_user_service)
):
    return await service.create_user(user_data)
```

## Security Patterns

### Authentication Middleware

```python
# core/security.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    token = credentials.credentials
    try:
        payload = decode_jwt(token)
        return await get_user_by_id(payload["sub"])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
```

### CORS Configuration

```python
# main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://example.com"],  # Use env vars in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Rate Limiting

```python
# api/middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.get("/endpoint")
@limiter.limit("10/minute")
async def endpoint(request: Request):
    pass
```

## Testing Patterns

### Test Structure

```
tests/
├── unit/
│   ├── services/
│   └── core/
├── integration/
│   ├── api/
│   └── repositories/
└── conftest.py
```

### Unit Tests with Fixtures

```python
# tests/unit/services/test_user_service.py
from unittest.mock import AsyncMock
import pytest
from app.services.user_service import UserService
from app.core.entities import User

@pytest.fixture
def mock_user_repo():
    repo = AsyncMock()
    repo.save.return_value = User(id=1, email="test@example.com")
    return repo

@pytest.fixture
def user_service(mock_user_repo):
    return UserService(mock_user_repo)

@pytest.mark.asyncio
async def test_create_user(user_service, mock_user_repo):
    result = await user_service.create_user(UserCreateDTO(email="test@example.com"))
    mock_user_repo.save.assert_called_once()
    assert result.email == "test@example.com"
```

### Integration Tests with Test Client

```python
# tests/integration/api/test_users.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def auth_headers():
    # Generate test auth token
    return {"Authorization": f"Bearer {create_test_token()}"}

def test_create_user(auth_headers):
    response = client.post(
        "/api/v1/users",
        json={"email": "test@example.com"},
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"
```

### conftest.py for Shared Fixtures

```python
# tests/conftest.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.fixture
async def async_client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
```

## API Best Practices

### Response Models (DTOs)

```python
# api/v1/schemas/user_schemas.py
from pydantic import BaseModel, EmailStr, Field

class UserCreateDTO(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)

class UserResponseDTO(BaseModel):
    id: int
    email: str

    model_config = {"from_attributes": True}
```

### Proper HTTP Status Codes

```python
from fastapi import status

# Success: 201 for creation, 200 for retrieval, 204 for no-content
# Client errors: 400 bad request, 401 unauthorized, 403 forbidden, 404 not found
# Server errors: 500 internal server error
```

### API Versioning

```python
# api/v1/__init__.py
from fastapi import APIRouter

v1_router = APIRouter(prefix="/api/v1")

# api/v1/routers/users.py
from app.api.v1 import v1_router

users_router = v1_router.include_router(router, prefix="/users", tags=["users"])
```

### Error Handling

```python
# core/exceptions.py
from fastapi import HTTPException, status

class NotFoundException(HTTPException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

class BadRequestException(HTTPException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

# Usage
if not user:
    raise NotFoundException("User not found")
```

## Commands

```bash
# Initialize new project with clean architecture
mkdir -p app/{api/v1/routers,core,services,infrastructure/{database,repositories},config,tests/{unit,integration}}

# Run tests with coverage
pytest tests/ -v --cov=app --cov-report=html

# Run tests async
pytest tests/ -v --asyncio-mode=auto

# Type checking
mypy app/

# Linting
ruff check app/
ruff format app/

# Security scan
bandit -r app/

# Generate requirements
pip freeze > requirements.txt
```

## Configuration Best Practices

```python
# config/settings.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    DEBUG: bool = False

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

## Resources

- **Templates**: See [assets/](assets/) for project structure templates
- **Testing**: See [references/](references/) for testing patterns
- **Documentation**: FastAPI docs https://fastapi.tiangolo.com/

## Migration from Monolithic to Clean Architecture

1. Extract business logic to services layer
2. Create interfaces for repositories
3. Implement repositories in infrastructure layer
4. Refactor routers to use dependency injection
5. Move domain models to core layer
6. Write tests at each layer

## Common Pitfalls

- ❌ Mixing business logic in routers (move to services)
- ❌ Direct DB access in services (use repositories)
- ❌ No separation between DTOs and entities (use separate models)
- ❌ Skipping validation (use Pydantic models everywhere)
- ❌ Hardcoded config values (use settings.py)
- ❌ Testing only happy paths (include edge cases and error handling)
