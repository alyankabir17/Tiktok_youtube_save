import logging
from datetime import timedelta

import redis.asyncio as aioredis
from fastapi import Depends, HTTPException, Request, status

from app.config import settings
from app.models.user import User
from app.utils.dependencies import get_optional_current_user


logger = logging.getLogger(__name__)
_redis_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


async def check_rate_limit(
    request: Request,
    user: User | None = Depends(get_optional_current_user),
) -> None:
    """Fail open if Redis is unavailable to avoid blocking all traffic."""
    try:
        redis = await get_redis()

        if user:
            key = f"rl:user:{user.id}"
            limit = settings.AUTH_RATE_LIMIT_PER_HOUR
        else:
            ip = request.client.host if request.client else "unknown"
            key = f"rl:ip:{ip}"
            limit = settings.ANON_RATE_LIMIT_PER_HOUR

        count = await redis.incr(key)
        if count == 1:
            await redis.expire(key, int(timedelta(hours=1).total_seconds()))

        if count > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
                headers={"Retry-After": "3600"},
            )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Rate limiter failed; request allowed (fail-open)")
