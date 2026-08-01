import yt_dlp
import asyncio
import os
import re
import uuid
from pathlib import Path
from app.config import settings

TEMP_DIR = Path(settings.TEMP_DIR)
TEMP_DIR.mkdir(exist_ok=True, parents=True)


def _sanitize_filename(title: str, fallback: str = "vimeo-video") -> str:
    clean = "".join(ch for ch in title if ch.isalnum() or ch in " -_").strip()
    return clean[:100] or fallback


def _normalize_vimeo_url(url: str) -> str:
    """Convert vimeo.com/VIDEO_ID to player.vimeo.com/video/VIDEO_ID
    to avoid the OAuth token 401 error with yt-dlp's Vimeo API extractor."""
    m = re.search(
        r'vimeo\.com/(?:video/|channels/[^/]+/|groups/[^/]+/videos/)?(?P<id>\d+)',
        url,
    )
    if m:
        return f"https://player.vimeo.com/video/{m.group('id')}"
    return url


def _build_vimeo_opts(extra_opts: dict | None = None) -> dict:
    opts: dict = {
        "quiet": True,
        "no_warnings": True,
        "socket_timeout": 30,
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://vimeo.com/",
        },
        "noplaylist": True,
        "retries": 3,
        "fragment_retries": 3,
    }

    if getattr(settings, "VIMEO_COOKIE_FILE", None) and os.path.exists(settings.VIMEO_COOKIE_FILE):
        opts["cookiefile"] = settings.VIMEO_COOKIE_FILE

    if extra_opts:
        opts.update(extra_opts)

    return opts


async def get_vimeo_info(url: str) -> dict:
    player_url = _normalize_vimeo_url(url)
    opts = _build_vimeo_opts({"skip_download": True})

    def _extract() -> dict:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(player_url, download=False)

            available_heights: set[int] = set()
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
                        "quality": f"{height}p",
                    })

            if not quality_options:
                quality_options = [
                    {"id": "mp4_best", "label": "MP4 Best Quality", "format": "mp4", "quality": "best"},
                ]

            quality_options += [
                {"id": "mp3_320", "label": "MP3 320kbps", "format": "mp3", "quality": "320"},
                {"id": "mp3_192", "label": "MP3 192kbps", "format": "mp3", "quality": "192"},
                {"id": "mp3_128", "label": "MP3 128kbps", "format": "mp3", "quality": "128"},
            ]

            return {
                "title": info.get("title") or "Vimeo Video",
                "thumbnail": info.get("thumbnail"),
                "duration": info.get("duration"),
                "uploader": info.get("uploader") or info.get("channel"),
                "view_count": info.get("view_count"),
                "upload_date": info.get("upload_date"),
                "formats": quality_options,
                "platform": "vimeo",
            }

    return await asyncio.to_thread(_extract)


async def download_vimeo(url: str, format: str, quality: str) -> dict:
    player_url = _normalize_vimeo_url(url)
    job_id = str(uuid.uuid4())
    ext = "mp3" if format == "mp3" else "mp4"
    output_template = str(TEMP_DIR / f"{job_id}.%(ext)s")

    if format == "mp3":
        bitrate = quality if quality.isdigit() else "192"
        download_opts = {
            "outtmpl": output_template,
            "format": "bestaudio/best",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": bitrate,
            }],
        }
    else:
        download_opts = {
            "outtmpl": output_template,
            "format": "best[ext=mp4]/best",
            "merge_output_format": "mp4",
        }

    opts = _build_vimeo_opts(download_opts)

    def _download() -> dict:
        with yt_dlp.YoutubeDL(opts) as ydl:
            return ydl.extract_info(player_url, download=True)

    info = await asyncio.to_thread(_download)

    actual_path: str | None = None
    for candidate_ext in ["mp4", "mp3", "webm", "mkv", "m4a"]:
        candidate = str(TEMP_DIR / f"{job_id}.{candidate_ext}")
        if os.path.exists(candidate):
            actual_path = candidate
            break

    if not actual_path:
        raise FileNotFoundError(f"Download completed but file not found for job {job_id}")

    file_size = os.path.getsize(actual_path)
    title = (info.get("title") or "vimeo-video")[:100]
    safe_title = _sanitize_filename(title)

    return {
        "job_id": job_id,
        "file_path": actual_path,
        "filename": f"{safe_title}.{ext}",
        "file_size": file_size,
        "title": title,
        "thumbnail": info.get("thumbnail"),
        "duration": info.get("duration"),
    }
