from datetime import UTC, datetime

from fastapi import APIRouter
from sqlalchemy import text

from app.database import engine


router = APIRouter(tags=["health"])


@router.api_route("/api/health", methods=["GET", "HEAD"])
async def health() -> dict[str, str]:
    async with engine.connect() as connection:
        await connection.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.now(UTC).isoformat(),
    }