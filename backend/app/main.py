# backend/app/main.py
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .api.v1.api import register_routes
from .core.config import settings
from .notifications.redis_notifier import redis_notifier
from .rate_limiter import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────────
    if settings.REDIS_URL:
        redis_notifier.configure(settings.REDIS_URL)
        logging.info(
            "Redis notifier configured for cross-worker WebSocket notifications"
        )
    else:
        logging.info(
            "REDIS_URL not set — WebSocket notifications work in single-worker mode only"
        )

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

    yield
    # ── Shutdown (add cleanup here if needed) ────────────────────────────────


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Wire rate limiter into app — without this, all @limiter.limit decorators are no-ops
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.exception(f"Unhandled exception on {request.method} {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )


@app.get("/")
async def root():
    return {"message": "Welcome to the Senior Starter API"}


register_routes(app)
