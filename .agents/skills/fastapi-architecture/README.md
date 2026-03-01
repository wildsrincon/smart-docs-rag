# FastAPI Architecture Skill

## Overview

This skill provides comprehensive guidance for building FastAPI applications following Clean Architecture principles with:
- **Clean Architecture**: Proper layering and dependency management
- **Testing**: Unit, integration, and E2E testing patterns
- **Security**: Authentication, authorization, and security best practices
- **API Best Practices**: Versioning, error handling, and documentation

## Quick Start

### Initialize New Project

```bash
python .agents/skills/fastapi-architecture/assets/init_project.py my_api
```

### Core Patterns

```
app/
├── api/                 # Routers, DTOs, dependencies
├── core/                # Entities, interfaces
├── services/            # Business logic
├── infrastructure/      # DB, repos, external APIs
└── config/              # Settings
```

## Key Concepts

### Dependency Direction

```
api → services → core
infrastructure → core
```

**Critical**: api MUST NOT depend on infrastructure!

### Service Layer Example

```python
class UserService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    async def create_user(self, data: UserCreateDTO) -> User:
        # Business logic here
        return await self.user_repo.save(user)
```

### Testing

```bash
# Run all tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=html

# Unit tests only
pytest tests/unit/ -v
```

## Resources

- **Templates**: See [assets/](assets/) for code templates
- **Patterns**: See [references/](references/) for detailed guides
  - [Clean Architecture](references/clean_architecture.md)
  - [Security Patterns](references/security_patterns.md)
  - [Testing Patterns](references/testing_patterns.md)

## Trigger Keywords

The AI loads this skill when you:
- Structure FastAPI projects
- Implement clean architecture
- Write tests
- Apply security patterns
- Design API contracts

## Related Skills

- `fastapi-expert`: Performance-focused patterns (async, WebSockets, OpenAPI)
