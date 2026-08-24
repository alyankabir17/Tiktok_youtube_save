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
            content = cookies_raw.strip().replace("\\n", "\n")
            if not content.startswith("# Netscape"):
                content = "# Netscape HTTP Cookie File\n" + content
            with open(tmp_cookie_path, "w", encoding="utf-8") as f:
                f.write(content)
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
                "player_client": ["tvhtml5", "android", "android_vr"]
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

            standard_heights = [4320, 2160, 1440, 1080, 720, 480, 360, 240, 144]
            quality_options = []

            # Add all supported standard resolutions found or custom resolutions
            combined_heights = sorted(available_heights.union(set(h for h in standard_heights if any(avail <= h for avail in available_heights))), reverse=True)

            for height in combined_heights:
                if height in available_heights or any(h >= height for h in available_heights):
                    label_map = {4320: "8K", 2160: "4K", 1440: "2K (1440p)"}
                    label = label_map.get(height, f"{height}p")
                    quality_options.append({
                        "id": f"mp4_{height}p",
                        "label": f"MP4 {label}",
                        "format": "mp4",
                        "quality": f"{height}p"
                    })

            if not quality_options:
                quality_options = [
                    {"id": "mp4_best", "label": "MP4 Best Quality", "format": "mp4", "quality": "best"},
                ]

            quality_options += [
                {"id": "mp3_320", "label": "MP3 Audio (320kbps)", "format": "mp3", "quality": "320"},
                {"id": "mp3_192", "label": "MP3 Audio (192kbps)", "format": "mp3", "quality": "192"},
                {"id": "m4a_best", "label": "M4A AAC Audio", "format": "m4a", "quality": "best"},
                {"id": "wav_best", "label": "WAV Lossless Audio", "format": "wav", "quality": "best"},
                {"id": "flac_best", "label": "FLAC Lossless Audio", "format": "flac", "quality": "best"},
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
    fmt_lower = format.lower()
    output_template = str(TEMP_DIR / f"{job_id}.%(ext)s")

    audio_formats = ["mp3", "m4a", "wav", "flac", "opus", "aac", "ogg"]
    if fmt_lower in audio_formats:
        ext = fmt_lower
        bitrate = quality if quality.isdigit() else "192"
        download_opts = {
            "outtmpl": output_template,
            "format": "bestaudio/best",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": fmt_lower,
                "preferredquality": bitrate,
            }],
        }
    else:
        ext = fmt_lower if fmt_lower in ["webm", "mkv", "mov", "avi"] else "mp4"
        if quality and quality.endswith("p") and quality[:-1].isdigit():
            target_height = int(quality[:-1])
            format_spec = (
                f"bestvideo[height<={target_height}][ext={ext}]+bestaudio/"
                f"bestvideo[height<={target_height}]+bestaudio/"
                f"best[height<={target_height}]/"
                f"best[ext={ext}]/best"
            )
        else:
            format_spec = f"bestvideo[ext={ext}]+bestaudio/bestvideo+bestaudio/best[ext={ext}]/best"

        download_opts = {
            "outtmpl": output_template,
            "format": format_spec,
            "merge_output_format": ext,
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