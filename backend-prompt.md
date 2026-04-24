# Backend Agent Prompt — TikTok & YouTube Video Downloader
# Paste this entire prompt into Bolt.new, Replit, or your backend agent

---

Build a complete **FastAPI** backend for a TikTok & YouTube video downloader. The backend must handle video info extraction, downloading without watermark, file serving, user auth with JWT, and download history tracking in PostgreSQL.

---

## Tech Stack
- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL with SQLAlchemy (async)
- **Migrations**: Alembic
- **Auth**: JWT (python-jose) + passlib for password hashing
- **Download Engine**: yt-dlp
- **Caching / Rate Limiting**: Redis
- **Async Tasks**: Celery + Redis (for large downloads)
- **Validation**: Pydantic v2
- **CORS**: Configured for Next.js frontend

---

## Complete Folder Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── download.py
│   │   ├── auth.py
│   │   ├── history.py
│   │   └── health.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── tiktok.py
│   │   ├── youtube.py
│   │   ├── auth_service.py
│   │   └── history_service.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── download_history.py
│   │   └── schemas.py
│   │
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── rate_limiter.py
│   │   └── cors.py
│   │
│   ├── tasks/
│   │   └── download_worker.py
│   │
│   └── utils/
│       ├── __init__.py
│       ├── url_parser.py
│       ├── file_cleanup.py
│       └── dependencies.py
│
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── 001_initial.py
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_download.py
│   └── test_auth.py
│
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env
└── .env.example
```

---

## File Implementations

### `app/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import download, auth, history, health
from app.config import settings

app = FastAPI(
    title="VideoDownloader API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url=None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(download.router)
app.include_router(auth.router)
app.include_router(history.router)
app.include_router(health.router)
```

### `app/config.py`
```python
from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24h
    TIKTOK_COOKIE_FILE: Optional[str] = None
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    MAX_DOWNLOAD_SIZE_MB: int = 500
    TEMP_DIR: str = "/tmp/downloads"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### `app/database.py`
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

### `app/models/user.py`
```python
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100))
    password_hash = Column(String(255), nullable=True)
    provider = Column(String(50), default="credentials")
    provider_id = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    history = relationship("DownloadHistory", back_populates="user", cascade="all, delete-orphan")
```

### `app/models/download_history.py`
```python
from sqlalchemy import Column, String, Integer, BigInteger, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import relationship
import uuid
from app.database import Base

class DownloadHistory(Base):
    __tablename__ = "download_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String(20), nullable=False)        # tiktok | youtube
    original_url = Column(String(2000), nullable=False)
    video_title = Column(String(500))
    thumbnail_url = Column(String(2000))
    duration = Column(Integer)                            # seconds
    format = Column(String(10), nullable=False)          # mp4 | mp3
    quality = Column(String(20))                         # 720p | 1080p | audio
    file_size = Column(BigInteger)                       # bytes
    downloaded_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(INET, nullable=True)
    status = Column(String(20), default="completed")
    
    user = relationship("User", back_populates="history")
```

### `app/models/schemas.py`
```python
from pydantic import BaseModel, HttpUrl, validator
from typing import Optional, List
from datetime import datetime
import uuid

class DownloadInfoRequest(BaseModel):
    url: str
    
    @validator('url')
    def validate_url(cls, v):
        if not ('tiktok.com' in v or 'youtube.com' in v or 'youtu.be' in v):
            raise ValueError('Only TikTok and YouTube URLs are supported')
        return v

class FormatOption(BaseModel):
    id: str
    label: str
    format: str   # mp4 | mp3
    quality: str

class VideoInfoResponse(BaseModel):
    title: str
    thumbnail: Optional[str]
    duration: Optional[int]
    platform: str
    formats: List[FormatOption]
    uploader: Optional[str] = None
    view_count: Optional[int] = None

class DownloadStartRequest(BaseModel):
    url: str
    format: str   # mp4 | mp3
    quality: str  # 720p | 1080p | 4k | best | 320 | 192 | 128
    
    @validator('format')
    def validate_format(cls, v):
        if v not in ['mp4', 'mp3']:
            raise ValueError('Format must be mp4 or mp3')
        return v

class DownloadStartResponse(BaseModel):
    job_id: str
    filename: str
    file_size: Optional[int]
    title: Optional[str]
    thumbnail: Optional[str]

class UserRegisterRequest(BaseModel):
    email: str
    password: str
    username: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class HistoryItemResponse(BaseModel):
    id: uuid.UUID
    platform: str
    video_title: Optional[str]
    thumbnail_url: Optional[str]
    format: str
    quality: Optional[str]
    file_size: Optional[int]
    downloaded_at: datetime
    original_url: str
    
    class Config:
        from_attributes = True
```

### `app/services/tiktok.py`
```python
import yt_dlp
import asyncio
import os
import uuid
from pathlib import Path
from app.config import settings

TEMP_DIR = Path(settings.TEMP_DIR)
TEMP_DIR.mkdir(exist_ok=True, parents=True)


def _tiktok_ydl_opts(format: str, output_path: str, quality: str = "best") -> dict:
    """
    Build yt-dlp options for TikTok.
    The key to watermark-free download is using the correct format source
    that TikTok provides without the watermark overlay.
    yt-dlp handles this automatically with the 'download_with_get_dash_video' 
    approach and the playAddr fallback chain.
    """
    opts = {
        "outtmpl": output_path,
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "retries": 3,
        "fragment_retries": 3,
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
    }
    
    if settings.TIKTOK_COOKIE_FILE and os.path.exists(settings.TIKTOK_COOKIE_FILE):
        opts["cookiefile"] = settings.TIKTOK_COOKIE_FILE
    
    if format == "mp3":
        opts.update({
            "format": "bestaudio/best",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
        })
    else:
        opts.update({
            "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "merge_output_format": "mp4",
        })
    
    return opts


async def get_tiktok_info(url: str) -> dict:
    opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "http_headers": {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
    }
    
    def _extract():
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                "title": info.get("title", "TikTok Video"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
                "uploader": info.get("uploader") or info.get("creator"),
                "view_count": info.get("view_count"),
                "like_count": info.get("like_count"),
                "formats": [
                    {"id": "mp4_best", "label": "MP4 Best Quality", "format": "mp4", "quality": "best"},
                    {"id": "mp3_192", "label": "MP3 Audio (192kbps)", "format": "mp3", "quality": "192"},
                ],
                "platform": "tiktok"
            }
    
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _extract)


async def download_tiktok(url: str, format: str, quality: str) -> dict:
    job_id = str(uuid.uuid4())
    ext = "mp3" if format == "mp3" else "mp4"
    output_path = str(TEMP_DIR / f"{job_id}.{ext}")
    
    opts = _tiktok_ydl_opts(format, output_path, quality)
    
    def _download():
        with yt_dlp.YoutubeDL(opts) as ydl:
            return ydl.extract_info(url, download=True)
    
    loop = asyncio.get_event_loop()
    info = await loop.run_in_executor(None, _download)
    
    # Find the actual output file
    actual_path = output_path
    if not os.path.exists(actual_path):
        # yt-dlp might have changed extension
        for candidate_ext in ["mp4", "mp3", "webm", "mkv"]:
            candidate = str(TEMP_DIR / f"{job_id}.{candidate_ext}")
            if os.path.exists(candidate):
                actual_path = candidate
                break
    
    file_size = os.path.getsize(actual_path) if os.path.exists(actual_path) else 0
    title = (info.get("title") or "tiktok-video")[:100]
    safe_title = "".join(c for c in title if c.isalnum() or c in " -_").strip()
    
    return {
        "job_id": job_id,
        "file_path": actual_path,
        "filename": f"{safe_title}.{ext}",
        "file_size": file_size,
        "title": title,
        "thumbnail": info.get("thumbnail"),
        "duration": info.get("duration"),
    }
```

### `app/services/youtube.py`
```python
import yt_dlp
import asyncio
import os
import uuid
from pathlib import Path
from app.config import settings

TEMP_DIR = Path(settings.TEMP_DIR)


async def get_youtube_info(url: str) -> dict:
    opts = {"quiet": True, "skip_download": True, "no_warnings": True}
    
    def _extract():
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            available_heights = set()
            for fmt in info.get("formats", []):
                h = fmt.get("height")
                if h and fmt.get("vcodec") != "none":
                    available_heights.add(h)
            
            quality_options = []
            for height in sorted(available_heights, reverse=True):
                if height in [2160, 1440, 1080, 720, 480, 360, 240]:
                    label = "4K" if height == 2160 else f"{height}p"
                    quality_options.append({
                        "id": f"mp4_{height}p",
                        "label": f"MP4 {label}",
                        "format": "mp4",
                        "quality": f"{height}p"
                    })
            
            quality_options += [
                {"id": "mp3_320", "label": "MP3 320kbps", "format": "mp3", "quality": "320"},
                {"id": "mp3_192", "label": "MP3 192kbps", "format": "mp3", "quality": "192"},
                {"id": "mp3_128", "label": "MP3 128kbps", "format": "mp3", "quality": "128"},
            ]
            
            return {
                "title": info.get("title"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
                "uploader": info.get("channel") or info.get("uploader"),
                "view_count": info.get("view_count"),
                "upload_date": info.get("upload_date"),
                "formats": quality_options,
                "platform": "youtube"
            }
    
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _extract)


async def download_youtube(url: str, format: str, quality: str) -> dict:
    job_id = str(uuid.uuid4())
    ext = "mp3" if format == "mp3" else "mp4"
    output_template = str(TEMP_DIR / f"{job_id}.%(ext)s")
    
    if format == "mp3":
        bitrate = quality if quality.isdigit() else "192"
        opts = {
            "outtmpl": output_template,
            "format": "bestaudio/best",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": bitrate,
            }],
            "quiet": True,
        }
    else:
        height = quality.replace("p", "") if quality.endswith("p") else "1080"
        opts = {
            "outtmpl": output_template,
            "format": f"bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={height}]+bestaudio/best[height<={height}]",
            "merge_output_format": "mp4",
            "quiet": True,
        }
    
    def _download():
        with yt_dlp.YoutubeDL(opts) as ydl:
            return ydl.extract_info(url, download=True)
    
    loop = asyncio.get_event_loop()
    info = await loop.run_in_executor(None, _download)
    
    # Find actual output file
    actual_path = None
    for candidate_ext in ["mp4", "mp3", "webm", "mkv", "m4a"]:
        candidate = str(TEMP_DIR / f"{job_id}.{candidate_ext}")
        if os.path.exists(candidate):
            actual_path = candidate
            break
    
    if not actual_path:
        raise FileNotFoundError(f"Download completed but file not found for job {job_id}")
    
    file_size = os.path.getsize(actual_path)
    title = (info.get("title") or "youtube-video")[:100]
    safe_title = "".join(c for c in title if c.isalnum() or c in " -_").strip()
    
    return {
        "job_id": job_id,
        "file_path": actual_path,
        "filename": f"{safe_title}.{ext}",
        "file_size": file_size,
        "title": title,
        "thumbnail": info.get("thumbnail"),
        "duration": info.get("duration"),
    }
```

### `app/routers/download.py`
```python
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from fastapi.responses import FileResponse
from app.models.schemas import DownloadInfoRequest, DownloadStartRequest, DownloadStartResponse, VideoInfoResponse
from app.services.tiktok import get_tiktok_info, download_tiktok
from app.services.youtube import get_youtube_info, download_youtube
from app.utils.url_parser import detect_platform
from app.utils.file_cleanup import schedule_cleanup
import os

router = APIRouter(prefix="/api/download", tags=["download"])


@router.post("/info", response_model=VideoInfoResponse)
async def get_video_info(
    request: DownloadInfoRequest,
    req: Request,
):
    platform = detect_platform(request.url)
    if not platform:
        raise HTTPException(status_code=400, detail="Invalid URL. Only TikTok and YouTube URLs are supported.")
    
    try:
        if platform == "tiktok":
            return await get_tiktok_info(request.url)
        else:
            return await get_youtube_info(request.url)
    except yt_dlp_error if (yt_dlp_error := Exception) else Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not fetch video info: {str(e)}")


@router.post("/start", response_model=DownloadStartResponse)
async def start_download(
    request: DownloadStartRequest,
    req: Request,
    background_tasks: BackgroundTasks,
):
    platform = detect_platform(request.url)
    if not platform:
        raise HTTPException(status_code=400, detail="Unsupported URL")
    
    try:
        if platform == "tiktok":
            result = await download_tiktok(request.url, request.format, request.quality)
        else:
            result = await download_youtube(request.url, request.format, request.quality)
        
        # Schedule file cleanup after 10 minutes
        background_tasks.add_task(schedule_cleanup, result["file_path"], 600)
        
        return DownloadStartResponse(
            job_id=result["job_id"],
            filename=result["filename"],
            file_size=result["file_size"],
            title=result["title"],
            thumbnail=result["thumbnail"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@router.get("/file/{job_id}")
async def serve_file(job_id: str, filename: str = "video.mp4"):
    # Security: validate job_id format
    clean_id = job_id.replace("-", "")
    if not clean_id.isalnum() or len(clean_id) > 40:
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    for ext in ["mp4", "mp3", "webm", "m4a", "mkv"]:
        file_path = f"/tmp/downloads/{job_id}.{ext}"
        if os.path.exists(file_path):
            safe_filename = "".join(c for c in filename if c.isalnum() or c in ".-_ ").strip()
            return FileResponse(
                file_path,
                filename=safe_filename or f"video.{ext}",
                media_type="application/octet-stream",
                headers={
                    "Content-Disposition": f'attachment; filename="{safe_filename}"',
                    "X-File-Size": str(os.path.getsize(file_path)),
                }
            )
    
    raise HTTPException(status_code=404, detail="File not found or expired. Please download again.")
```

### `app/routers/auth.py`
```python
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.schemas import UserRegisterRequest, UserLoginRequest, TokenResponse
from app.models.user import User
from app.services.auth_service import (
    hash_password, verify_password, create_access_token, get_user_by_email
)
from sqlalchemy import select

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register")
async def register(request: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    existing = await get_user_by_email(db, request.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=request.email,
        username=request.username or request.email.split("@")[0],
        password_hash=hash_password(request.password),
        provider="credentials",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    token = create_access_token({"sub": str(user.id), "email": user.email})
    
    return TokenResponse(
        access_token=token,
        user={"id": str(user.id), "email": user.email, "username": user.username}
    )


@router.post("/login")
async def login(request: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, request.email)
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": str(user.id), "email": user.email})
    
    return TokenResponse(
        access_token=token,
        user={"id": str(user.id), "email": user.email, "username": user.username}
    )
```

### `app/services/auth_service.py`
```python
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.config import settings
from typing import Optional

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()
```

### `app/utils/url_parser.py`
```python
import re
from typing import Optional

TIKTOK_PATTERNS = [
    r'https?://(www\.)?tiktok\.com/@[\w.]+/video/\d+',
    r'https?://vm\.tiktok\.com/\w+',
    r'https?://vt\.tiktok\.com/\w+',
    r'https?://m\.tiktok\.com/v/\d+',
]

YOUTUBE_PATTERNS = [
    r'https?://(www\.)?youtube\.com/watch\?v=[\w-]+',
    r'https?://youtu\.be/[\w-]+',
    r'https?://(www\.)?youtube\.com/shorts/[\w-]+',
    r'https?://m\.youtube\.com/watch\?v=[\w-]+',
]


def detect_platform(url: str) -> Optional[str]:
    url = url.strip()
    
    for pattern in TIKTOK_PATTERNS:
        if re.match(pattern, url):
            return "tiktok"
    
    # Also check domain without strict pattern
    if 'tiktok.com' in url:
        return "tiktok"
    
    for pattern in YOUTUBE_PATTERNS:
        if re.match(pattern, url):
            return "youtube"
    
    if 'youtube.com' in url or 'youtu.be' in url:
        return "youtube"
    
    return None
```

### `app/utils/file_cleanup.py`
```python
import asyncio
import os
import logging

logger = logging.getLogger(__name__)


async def schedule_cleanup(file_path: str, delay: int = 600):
    """Delete a file after `delay` seconds."""
    await asyncio.sleep(delay)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Cleaned up: {file_path}")
    except Exception as e:
        logger.error(f"Cleanup failed for {file_path}: {e}")
```

### `app/middleware/rate_limiter.py`
```python
import redis.asyncio as aioredis
from fastapi import HTTPException, Request
from app.config import settings

_redis = None


async def get_redis():
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


async def check_rate_limit(request: Request):
    """30 req/hour for anonymous IPs."""
    redis = await get_redis()
    ip = request.client.host
    key = f"rl:{ip}"
    
    count = await redis.incr(key)
    if count == 1:
        await redis.expire(key, 3600)
    
    if count > 30:
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Rate limit exceeded. Create a free account for more downloads.",
                "retry_after": 3600
            },
            headers={"Retry-After": "3600", "X-RateLimit-Limit": "30"}
        )
```

### `app/routers/health.py`
```python
from fastapi import APIRouter
from datetime import datetime

router = APIRouter(tags=["health"])


@router.get("/api/health")
async def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }
```

---

## Alembic Migration: `alembic/versions/001_initial.py`
```python
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, INET

def upgrade():
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("username", sa.String(100)),
        sa.Column("password_hash", sa.String(255)),
        sa.Column("provider", sa.String(50), server_default="credentials"),
        sa.Column("provider_id", sa.String(255)),
        sa.Column("avatar_url", sa.String(500)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    
    op.create_table(
        "download_history",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("platform", sa.String(20), nullable=False),
        sa.Column("original_url", sa.String(2000), nullable=False),
        sa.Column("video_title", sa.String(500)),
        sa.Column("thumbnail_url", sa.String(2000)),
        sa.Column("duration", sa.Integer()),
        sa.Column("format", sa.String(10), nullable=False),
        sa.Column("quality", sa.String(20)),
        sa.Column("file_size", sa.BigInteger()),
        sa.Column("downloaded_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("ip_address", INET()),
        sa.Column("status", sa.String(20), server_default="completed"),
    )
    
    op.create_index("idx_history_user_id", "download_history", ["user_id"])
    op.create_index("idx_history_downloaded_at", "download_history", ["downloaded_at"])

def downgrade():
    op.drop_table("download_history")
    op.drop_table("users")
```

---

## `requirements.txt`
```
fastapi==0.115.0
uvicorn[standard]==0.30.0
yt-dlp==2025.1.15
pydantic==2.8.0
pydantic-settings==2.4.0
sqlalchemy[asyncio]==2.0.35
asyncpg==0.29.0
alembic==1.13.2
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
redis==5.0.8
python-multipart==0.0.9
aiofiles==24.1.0
```

---

## `Dockerfile`
```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /tmp/downloads

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## `.env.example`
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/videodownloader
REDIS_URL=redis://localhost:6379
SECRET_KEY=replace-this-with-a-long-random-secret
TIKTOK_COOKIE_FILE=
ALLOWED_ORIGINS=["http://localhost:3000"]
```

---

## Setup Commands
```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# With Docker
docker-compose up --build
```

---

## Important Notes for Agent
1. **ffmpeg must be installed** — it's required by yt-dlp for merging audio/video and MP3 conversion. The Dockerfile handles this.
2. **TikTok cookies** — for some restricted content, exporting browser cookies using `yt-dlp --cookies-from-browser chrome` and providing the path via `TIKTOK_COOKIE_FILE` env var greatly improves success rate.
3. **yt-dlp updates frequently** — run `pip install -U yt-dlp` regularly as sites change their APIs.
4. **Temp files** — all downloads go to `/tmp/downloads` and are deleted after 10 minutes automatically.
5. **Rate limiting** is Redis-based; if Redis isn't available, the middleware should fail open (log and continue) rather than blocking all requests.
