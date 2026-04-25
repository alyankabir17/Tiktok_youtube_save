from fastapi import Request

async def check_rate_limit(request: Request) -> None:
    """
    Rate limiting disabled (Redis not configured).
    This is a no-op function to satisfy dependencies.
    """
    pass