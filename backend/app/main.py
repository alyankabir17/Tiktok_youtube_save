from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import logging

from app.routers import health, auth, download, history
from app.config import settings
from app.database import init_db
import app.models.user  # noqa: F401
import app.models.download_history  # noqa: F401

import os

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto initialize DB tables on startup
    await init_db()
    proxy = getattr(settings, "YOUTUBE_PROXY", None) or os.getenv("YOUTUBE_PROXY")
    if proxy:
        masked = proxy.split("@")[-1] if "@" in proxy else "ENABLED"
        logger.info(f"[VideoSave] YouTube Proxy active: {masked}")
    else:
        logger.warning("[VideoSave] No YOUTUBE_PROXY configured.")
    yield

app = FastAPI(title="VideoDownloader API", version="1.0.0", lifespan=lifespan)

allowed = list(settings.ALLOWED_ORIGINS) if isinstance(settings.ALLOWED_ORIGINS, list) else [str(settings.ALLOWED_ORIGINS)]
if "https://tik-insta-video-down.vercel.app" not in allowed:
    allowed.append("https://tik-insta-video-down.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed,
    allow_origin_regex=r"^https:\/\/.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    first = exc.errors()[0] if exc.errors() else None
    message = "Invalid request"
    if first:
        message = str(first.get("msg") or message)
    return JSONResponse(status_code=422, content={"message": message})

@app.exception_handler(Exception)
async def general_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception(f"Unhandled server error: {exc}")
    return JSONResponse(status_code=500, content={"message": str(exc) or "Internal server error"})

# Routers last
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(download.router)
app.include_router(history.router)
