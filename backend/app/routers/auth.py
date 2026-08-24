from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.schemas import MeResponse, TokenResponse, UserLoginRequest, UserRegisterRequest, UserResponse
from app.models.user import User
from app.services.auth_service import create_access_token, get_user_by_email, hash_password, verify_password
from app.utils.dependencies import get_optional_current_user


router = APIRouter(prefix="/api/auth", tags=["auth"])


def _to_user_response(user: User) -> UserResponse:
    return UserResponse(id=str(user.id), email=user.email, username=user.username)


@router.post("/register", response_model=TokenResponse)
async def register(
    request: UserRegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    existing = await get_user_by_email(db, request.email.strip().lower())
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    if len(request.password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 6 characters")

    user = User(
        email=request.email.strip().lower(),
        username=(request.username or request.email.split("@")[0]).strip(),
        password_hash=hash_password(request.password),
        provider="credentials",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": user.email})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24,
    )
    return TokenResponse(access_token=token, user=_to_user_response(user))


@router.post("/login", response_model=TokenResponse)
async def login(
    request: UserLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    user = await get_user_by_email(db, request.email.strip().lower())
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id), "email": user.email})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24,
    )
    return TokenResponse(access_token=token, user=_to_user_response(user))


@router.get("/me", response_model=MeResponse)
async def get_current_user(user: User | None = Depends(get_optional_current_user)) -> MeResponse:
    if not user:
        return MeResponse(user=None)
    return MeResponse(user=_to_user_response(user))


@router.post("/logout")
async def logout(response: Response) -> dict[str, bool]:
    response.delete_cookie("access_token")
    return {"success": True}
