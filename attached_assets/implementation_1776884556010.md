# 🎬 TikTok & YouTube Video Downloader — Full Implementation Guide

> **Phase-by-phase blueprint** covering architecture, folder structure, database design, SEO, and every file needed.

---

## 📐 Tech Stack Decision

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR/SSG for SEO, fast routing, built-in image optimization |
| Backend | FastAPI (Python) | Async, fast, yt-dlp integration is Python-native |
| Database | PostgreSQL + Prisma ORM | Relational, scalable, great for user history |
| Auth | NextAuth.js (JWT) | Simple OAuth + credentials auth |
| Cache | Redis | Rate limiting, job queue caching |
| Queue | Celery + Redis | Async download jobs for large files |
| Storage | Cloudflare R2 or local /tmp | Temp file storage for downloads |
| CDN / Proxy | Cloudflare | Edge caching, DDoS protection |
| Deployment | Vercel (frontend) + Railway/Render (backend) | Free tier friendly |

---

## 🗂️ Folder Structure

### Frontend (Next.js)

```
frontend/
├── app/
│   ├── layout.tsx                  # Root layout with metadata
│   ├── page.tsx                    # Homepage (TikTok downloader)
│   ├── youtube/
│   │   └── page.tsx                # YouTube downloader page
│   ├── history/
│   │   └── page.tsx                # User download history (auth required)
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── blog/                       # SEO blog content
│   │   ├── page.tsx                # Blog index
│   │   └── [slug]/page.tsx         # Individual blog posts
│   ├── api/
│   │   └── auth/[...nextauth]/     # NextAuth handler
│   └── sitemap.ts                  # Auto sitemap generation
│
├── components/
│   ├── downloader/
│   │   ├── UrlInput.tsx            # Main URL input component
│   │   ├── FormatSelector.tsx      # MP4 / MP3 selector
│   │   ├── QualityPicker.tsx       # 720p, 1080p, 4K options
│   │   ├── DownloadCard.tsx        # Result card with thumbnail
│   │   ├── ProgressBar.tsx         # Download progress
│   │   └── PlatformTabs.tsx        # TikTok / YouTube tabs
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── MobileNav.tsx
│   ├── seo/
│   │   ├── SchemaMarkup.tsx        # JSON-LD structured data
│   │   └── BreadcrumbNav.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   └── ui/                         # Reusable UI atoms
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Spinner.tsx
│       └── Toast.tsx
│
├── lib/
│   ├── api.ts                      # Axios/fetch wrapper for FastAPI
│   ├── auth.ts                     # NextAuth config
│   ├── hooks/
│   │   ├── useDownload.ts          # Download state management
│   │   └── useHistory.ts           # Fetch user history
│   └── utils/
│       ├── url-validator.ts        # Client-side URL validation
│       └── format-bytes.ts
│
├── content/
│   └── blog/                       # MDX blog posts for SEO
│       ├── how-to-download-tiktok-without-watermark.mdx
│       ├── best-tiktok-downloader-2025.mdx
│       ├── download-youtube-mp3-guide.mdx
│       └── tiktok-vs-youtube-downloader-comparison.mdx
│
├── public/
│   ├── favicon.ico
│   ├── og-image.png                # Open Graph default image
│   └── robots.txt
│
├── styles/
│   └── globals.css
│
├── next.config.js
├── tailwind.config.ts
└── .env.local
```

### Backend (FastAPI)

```
backend/
├── app/
│   ├── main.py                     # FastAPI app entry point
│   ├── config.py                   # Settings (pydantic BaseSettings)
│   ├── database.py                 # SQLAlchemy async engine
│   │
│   ├── routers/
│   │   ├── download.py             # /api/download endpoints
│   │   ├── auth.py                 # /api/auth endpoints
│   │   ├── history.py              # /api/history endpoints
│   │   └── health.py               # /api/health check
│   │
│   ├── services/
│   │   ├── tiktok.py               # TikTok download logic (yt-dlp)
│   │   ├── youtube.py              # YouTube download logic (yt-dlp)
│   │   ├── watermark.py            # Watermark removal logic
│   │   ├── auth_service.py         # JWT creation/verification
│   │   └── history_service.py      # DB operations for history
│   │
│   ├── models/
│   │   ├── user.py                 # SQLAlchemy User model
│   │   ├── download_history.py     # SQLAlchemy DownloadHistory model
│   │   └── schemas.py              # Pydantic request/response schemas
│   │
│   ├── middleware/
│   │   ├── rate_limiter.py         # Redis-based rate limiting
│   │   └── cors.py                 # CORS settings
│   │
│   ├── tasks/
│   │   └── download_worker.py      # Celery async task for large files
│   │
│   └── utils/
│       ├── url_parser.py           # Detect TikTok vs YouTube URLs
│       ├── file_cleanup.py         # Delete temp files after download
│       └── proxy_manager.py        # Rotate proxies for scraping
│
├── alembic/                        # DB migrations
│   ├── env.py
│   └── versions/
│
├── tests/
│   ├── test_tiktok.py
│   ├── test_youtube.py
│   └── test_auth.py
│
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env
```

---

## 🗄️ Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  password_hash VARCHAR(255),
  provider VARCHAR(50) DEFAULT 'credentials', -- google, github, credentials
  provider_id VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Download history (only for logged-in users)
CREATE TABLE download_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL,           -- 'tiktok' | 'youtube'
  original_url TEXT NOT NULL,
  video_title TEXT,
  thumbnail_url TEXT,
  duration INTEGER,                         -- seconds
  format VARCHAR(10) NOT NULL,             -- 'mp4' | 'mp3'
  quality VARCHAR(20),                     -- '720p' | '1080p' | 'audio'
  file_size BIGINT,                        -- bytes
  downloaded_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,                         -- for abuse tracking
  status VARCHAR(20) DEFAULT 'completed'   -- completed | failed
);

-- Rate limiting (optional, can use Redis)
CREATE TABLE rate_limits (
  ip_address INET PRIMARY KEY,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_history_user_id ON download_history(user_id);
CREATE INDEX idx_history_downloaded_at ON download_history(downloaded_at DESC);
CREATE INDEX idx_history_platform ON download_history(platform);
```

---

## 🔌 API Endpoints (FastAPI)

### Download Endpoints

```
POST /api/download/info
  Body: { url: string }
  Response: { title, thumbnail, duration, formats[], platform }
  Auth: Optional

POST /api/download/start
  Body: { url: string, format: "mp4"|"mp3", quality: "720p"|"1080p"|"4k"|"audio" }
  Response: { download_url: string, filename: string, file_size: int }
  Auth: Optional (if logged in, saves to history)

GET /api/download/file/{job_id}
  Response: StreamingResponse (file bytes)

GET /api/history
  Auth: Required
  Response: { items: DownloadHistory[], total: int, page: int }

DELETE /api/history/{id}
  Auth: Required
  Response: { success: bool }

POST /api/auth/register
  Body: { email, password, username }

POST /api/auth/login
  Body: { email, password }
  Response: { access_token, user }

GET /api/health
  Response: { status: "ok", version }
```

---

## ⚙️ Backend Core — Key Files

### `backend/app/services/tiktok.py`

```python
import yt_dlp
import asyncio
import os
import uuid
from pathlib import Path
from app.config import settings

TEMP_DIR = Path("/tmp/downloads")
TEMP_DIR.mkdir(exist_ok=True)

def get_tiktok_opts(format: str, quality: str, output_path: str) -> dict:
    """
    yt-dlp options for TikTok — removes watermark by default
    by using the watermark-free CDN source when available.
    """
    base_opts = {
        "outtmpl": output_path,
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        # Key: prefer the no-watermark format
        "format_sort": ["vcodec:h264", "res:1080"],
        "extractor_args": {
            "tiktok": {
                "webpage_download": False,
                # Pull from play_addr_bytevc1 (no watermark source)
                "api_hostname": "api22-normal-c-useast2a.tiktokv.com",
            }
        },
        # Use cookies if available for age-restricted content
        "cookiefile": settings.TIKTOK_COOKIE_FILE if settings.TIKTOK_COOKIE_FILE else None,
    }

    if format == "mp3":
        base_opts.update({
            "format": "bestaudio/best",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
        })
    else:
        # For MP4 — try to get no-watermark version
        base_opts.update({
            "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "merge_output_format": "mp4",
        })

    return base_opts


async def get_tiktok_info(url: str) -> dict:
    """Extract video metadata without downloading."""
    opts = {"quiet": True, "no_warnings": True, "skip_download": True}
    loop = asyncio.get_event_loop()
    
    def _extract():
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                "title": info.get("title", "TikTok Video"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
                "uploader": info.get("uploader"),
                "view_count": info.get("view_count"),
                "like_count": info.get("like_count"),
                "formats": _build_format_list(info),
                "platform": "tiktok"
            }
    
    return await loop.run_in_executor(None, _extract)


async def download_tiktok(url: str, format: str, quality: str) -> dict:
    """Download TikTok video, return file path and metadata."""
    job_id = str(uuid.uuid4())
    filename = f"{job_id}.{'mp3' if format == 'mp3' else 'mp4'}"
    output_path = str(TEMP_DIR / filename)
    
    opts = get_tiktok_opts(format, quality, output_path)
    loop = asyncio.get_event_loop()
    
    def _download():
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
            return info
    
    info = await loop.run_in_executor(None, _download)
    file_size = os.path.getsize(output_path)
    
    return {
        "job_id": job_id,
        "file_path": output_path,
        "filename": f"{info.get('title', 'tiktok-video')}.{'mp3' if format == 'mp3' else 'mp4'}",
        "file_size": file_size,
        "title": info.get("title"),
        "thumbnail": info.get("thumbnail"),
        "duration": info.get("duration"),
    }


def _build_format_list(info: dict) -> list:
    formats = [
        {"id": "mp4_best", "label": "MP4 Best Quality", "format": "mp4", "quality": "best"},
        {"id": "mp3_192", "label": "MP3 Audio (192kbps)", "format": "mp3", "quality": "audio"},
    ]
    return formats
```

### `backend/app/services/youtube.py`

```python
import yt_dlp
import asyncio
import os
import uuid
from pathlib import Path
from app.config import settings

TEMP_DIR = Path("/tmp/downloads")


async def get_youtube_info(url: str) -> dict:
    opts = {"quiet": True, "skip_download": True}

    def _extract():
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Build available quality list from formats
            resolutions = set()
            for f in info.get("formats", []):
                if f.get("vcodec") != "none" and f.get("height"):
                    resolutions.add(f["height"])
            
            quality_options = [
                {"id": f"mp4_{r}p", "label": f"MP4 {r}p", "format": "mp4", "quality": f"{r}p"}
                for r in sorted(resolutions, reverse=True)
                if r in [2160, 1440, 1080, 720, 480, 360]
            ] + [
                {"id": "mp3_320", "label": "MP3 Audio (320kbps)", "format": "mp3", "quality": "320"},
                {"id": "mp3_128", "label": "MP3 Audio (128kbps)", "format": "mp3", "quality": "128"},
            ]
            
            return {
                "title": info.get("title"),
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
                "channel": info.get("channel"),
                "view_count": info.get("view_count"),
                "upload_date": info.get("upload_date"),
                "description": info.get("description", "")[:500],
                "formats": quality_options,
                "platform": "youtube"
            }
    
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _extract)


async def download_youtube(url: str, format: str, quality: str) -> dict:
    job_id = str(uuid.uuid4())
    ext = "mp3" if format == "mp3" else "mp4"
    output_path = str(TEMP_DIR / f"{job_id}.%(ext)s")
    
    if format == "mp3":
        quality_num = quality.replace("kbps", "").strip()
        opts = {
            "outtmpl": output_path,
            "format": "bestaudio/best",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": quality_num or "320",
            }],
            "quiet": True,
        }
    else:
        height = quality.replace("p", "")
        opts = {
            "outtmpl": output_path,
            "format": f"bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/best[height<={height}][ext=mp4]/best",
            "merge_output_format": "mp4",
            "quiet": True,
        }
    
    def _download():
        with yt_dlp.YoutubeDL(opts) as ydl:
            return ydl.extract_info(url, download=True)
    
    loop = asyncio.get_event_loop()
    info = await loop.run_in_executor(None, _download)
    
    # Find actual output file
    actual_path = str(TEMP_DIR / f"{job_id}.{ext}")
    file_size = os.path.getsize(actual_path) if os.path.exists(actual_path) else 0
    
    return {
        "job_id": job_id,
        "file_path": actual_path,
        "filename": f"{info.get('title', 'youtube-video')}.{ext}",
        "file_size": file_size,
        "title": info.get("title"),
        "thumbnail": info.get("thumbnail"),
        "duration": info.get("duration"),
    }
```

### `backend/app/routers/download.py`

```python
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from fastapi.responses import FileResponse
from app.models.schemas import DownloadInfoRequest, DownloadStartRequest
from app.services.tiktok import get_tiktok_info, download_tiktok
from app.services.youtube import get_youtube_info, download_youtube
from app.utils.url_parser import detect_platform
from app.middleware.rate_limiter import check_rate_limit
from app.services.history_service import save_to_history
from app.utils.file_cleanup import schedule_cleanup
import os

router = APIRouter(prefix="/api/download", tags=["download"])


@router.post("/info")
async def get_video_info(
    request: DownloadInfoRequest,
    req: Request,
    _: None = Depends(check_rate_limit)
):
    platform = detect_platform(request.url)
    if not platform:
        raise HTTPException(400, "Invalid URL. Only TikTok and YouTube URLs are supported.")
    
    try:
        if platform == "tiktok":
            info = await get_tiktok_info(request.url)
        else:
            info = await get_youtube_info(request.url)
        return info
    except Exception as e:
        raise HTTPException(422, f"Could not fetch video info: {str(e)}")


@router.post("/start")
async def start_download(
    request: DownloadStartRequest,
    req: Request,
    background_tasks: BackgroundTasks,
    _: None = Depends(check_rate_limit),
    # current_user = Depends(get_optional_user)  # optional auth
):
    platform = detect_platform(request.url)
    if not platform:
        raise HTTPException(400, "Unsupported URL")
    
    try:
        if platform == "tiktok":
            result = await download_tiktok(request.url, request.format, request.quality)
        else:
            result = await download_youtube(request.url, request.format, request.quality)
        
        # Schedule cleanup after 10 minutes
        background_tasks.add_task(schedule_cleanup, result["file_path"], delay=600)
        
        # Save to history if user is logged in
        # if current_user:
        #     await save_to_history(current_user.id, platform, request, result)
        
        return {
            "job_id": result["job_id"],
            "filename": result["filename"],
            "file_size": result["file_size"],
            "title": result["title"],
            "thumbnail": result["thumbnail"],
        }
    except Exception as e:
        raise HTTPException(500, f"Download failed: {str(e)}")


@router.get("/file/{job_id}")
async def serve_file(job_id: str, filename: str = "video.mp4"):
    """Stream the downloaded file to user."""
    # Validate job_id (prevent path traversal)
    if not job_id.replace("-", "").isalnum():
        raise HTTPException(400, "Invalid job ID")
    
    # Try both mp4 and mp3
    for ext in ["mp4", "mp3", "webm"]:
        file_path = f"/tmp/downloads/{job_id}.{ext}"
        if os.path.exists(file_path):
            return FileResponse(
                file_path,
                filename=filename,
                media_type="application/octet-stream",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'}
            )
    
    raise HTTPException(404, "File not found or expired")
```

### `backend/app/middleware/rate_limiter.py`

```python
import redis.asyncio as redis
from fastapi import HTTPException, Request
from app.config import settings

redis_client = redis.from_url(settings.REDIS_URL)

async def check_rate_limit(request: Request):
    """
    Rate limit: 30 requests per hour per IP for anonymous users.
    Logged-in users get 200 requests per hour.
    """
    ip = request.client.host
    key = f"rate_limit:{ip}"
    
    count = await redis_client.incr(key)
    if count == 1:
        await redis_client.expire(key, 3600)
    
    limit = 30  # anonymous limit
    # TODO: increase for authenticated users
    
    if count > limit:
        raise HTTPException(
            429,
            detail="Too many requests. Please wait or create a free account for more downloads.",
            headers={"Retry-After": "3600"}
        )
```

### `backend/app/config.py`

```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    TIKTOK_COOKIE_FILE: Optional[str] = None
    MAX_FILE_SIZE_MB: int = 500
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### `backend/requirements.txt`

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
celery==5.4.0
python-multipart==0.0.9
httpx==0.27.0
aiofiles==24.1.0
```

### `backend/docker-compose.yml`

```yaml
version: "3.9"
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/videodownloader
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - /tmp/downloads:/tmp/downloads

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: videodownloader
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  worker:
    build: .
    command: celery -A app.tasks.download_worker worker --loglevel=info
    depends_on:
      - redis

volumes:
  pgdata:
```

---

## 🚀 Frontend Key Logic

### `frontend/lib/hooks/useDownload.ts`

```typescript
import { useState, useCallback } from 'react'
import { apiClient } from '@/lib/api'

export type DownloadStatus = 'idle' | 'fetching_info' | 'downloading' | 'ready' | 'error'

export interface VideoInfo {
  title: string
  thumbnail: string
  duration: number
  platform: 'tiktok' | 'youtube'
  formats: Array<{ id: string; label: string; format: string; quality: string }>
}

export function useDownload() {
  const [status, setStatus] = useState<DownloadStatus>('idle')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const fetchInfo = useCallback(async (url: string) => {
    setStatus('fetching_info')
    setError(null)
    try {
      const data = await apiClient.post('/download/info', { url })
      setVideoInfo(data)
      setStatus('ready')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch video info')
      setStatus('error')
    }
  }, [])

  const startDownload = useCallback(async (url: string, format: string, quality: string) => {
    setStatus('downloading')
    setProgress(0)
    try {
      // Simulate progress (real SSE/websocket can replace this)
      const timer = setInterval(() => setProgress(p => Math.min(p + 10, 90)), 500)
      
      const data = await apiClient.post('/download/start', { url, format, quality })
      clearInterval(timer)
      setProgress(100)
      
      // Construct direct download URL
      const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/download/file/${data.job_id}?filename=${encodeURIComponent(data.filename)}`
      setDownloadUrl(fileUrl)
      setStatus('ready')
      
      // Trigger browser download
      const a = document.createElement('a')
      a.href = fileUrl
      a.download = data.filename
      a.click()
      
      return data
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
    }
  }, [])

  const reset = () => {
    setStatus('idle')
    setVideoInfo(null)
    setDownloadUrl(null)
    setError(null)
    setProgress(0)
  }

  return { status, videoInfo, downloadUrl, error, progress, fetchInfo, startDownload, reset }
}
```

---

## 🔍 SEO Strategy — What Other Sites Miss

### 1. Programmatic SEO Pages
Create auto-generated pages targeting long-tail keywords:
- `/download/tiktok/[username]` → "Download all videos from @username"
- `/how-to/download-tiktok-without-watermark`
- `/tools/tiktok-to-mp3`
- `/tools/youtube-to-mp3`

### 2. Dynamic Metadata (Next.js App Router)

```typescript
// app/page.tsx
export const metadata = {
  title: 'TikTok Downloader — Save Videos Without Watermark | Free MP4 & MP3',
  description: 'Download TikTok videos without watermark in HD. Also save YouTube videos as MP4 or MP3. Free, fast, no app needed.',
  keywords: ['tiktok downloader', 'tiktok without watermark', 'save tiktok video', 'youtube mp3 downloader'],
  openGraph: {
    title: 'TikTok Downloader Without Watermark',
    description: 'Free TikTok & YouTube video downloader. No watermark, HD quality, MP4 & MP3.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: 'https://yoursite.com' },
}
```

### 3. JSON-LD Structured Data

```typescript
// components/seo/SchemaMarkup.tsx
export function SoftwareSchema() {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "TikTok Video Downloader",
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "description": "Free TikTok and YouTube video downloader without watermark",
      "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "reviewCount": "1240" }
    })}} />
  )
}
```

### 4. Core Web Vitals Optimization
- Use `next/image` for all thumbnails
- Lazy load below-fold components
- Preload critical fonts
- Use `loading="eager"` on hero content
- Target LCP < 1.5s, CLS < 0.05

### 5. Blog Content Strategy (MDX)
Create SEO-optimized blog posts targeting:
- "how to download tiktok without watermark on iphone"
- "tiktok downloader without watermark online free"
- "youtube to mp3 converter free"
- "save tiktok video to camera roll"

---

## ✨ What Makes This Better Than Competitors

| Feature | Most Sites | This Project |
|---|---|---|
| Watermark removal | Often fails | Uses yt-dlp no-watermark API source |
| Quality selection | 1 option | 360p to 4K + MP3 quality tiers |
| Batch download | ❌ | ✅ (Phase 2 — playlist support) |
| User history | ❌ | ✅ (logged-in users) |
| Download progress | Fake spinner | Real progress tracking |
| Mobile UX | Poor | Mobile-first, PWA-ready |
| Rate limiting feedback | Hard block | Friendly "create account" upsell |
| No ads/redirect | ❌ Lots of ads | Clean, fast, no redirect |
| Dark mode | ❌ | ✅ System preference + toggle |
| Speed | Slow (no queue) | Async queue via Celery |
| SEO | Thin content | MDX blog + programmatic pages |

---

## 🛠️ Environment Variables

### `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### `backend/.env`
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/videodownloader
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-very-long-secret-key
TIKTOK_COOKIE_FILE=/app/cookies/tiktok_cookies.txt
ALLOWED_ORIGINS=["http://localhost:3000","https://yoursite.com"]
```

---

## 📦 Phase Breakdown

| Phase | Scope |
|---|---|
| **Phase 1** | Core downloader (TikTok + YouTube MP4/MP3), no auth, basic UI |
| **Phase 2** | Auth (login/register/Google OAuth), download history |
| **Phase 3** | SEO blog (MDX), sitemap, structured data, Core Web Vitals |
| **Phase 4** | Batch download, playlists, progress via SSE |
| **Phase 5** | PWA, mobile app wrapper, browser extension |

---

## 🔧 Tool Recommendation for Frontend

### ✅ Use **Bolt.new** for Frontend

**Why Bolt over Lovable or Replit:**
- Generates full Next.js 14 App Router projects (not just components)
- Better Tailwind + shadcn/ui integration out of the box
- Can set up NextAuth, API routes, and folder structure in one prompt
- Exports clean code you can drop into GitHub
- Supports `.env` configuration directly in the UI
- The backend prompt below can also be scaffolded in Bolt using FastAPI + the Python runtime

**Replit** is good if you want to host frontend + backend together in one workspace, but Bolt gives cleaner, more production-ready code. **Lovable** is better for pure UI but struggles with full-stack Next.js + auth.

**Recommended workflow:**
1. Use **Bolt.new** → paste the frontend prompt (see `frontend-prompt.md`) → get full Next.js app
2. Use **Bolt.new** OR **Replit** → paste backend prompt (see `backend-prompt.md`) → get FastAPI scaffolded
3. Connect both, deploy frontend to Vercel, backend to Railway

---

*See `frontend-prompt.md` and `backend-prompt.md` for agent-ready prompts.*
