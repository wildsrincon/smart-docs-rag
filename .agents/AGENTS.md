# Agent Skills

This document lists all available agent skills for this project.

## Skills

| Name | Description | Path |
|------|-------------|------|
| `fastapi-architecture` | Build FastAPI applications following Clean Architecture principles with comprehensive testing, security, and API best practices. | [SKILL.md](skills/fastapi-architecture/SKILL.md) |
| `fastapi-expert` | Use when building high-performance async Python APIs with FastAPI and Pydantic V2. Invoke for async SQLAlchemy, JWT authentication, WebSockets, OpenAPI documentation. | [SKILL.md](skills/fastapi-expert/SKILL.md) |

## Usage

When the AI detects relevant context, it automatically loads the appropriate skill from this list. Skills provide:

- Coding patterns and conventions
- Best practices and guidelines
- Testing strategies
- Architecture decisions
- Common pitfalls to avoid

## Adding New Skills

1. Create skill directory: `mkdir -p .agents/skills/{skill-name}/{assets,references}`
2. Write `SKILL.md` following the template
3. Add entry to this `AGENTS.md` file
4. Test the skill by triggering it in a conversation

## Skill Loading Logic

The AI loads skills based on:
- Trigger keywords in the skill's `description` field
- File context (e.g., editing `main.py` loads FastAPI skills)
- User request patterns (e.g., "create test" loads testing skills)
