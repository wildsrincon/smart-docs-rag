# backend/app/main.py
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.v1.api import register_routes
from .core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configuración de CORS (Crucial para Next.js y WebSockets)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "ws://localhost:3000",
        "ws://localhost:3001",
    ],  # Next.js + WebSocket origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Validate critical configuration on startup"""
    # Warn if Google OAuth is configured but incomplete
    if settings.GOOGLE_CLIENT_ID and not settings.GOOGLE_CLIENT_SECRET:
        logging.warning(
            "GOOGLE_CLIENT_ID is set but GOOGLE_CLIENT_SECRET is missing. "
            "Google OAuth will not work properly."
        )
    elif settings.GOOGLE_CLIENT_SECRET and not settings.GOOGLE_CLIENT_ID:
        logging.warning(
            "GOOGLE_CLIENT_SECRET is set but GOOGLE_CLIENT_ID is missing. "
            "Google OAuth will not work properly."
        )


@app.get("/")
async def root():
    return {"message": "Welcome to the Senior Starter API"}


register_routes(app)
