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


def _sanitize_filename(title: str, fallback: str = "instagram-video") -> str:
    clean = "".join(ch for ch in title if ch.isalnum() or ch in " -_").strip()
    return clean[:100] or fallback


def _get_cookie_file_path() -> str | None:
    return get_platform_cookie_file(
        platform="instagram",
        cookie_file_setting=getattr(settings, "INSTAGRAM_COOKIE_FILE", None),
        cookie_env_raw=getattr(settings, "INSTAGRAM_COOKIES", None) or os.getenv("INSTAGRAM_COOKIES"),
        candidate_filenames=["instagram_cookies.txt", "cookies.txt", "../cookies.txt"],
    )


def _build_instagram_opts(extra_opts: dict | None = None, use_cookies: bool = True) -> dict:
    opts = {
        "quiet": True,
        "no_warnings": True,
        "socket_timeout": 30,
        "retries": 3,
        "fragment_retries": 3,
        "nocheckcertificate": True,
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        },
    }

    if use_cookies:
        cookie_file = _get_cookie_file_path()
        if cookie_file:
            opts["cookiefile"] = cookie_file

    if extra_opts:
        opts.update(extra_opts)

    return opts


async def get_instagram_info(url: str) -> dict:
    def _extract():
        strategies = [
            {"use_cookies": True},
            {"use_cookies": False},
        ]
        last_error = None

        for strat in strategies:
            opts = _build_instagram_opts(
                {"skip_download": True},
                use_cookies=strat["use_cookies"]
            )
            try:
                with yt_dlp.YoutubeDL(opts) as ydl:
                    info = ydl.extract_info(url, download=False)
                    if info:
                        # Extract basic info
                        raw_title = info.get("title") or info.get("description") or "Instagram Video"
                        title = raw_title.split("\n")[0][:100].strip() or "Instagram Video"
                        
                        formats = [
                            {"id": "mp4_best", "label": "MP4 HD (Best Quality)", "format": "mp4", "quality": "best"},
                            {"id": "mp4_1080p", "label": "MP4 1080p Full HD", "format": "mp4", "quality": "1080p"},
                            {"id": "mp4_720p", "label": "MP4 720p HD", "format": "mp4", "quality": "720p"},
                            {"id": "mp3_320", "label": "MP3 Audio (320kbps)", "format": "mp3", "quality": "320"},
                            {"id": "mp3_192", "label": "MP3 Audio (192kbps)", "format": "mp3", "quality": "192"},
                        ]
                        
                        return {
                            "title": title,
                            "thumbnail": info.get("thumbnail"),
                            "duration": info.get("duration"),
                            "uploader": info.get("uploader") or info.get("channel") or info.get("uploader_id"),
                            "view_count": info.get("view_count") or info.get("like_count"),
                            "formats": formats,
                            "platform": "instagram",
                        }
            except Exception as e:
                last_error = e
                logger.warning(f"Instagram info extraction strategy {strat} failed: {e}")
                continue

        if last_error:
            raise last_error
        raise RuntimeError("Unable to extract Instagram media info.")

    return await asyncio.to_thread(_extract)


async def download_instagram(url: str, file_format: str, quality: str) -> dict:
    del quality
    job_id = str(uuid.uuid4())
    fmt_lower = file_format.lower()
    extension = "mp3" if fmt_lower == "mp3" else "mp4"
    output_path = str(TEMP_DIR / f"{job_id}.{extension}")

    if fmt_lower == "mp3":
        download_opts = {
            "outtmpl": output_path,
            "format": "bestaudio/best",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
        }
    else:
        download_opts = {
            "outtmpl": output_path,
            "format": "best[ext=mp4]/bestvideo+bestaudio/best",
            "merge_output_format": "mp4",
        }

    def _download():
        strategies = [
            {"use_cookies": True},
            {"use_cookies": False},
        ]
        last_error = None

        for strat in strategies:
            opts = _build_instagram_opts(
                download_opts,
                use_cookies=strat["use_cookies"]
            )
            try:
                with yt_dlp.YoutubeDL(opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    if info:
                        return info
            except Exception as e:
                last_error = e
                logger.warning(f"Instagram download strategy {strat} failed: {e}")
                continue

        if last_error:
            raise last_error
        raise RuntimeError("Unable to download Instagram video.")

    info = await asyncio.to_thread(_download)

    # Locate output file
    file_path = output_path
    if not os.path.exists(file_path):
        for candidate_ext in ["mp4", "mp3", "webm", "mkv", "m4a"]:
            candidate = str(TEMP_DIR / f"{job_id}.{candidate_ext}")
            if os.path.exists(candidate):
                file_path = candidate
                break

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Download finished but file not found for job {job_id}")

    file_size = os.path.getsize(file_path)
    raw_title = info.get("title") or info.get("description") or "instagram-video"
    title = raw_title.split("\n")[0][:100].strip() or "instagram-video"
    filename = f"{_sanitize_filename(title, 'instagram-video')}.{extension}"

    return {
        "job_id": job_id,
        "file_path": file_path,
        "filename": filename,
        "file_size": file_size,
        "title": title,
        "thumbnail": info.get("thumbnail"),
        "duration": info.get("duration"),
    }
