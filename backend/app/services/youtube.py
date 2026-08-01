import yt_dlp
import asyncio
import os
import uuid
from pathlib import Path
from app.config import settings

TEMP_DIR = Path(settings.TEMP_DIR)
TEMP_DIR.mkdir(exist_ok=True, parents=True)


def _get_cookie_file_path() -> str | None:
    # 1. Check if YOUTUBE_COOKIE_FILE path exists
    if getattr(settings, "YOUTUBE_COOKIE_FILE", None) and os.path.exists(settings.YOUTUBE_COOKIE_FILE):
        return settings.YOUTUBE_COOKIE_FILE

    # 2. Check if YOUTUBE_COOKIES env var contains raw Netscape cookie content string
    cookies_raw = getattr(settings, "YOUTUBE_COOKIES", None) or os.getenv("YOUTUBE_COOKIES")
    if cookies_raw and cookies_raw.strip():
        tmp_cookie_path = TEMP_DIR / "youtube_cookies.txt"
        try:
            with open(tmp_cookie_path, "w", encoding="utf-8") as f:
                f.write(cookies_raw.strip())
            return str(tmp_cookie_path)
        except Exception:
            pass

    # 3. Check for local cookies.txt file in backend directory or root
    for candidate in ["youtube_cookies.txt", "cookies.txt", "../cookies.txt"]:
        if os.path.exists(candidate):
            return candidate

    return None


def _build_youtube_opts(extra_opts: dict | None = None) -> dict:
    opts = {
        "quiet": True,
        "no_warnings": True,
        "socket_timeout": 30,
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        },
        "extractor_args": {
            "youtube": {
                "player_client": ["ios", "mweb", "android", "web", "tv"]
            }
        }
    }

    cookie_file = _get_cookie_file_path()
    if cookie_file:
        opts["cookiefile"] = cookie_file

    if extra_opts:
        opts.update(extra_opts)

    return opts


async def get_youtube_info(url: str) -> dict:
    opts = _build_youtube_opts({"skip_download": True})
    
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
            
            if not quality_options:
                quality_options = [
                    {"id": "mp4_best", "label": "MP4 Best", "format": "mp4", "quality": "best"},
                ]
            
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
    
    opts = _build_youtube_opts(download_opts)
    
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