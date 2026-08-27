import os
import uuid
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.schemas import DownloadInfoRequest, DownloadStartRequest, DownloadStartResponse, DownloadStatsResponse, VideoInfoResponse
from app.models.user import User
from app.services.history_service import create_history_entry, get_download_stats
from app.services.tiktok import download_tiktok, get_tiktok_info
from app.services.youtube import download_youtube, get_youtube_info
from app.services.vimeo import download_vimeo, get_vimeo_info
from app.services.instagram import download_instagram, get_instagram_info
from app.utils.dependencies import get_optional_current_user
from app.utils.file_cleanup import schedule_cleanup
from app.utils.url_parser import detect_platform


router = APIRouter(prefix="/api/download", tags=["download"])


def _clean_error_message(exc: Exception) -> str:
    raw_msg = str(exc)

    if "https://github.com/yt-dlp" in raw_msg:
        raw_msg = raw_msg.split("See  https://github.com")[0].split("See https://github.com")[0]

    for prefix in ["ERROR: [youtube]", "ERROR: [tiktok]", "ERROR: [vimeo]", "ERROR: [Instagram]", "ERROR: [instagram]"]:
        if prefix in raw_msg:
            parts = raw_msg.split(prefix)
            if len(parts) > 1:
                raw_msg = parts[1].strip()
                if ":" in raw_msg and len(raw_msg.split(":")[0].strip()) <= 25:
                    raw_msg = raw_msg.split(":", 1)[1].strip()
            break

    msg_lower = raw_msg.lower()
    if "private video" in msg_lower or "is private" in msg_lower or "empty media response" in msg_lower:
        return "This video is private, restricted, or requires login."
    if "sign in to confirm" in msg_lower or "please sign in" in msg_lower or "login required" in msg_lower:
        return "This video requires authentication or sign-in."
    if "requested format is not available" in msg_lower:
        return "The requested quality or format is not available for this video."
    if "video unavailable" in msg_lower or "post unavailable" in msg_lower or "not found" in msg_lower or "does not exist" in msg_lower:
        return "The video is unavailable or has been removed."
    if "copyright" in msg_lower:
        return "This video cannot be downloaded due to a copyright claim."

    clean = raw_msg.strip()
    return clean if (clean and len(clean) > 3) else "An error occurred while processing the video. Please check the link and try again."


@router.post("/info", response_model=VideoInfoResponse)
async def get_video_info(payload: DownloadInfoRequest) -> VideoInfoResponse:
    platform = detect_platform(payload.url)
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL. Only TikTok, YouTube, Instagram, and Vimeo URLs are supported.",
        )

    try:
        if platform == "tiktok":
            info = await get_tiktok_info(payload.url)
        elif platform == "youtube":
            info = await get_youtube_info(payload.url)
        elif platform == "instagram":
            info = await get_instagram_info(payload.url)
        else:
            info = await get_vimeo_info(payload.url)
        return VideoInfoResponse.model_validate(info)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_clean_error_message(exc),
        ) from exc


@router.post("/start", response_model=DownloadStartResponse)
async def start_download(
    payload: DownloadStartRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_current_user),
) -> DownloadStartResponse:
    platform = detect_platform(payload.url)
    if not platform:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported URL")

    try:
        if platform == "tiktok":
            result = await download_tiktok(payload.url, payload.format, payload.quality)
        elif platform == "youtube":
            result = await download_youtube(payload.url, payload.format, payload.quality)
        elif platform == "instagram":
            result = await download_instagram(payload.url, payload.format, payload.quality)
        else:
            result = await download_vimeo(payload.url, payload.format, payload.quality)

        schedule_cleanup(result["file_path"], delay=600)
        schedule_cleanup(result["file_path"], delay=settings.CLEANUP_DELAY_SECONDS)

        if user:
            ip = request.client.host if request.client else None
            await create_history_entry(
                db,
                user_id=user.id,
                platform=platform,
                original_url=payload.url,
                video_title=result.get("title"),
                thumbnail_url=result.get("thumbnail"),
                duration=result.get("duration"),
                file_format=payload.format,
                quality=payload.quality,
                file_size=result.get("file_size"),
                ip_address=ip,
            )

        base_download_url = request.url_for("serve_file", job_id=result["job_id"])
        encoded_name = quote(result["filename"])
        download_url = f"{base_download_url}?filename={encoded_name}"

        return DownloadStartResponse(
            job_id=result["job_id"],
            download_url=str(download_url),
            filename=result["filename"],
            file_size=result.get("file_size"),
            title=result.get("title"),
            thumbnail=result.get("thumbnail"),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_clean_error_message(exc),
        ) from exc


@router.get("/file/{job_id}", name="serve_file")
async def serve_file(job_id: str, filename: str = "video.mp4") -> FileResponse:
    try:
        uuid.UUID(job_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid job ID") from exc

    base_dir = settings.temp_path
    existing_path: str | None = None
    extension = "bin"
    for ext in ("mp4", "mp3", "webm", "m4a", "mkv", "wav", "flac"):
        candidate = base_dir / f"{job_id}.{ext}"
        if candidate.exists() and candidate.is_file():
            existing_path = str(candidate)
            extension = ext
            break

    if not existing_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found or expired")

    safe_filename = "".join(ch for ch in filename if ch.isalnum() or ch in ".-_ ").strip() or f"video.{extension}"
    return FileResponse(
        path=existing_path,
        media_type="application/octet-stream",
        filename=safe_filename,
        headers={"X-File-Size": str(os.path.getsize(existing_path))},
    )


@router.get("/stats")
async def download_stats(db: AsyncSession = Depends(get_db)):
    """Download statistics endpoint"""
    try:
        return await get_download_stats(db)
    except Exception:
        return {
            "totalDownloads": 0,
            "tiktokDownloads": 0,
            "youtubeDownloads": 0,
            "instagramDownloads": 0,
            "downloadsToday": 0,
        }
