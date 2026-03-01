# FastAPI Testing Best Practices

This document provides comprehensive testing patterns for FastAPI applications following clean architecture.

## Test Structure

```
tests/
├── unit/              # Fast tests, no external dependencies
│   ├── services/      # Service layer tests
│   └── core/          # Domain logic tests
├── integration/       # Slower tests, with database/API
│   ├── api/           # Endpoint tests
│   └── repositories/  # Database access tests
├── e2e/              # Full workflow tests
└── conftest.py       # Shared fixtures
```

## Unit Testing Services

### Pattern: Mock Repository Dependencies

```python
# tests/unit/services/test_user_service.py
from unittest.mock import AsyncMock, Mock
import pytest
from app.services.user_service import UserService
from app.core.entities import User
from app.api.v1.schemas import UserCreateDTO

@pytest.fixture
def mock_user_repo():
    """Mock repository that returns predefined values."""
    repo = AsyncMock(spec=[])
    repo.save.return_value = User(id=1, email="test@example.com")
    repo.find_by_email.return_value = None
    return repo

@pytest.fixture
def user_service(mock_user_repo):
    """Service with mocked repository injected."""
    return UserService(mock_user_repo)

@pytest.mark.asyncio
async def test_create_user_success(user_service, mock_user_repo):
    """Test successful user creation."""
    dto = UserCreateDTO(email="test@example.com", password="pass123")

    result = await user_service.create_user(dto)

    # Verify repository was called correctly
    mock_user_repo.save.assert_called_once()
    mock_user_repo.find_by_email.assert_called_once_with("test@example.com")

    # Verify result
    assert result.id == 1
    assert result.email == "test@example.com"
```

### Pattern: Test Business Logic

```python
@pytest.mark.asyncio
async def test_create_user_duplicate_email(user_service, mock_user_repo):
    """Test that duplicate emails are rejected."""
    mock_user_repo.find_by_email.return_value = User(id=1, email="test@example.com")

    dto = UserCreateDTO(email="test@example.com", password="pass123")

    with pytest.raises(ValueError, match="Email already exists"):
        await user_service.create_user(dto)
```

## Integration Testing API

### Pattern: Test Client with Auth

```python
# tests/integration/api/test_users.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def auth_token():
    """Generate test JWT token."""
    # Use test secret key from settings
    from app.core.security import create_access_token
    return create_access_token(data={"sub": "user_id"})

def test_create_user(auth_token):
    """Test user creation endpoint."""
    response = client.post(
        "/api/v1/users",
        json={
            "email": "test@example.com",
            "password": "SecurePass123!"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert "password" not in data  # Never return password!
```

### Pattern: Test Error Handling

```python
def test_create_user_invalid_email():
    """Test validation error for invalid email."""
    response = client.post(
        "/api/v1/users",
        json={
            "email": "invalid-email",
            "password": "SecurePass123!"
        }
    )

    assert response.status_code == 422
    assert "detail" in response.json()
```

## Async Testing Patterns

### Using pytest-asyncio

```python
# tests/conftest.py
import pytest

@pytest.fixture(scope="session")
def event_loop_policy():
    """Custom event loop policy for async tests."""
    import asyncio
    asyncio.set_event_loop_policy("uvloop")

# In test file
@pytest.mark.asyncio
async def test_async_operation():
    result = await some_async_function()
    assert result is not None
```

### Database Fixtures

```python
# tests/conftest.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL)
AsyncTestingSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture
async def db_session():
    """Create a database session for tests."""
    async with AsyncTestingSessionLocal() as session:
        # Create tables
        from app.infrastructure.database.base import Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        yield session

        # Cleanup: rollback and drop
        await session.rollback()
```

## Coverage Best Practices

```bash
# Run tests with coverage
pytest tests/ -v --cov=app --cov-report=html --cov-report=term

# Coverage goals:
# - Unit tests: >90%
# - Integration tests: >70%
# - Overall: >80%
```

## Test Organization Principles

1. **Arrange-Act-Assert**: Each test should be clear
2. **One assertion per test**: Keep tests focused
3. **Descriptive names**: `test_create_user_success` not `test_1`
4. **Fixtures for setup**: Reuse test data
5. **Mock external services**: Only test your code

## Common Pitfalls

- ❌ Testing implementation details instead of behavior
- ❌ Not testing error cases
- ❌ Hardcoded test data (use fixtures)
- ❌ Tests that depend on each other (make them independent)
- ❌ Missing edge cases (null values, empty lists, etc.)
