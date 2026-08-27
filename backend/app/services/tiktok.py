import asyncio
import os
import uuid
import logging
from pathlib import Path
import yt_dlp

from app.config import settings
from app.utils.cookie_helper import get_platform_cookie_file

logger = logging.getLogger(__name__)

TEMP_DIR = Path(settings.TEMP_DIR)
TEMP_DIR.mkdir(parents=True, exist_ok=True)


def _sanitize_filename(title: str, fallback: str) -> str:
    clean = "".join(ch for ch in title if ch.isalnum() or ch in " -_").strip()
    return clean[:100] or fallback


def _get_cookie_file_path() -> str | None:
    return get_platform_cookie_file(
        platform="tiktok",
        cookie_file_setting=getattr(settings, "TIKTOK_COOKIE_FILE", None),
        cookie_env_raw=os.getenv("TIKTOK_COOKIES"),
        candidate_filenames=["tiktok_cookies.txt", "cookies.txt", "../cookies.txt"],
    )


def _build_opts(file_format: str, output_path: str, use_cookies: bool = True) -> dict:
    opts = {
        "outtmpl": output_path,
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "retries": 3,
        "fragment_retries": 3,
        "nocheckcertificate": True,
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
    }

    if use_cookies:
        cookie_file = _get_cookie_file_path()
        if cookie_file:
            opts["cookiefile"] = cookie_file

    if file_format == "mp3":
        opts.update(
            {
                "format": "bestaudio/best",
                "postprocessors": [
                    {
                        "key": "FFmpegExtractAudio",
                        "preferredcodec": "mp3",
                        "preferredquality": "192",
                    }
                ],
            }
        )
    else:
        opts.update(
            {
                "format": "best[ext=mp4]/best",
                "merge_output_format": "mp4",
            }
        )

    return opts


async def get_tiktok_info(url: str) -> dict:
    def _extract() -> dict:
        cookie_file = _get_cookie_file_path()
        opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "nocheckcertificate": True,
            "http_headers": {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        }
        if cookie_file:
            opts["cookiefile"] = cookie_file

        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                "title": info.get("title") or "TikTok Video",
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
                "uploader": info.get("uploader") or info.get("creator"),
                "viewCount": info.get("view_count"),
                "formats": [
                    {"id": "mp4_best", "label": "MP4 Best Quality", "format": "mp4", "quality": "best"},
                    {"id": "mp3_192", "label": "MP3 Audio (192kbps)", "format": "mp3", "quality": "192"},
                ],
                "platform": "tiktok",
            }

    return await asyncio.to_thread(_extract)


async def download_tiktok(url: str, file_format: str, quality: str) -> dict:
    del quality
    job_id = str(uuid.uuid4())
    extension = "mp3" if file_format == "mp3" else "mp4"
    output_path = str(TEMP_DIR / f"{job_id}.{extension}")

    opts = _build_opts(file_format, output_path)

    def _download() -> dict:
        with yt_dlp.YoutubeDL(opts) as ydl:
            return ydl.extract_info(url, download=True)

    info = await asyncio.to_thread(_download)

    file_path = output_path
    if not os.path.exists(file_path):
        for candidate_ext in ["mp4", "mp3", "webm", "mkv", "m4a"]:
            candidate = str(TEMP_DIR / f"{job_id}.{candidate_ext}")
            if os.path.exists(candidate):
                file_path = candidate
                break

    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
    title = info.get("title") or "tiktok-video"
    filename = f"{_sanitize_filename(title, 'tiktok-video')}.{extension}"

    return {
        "job_id": job_id,
        "file_path": file_path,
        "filename": filename,
        "file_size": file_size,
        "title": title,
        "thumbnail": info.get("thumbnail"),
        "duration": info.get("duration"),
    }
