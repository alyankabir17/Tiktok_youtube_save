import uuid

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.services.auth_service import decode_token


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_optional_current_user(
    request: Request,
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    header_token = None
    if auth_header and auth_header.lower().startswith("bearer "):
        header_token = auth_header[7:].strip()

    cookie_token = request.cookies.get("access_token")
    resolved_token = header_token or token or cookie_token

    if not resolved_token:
        return None

    if resolved_token.startswith("Bearer "):
        resolved_token = resolved_token[7:]

    payload = decode_token(resolved_token)
    if not payload:
        return None

    user_id_raw = payload.get("sub")
    if not user_id_raw:
        return None

    try:
        user_id = uuid.UUID(str(user_id_raw))
    except ValueError:
        return None

    user = await db.get(User, user_id)
    return user


async def get_current_user(user: User | None = Depends(get_optional_current_user)) -> User:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized",
        )
    return user
