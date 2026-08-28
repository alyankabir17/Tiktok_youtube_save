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
    clients = player_clients or ["android_creator", "android", "ios"]
    
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
        proxy_str = proxy.strip()
        # Auto-correct Webshare rotating username if user forgot "-rotate"
        if "p.webshare.io" in proxy_str and "-rotate" not in proxy_str and "@" in proxy_str:
            parts = proxy_str.split("@", 1)
            creds = parts[0]
            if ":" in creds:
                scheme_user, pwd = creds.rsplit(":", 1)
                proxy_str = f"{scheme_user}-rotate:{pwd}@{parts[1]}"
        opts["proxy"] = proxy_str

    if extra_opts:
        opts.update(extra_opts)

    return opts


def _extract_quality_options(info: dict) -> list[dict]:
    available_heights = set()
    for fmt in info.get("formats", []):
        h = fmt.get("height")
        if h and isinstance(h, int):
            available_heights.add(h)

    # Standard quality resolutions to offer for every YouTube video
    standard = [1080, 720, 480, 360]
    high_res = [h for h in [4320, 2160, 1440] if h in available_heights]
    all_heights = high_res + standard

    seen = set()
    ordered_heights = []
    for h in all_heights:
        if h not in seen:
            seen.add(h)
            ordered_heights.append(h)

    label_map = {
        4320: "8K Ultra HD",
        2160: "4K Ultra HD",
        1440: "2K Quad HD (1440p)",
        1080: "1080p Full HD",
        720: "720p HD",
        480: "480p SD",
        360: "360p Standard",
    }

    quality_options = []
    for h in ordered_heights:
        lbl = label_map.get(h, f"{h}p")
        quality_options.append({
            "id": f"mp4_{h}p",
            "label": f"MP4 {lbl}",
            "format": "mp4",
            "quality": f"{h}p",
        })

    # Audio formats
    quality_options += [
        {"id": "mp3_320", "label": "MP3 Audio (320kbps High Quality)", "format": "mp3", "quality": "320"},
        {"id": "mp3_192", "label": "MP3 Audio (192kbps Standard)", "format": "mp3", "quality": "192"},
        {"id": "m4a_best", "label": "M4A AAC Audio", "format": "mp3", "quality": "m4a"},
        {"id": "wav_best", "label": "WAV Lossless Audio", "format": "mp3", "quality": "wav"},
        {"id": "flac_best", "label": "FLAC Lossless Audio", "format": "mp3", "quality": "flac"},
    ]
    return quality_options


async def get_youtube_info(url: str) -> dict:
    def _extract_with_fallback():
        strategies = [
            # 1. Primary mobile clients (bypasses datacenter bot detection)
            {"use_cookies": False, "player_clients": ["android_creator", "android", "ios"]},
            # 2. Android creator alone
            {"use_cookies": False, "player_clients": ["android_creator"]},
            # 3. Android alone
            {"use_cookies": False, "player_clients": ["android"]},
            # 4. Web Safari & iOS fallback
            {"use_cookies": False, "player_clients": ["web_safari", "ios"]},
            # 5. Cookies (if provided)
            {"use_cookies": True, "player_clients": ["android_creator", "android", "ios"]},
            # 6. iOS / mweb fallback
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

    audio_targets = ["mp3", "m4a", "wav", "flac", "aac", "opus", "ogg"]
    if fmt_lower == "mp3" or fmt_lower in audio_targets or quality.lower() in audio_targets:
        codec = quality.lower() if quality.lower() in audio_targets else "mp3"
        bitrate = quality if quality.isdigit() else "320"
        ext = codec
        download_opts = {
            "outtmpl": output_template,
            "format": "bestaudio/best",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": codec,
                "preferredquality": bitrate,
            }],
        }
    else:
        ext = "mp4"
        if quality and quality.endswith("p") and quality[:-1].isdigit():
            target_height = int(quality[:-1])
            format_spec = (
                f"bestvideo[height<={target_height}]+bestaudio/"
                f"bestvideo[height<={target_height}][ext=mp4]+bestaudio/"
                f"best[height<={target_height}]/"
                f"bestvideo+bestaudio/"
                f"best"
            )
        else:
            format_spec = "bestvideo+bestaudio/best"

        download_opts = {
            "outtmpl": output_template,
            "format": format_spec,
            "merge_output_format": ext,
        }

    def _download_with_fallback():
        strategies = [
            {"use_cookies": False, "player_clients": ["android_creator", "android", "ios"]},
            {"use_cookies": False, "player_clients": ["android_creator"]},
            {"use_cookies": False, "player_clients": ["android"]},
            {"use_cookies": False, "player_clients": ["web_safari", "ios"]},
            {"use_cookies": True, "player_clients": ["android_creator", "android", "ios"]},
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
