import asyncio
import os
import uuid
import logging
from pathlib import Path

try:
    import yt_dlp
except ImportError:  # pragma: no cover - optional dependency is installed in runtime env
    yt_dlp = None

from app.config import settings
from app.utils.cookie_helper import get_platform_cookie_file

logger = logging.getLogger(__name__)

TEMP_DIR = Path(settings.TEMP_DIR)
TEMP_DIR.mkdir(exist_ok=True, parents=True)


def _require_yt_dlp():
    if yt_dlp is None:
        raise RuntimeError("yt-dlp is not installed. Please install the dependencies for the backend environment.")


def _get_cookie_file_path() -> str | None:
    return get_platform_cookie_file(
        platform="youtube",
        cookie_file_setting=getattr(settings, "YOUTUBE_COOKIE_FILE", None),
        cookie_env_raw=getattr(settings, "YOUTUBE_COOKIES", None) or os.getenv("YOUTUBE_COOKIES"),
        candidate_filenames=["youtube_cookies.txt", "cookies.txt", "../cookies.txt"],
    )


def _build_youtube_opts(extra_opts: dict | None = None, use_cookies: bool = False, player_clients: list[str] | None = None) -> dict:
    clients = player_clients or ["android", "ios"]
    
    extractor_youtube = {
        "player_client": clients,
    }
    
    po_token = getattr(settings, "YOUTUBE_PO_TOKEN", None) or os.getenv("YOUTUBE_PO_TOKEN")
    if po_token and po_token.strip():
        extractor_youtube["po_token"] = [po_token.strip()]

    opts = {
        "quiet": True,
        "no_warnings": True,
        "socket_timeout": 30,
        "retries": 3,
        "fragment_retries": 3,
        "nocheckcertificate": True,
        "geo_bypass": True,
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        },
        "extractor_args": {
            "youtube": extractor_youtube
        }
    }

    if use_cookies:
        cookie_file = _get_cookie_file_path()
        if cookie_file:
            opts["cookiefile"] = cookie_file

    proxy = getattr(settings, "YOUTUBE_PROXY", None) or os.getenv("YOUTUBE_PROXY") or os.getenv("HTTP_PROXY") or os.getenv("HTTPS_PROXY")
    if proxy and proxy.strip():
        opts["proxy"] = proxy.strip()

    if extra_opts:
        opts.update(extra_opts)

    return opts


def _extract_quality_options(info: dict) -> list[dict]:
    available_heights = set()
    for fmt in info.get("formats", []):
        h = fmt.get("height")
        if h and fmt.get("vcodec") != "none":
            available_heights.add(h)

    standard_heights = [4320, 2160, 1440, 1080, 720, 480, 360, 240, 144]
    quality_options = []

    combined_heights = sorted(
        available_heights.union(set(h for h in standard_heights if any(avail <= h for avail in available_heights))),
        reverse=True,
    )

    for height in combined_heights:
        if height in available_heights or any(h >= height for h in available_heights):
            label_map = {4320: "8K", 2160: "4K", 1440: "2K (1440p)"}
            label = label_map.get(height, f"{height}p")
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
        {"id": "mp3_320", "label": "MP3 Audio (320kbps)", "format": "mp3", "quality": "320"},
        {"id": "mp3_192", "label": "MP3 Audio (192kbps)", "format": "mp3", "quality": "192"},
        {"id": "m4a_best", "label": "M4A AAC Audio", "format": "m4a", "quality": "best"},
        {"id": "wav_best", "label": "WAV Lossless Audio", "format": "wav", "quality": "best"},
        {"id": "flac_best", "label": "FLAC Lossless Audio", "format": "flac", "quality": "best"},
    ]
    return quality_options


async def get_youtube_info(url: str) -> dict:
    def _extract_with_fallback():
        strategies = [
            # 1. Primary mobile clients (android, ios - bypasses datacenter bot detection)
            {"use_cookies": False, "player_clients": ["android", "ios"]},
            # 2. Android alone
            {"use_cookies": False, "player_clients": ["android"]},
            # 3. Web Safari & iOS fallback
            {"use_cookies": False, "player_clients": ["web_safari", "ios"]},
            # 4. Cookies (if provided for age-gated media)
            {"use_cookies": True, "player_clients": ["android", "ios"]},
            # 5. iOS / mweb fallback
            {"use_cookies": False, "player_clients": ["ios", "mweb"]},
        ]

        last_error = None
        for strat in strategies:
            opts = _build_youtube_opts(
                {"skip_download": True},
                use_cookies=strat["use_cookies"],
                player_clients=strat["player_clients"],
            )
            try:
                with yt_dlp.YoutubeDL(opts) as ydl:
                    info = ydl.extract_info(url, download=False)
                    if info:
                        quality_options = _extract_quality_options(info)
                        return {
                            "title": info.get("title") or "YouTube Video",
                            "thumbnail": info.get("thumbnail"),
                            "duration": info.get("duration"),
                            "uploader": info.get("channel") or info.get("uploader"),
                            "view_count": info.get("view_count"),
                            "upload_date": info.get("upload_date"),
                            "formats": quality_options,
                            "platform": "youtube",
                        }
            except Exception as e:
                last_error = e
                logger.warning(f"YouTube info extraction strategy {strat} failed: {e}")
                continue

        if last_error:
            raise last_error
        raise RuntimeError("Unable to extract YouTube video information.")

    return await asyncio.to_thread(_extract_with_fallback)


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

    def _download_with_fallback():
        strategies = [
            {"use_cookies": False, "player_clients": ["android", "ios"]},
            {"use_cookies": False, "player_clients": ["android"]},
            {"use_cookies": False, "player_clients": ["web_safari", "ios"]},
            {"use_cookies": True, "player_clients": ["android", "ios"]},
            {"use_cookies": False, "player_clients": ["ios", "mweb"]},
        ]

        last_error = None
        for strat in strategies:
            opts = _build_youtube_opts(
                download_opts,
                use_cookies=strat["use_cookies"],
                player_clients=strat["player_clients"],
            )
            try:
                with yt_dlp.YoutubeDL(opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    if info:
                        return info
            except Exception as e:
                last_error = e
                logger.warning(f"YouTube download strategy {strat} failed: {e}")
                continue

        if last_error:
            raise last_error
        raise RuntimeError("Unable to download YouTube video.")

    info = await asyncio.to_thread(_download_with_fallback)

    # Find actual output file
    actual_path = None
    for candidate_ext in ["mp4", "mp3", "webm", "mkv", "m4a", "wav", "flac"]:
        candidate = str(TEMP_DIR / f"{job_id}.{candidate_ext}")
        if os.path.exists(candidate):
            actual_path = candidate
            break

    if not actual_path:
        raise FileNotFoundError(f"Download completed but file not found for job {job_id}")

    file_size = os.path.getsize(actual_path)
    title = (info.get("title") or "youtube-video")[:100]
    safe_title = "".join(c for c in title if c.isalnum() or c in " -_").strip() or "youtube-video"

    return {
        "job_id": job_id,
        "file_path": actual_path,
        "filename": f"{safe_title}.{ext}",
        "file_size": file_size,
        "title": title,
        "thumbnail": info.get("thumbnail"),
        "duration": info.get("duration"),
    }
