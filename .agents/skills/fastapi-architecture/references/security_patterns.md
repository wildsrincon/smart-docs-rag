# FastAPI Security Best Practices

This document covers security patterns and best practices for FastAPI applications.

## Authentication

### JWT Authentication

```python
# core/security.py
from datetime import datetime, timedelta
from typing import Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Dependency to get current authenticated user."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```

### OAuth2 with Password Flow

```python
# api/v1/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    """OAuth2 compatible login endpoint."""
    user = await get_user_by_email(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}
```

## Authorization

### Role-Based Access Control (RBAC)

```python
# core/permissions.py
from enum import Enum
from functools import wraps
from typing import Callable
from fastapi import HTTPException, status

class Role(str, Enum):
    ADMIN = "admin"
    USER = "user"
    MODERATOR = "moderator"

def require_role(required_role: Role):
    """Decorator to require specific role."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
            if current_user.role != required_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Role {required_role} required"
                )
            return await func(*args, **kwargs, current_user=current_user, **kwargs)
        return wrapper
    return decorator

# Usage
@router.delete("/admin/users/{user_id}")
@require_role(Role.ADMIN)
async def delete_user(user_id: int, current_user: User = Depends(get_current_user)):
    pass
```

## Rate Limiting

### Using slowapi

```python
# main.py
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests"}
    )

# In router
@router.get("/expensive-endpoint")
@limiter.limit("10/minute")
async def expensive_endpoint(request: Request):
    return {"message": "success"}
```

## CORS Configuration

```python
# main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://example.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)
```

## Input Validation

### Pydantic for Validation

```python
from pydantic import BaseModel, EmailStr, Field, field_validator

class UserCreateDTO(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    name: str = Field(..., min_length=2, max_length=50)

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Ensure password meets security requirements."""
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v
```

### SQL Injection Prevention

```python
# Always use parameterized queries with SQLAlchemy
# ✅ Good
result = await db.execute(
    select(User).where(User.email == email)
)

# ❌ Bad - vulnerable to SQL injection
result = await db.execute(
    f"SELECT * FROM users WHERE email = '{email}'"
)
```

## Security Headers

```python
# main.py
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# Only allow requests from specific hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["example.com", "*.example.com"]
)

# Add security headers
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)
```

## Secrets Management

```python
# config/settings.py
from pydantic_settings import BaseSettings
from typing import Literal

class Settings(BaseSettings):
    # Never hardcode secrets
    SECRET_KEY: str  # Load from environment variable
    DATABASE_URL: str  # Load from environment variable
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
```

## Security Checklist

- [ ] All passwords hashed with bcrypt/argon2
- [ ] JWT tokens have expiration
- [ ] HTTPS enforced in production
- [ ] CORS configured properly
- [ ] Rate limiting on public endpoints
- [ ] Input validation with Pydantic
- [ ] No secrets in code (use env vars)
- [ ] Security headers configured
- [ ] SQL injection prevention (parameterized queries)
- [ ] Authentication on protected routes
- [ ] Role-based access control
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies regularly updated
- [ ] Security scans run (bandit, safety)
