from fastapi import FastAPI

from ...api.v1.debug import router as debug_router
from ...auth.controller import router as auth_router
from ...chat.controller import router as chat_router
from ...core.config import settings
from ...documents.controller import router as documents_router
from ...todos.controller import router as todos_router
from ...users.controller import router as users_router


def register_routes(app: FastAPI):
    app.include_router(todos_router, prefix=settings.API_V1_STR)
    app.include_router(auth_router, prefix=settings.API_V1_STR)
    app.include_router(users_router, prefix=settings.API_V1_STR)
    app.include_router(documents_router, prefix=settings.API_V1_STR)
    app.include_router(chat_router, prefix=settings.API_V1_STR)
    app.include_router(debug_router, prefix=settings.API_V1_STR)  # Debug endpoints
