import yt_dlp
import asyncio
import os
import uuid
from pathlib import Path
from app.config import settings

TEMP_DIR = Path(settings.TEMP_DIR)
TEMP_DIR.mkdir(exist_ok=True, parents=True)


async def get_youtube_info(url: str) -> dict:
    opts = {
        "quiet": False,
        "no_warnings": False,
        "skip_download": True,
        "socket_timeout": 30,
    }
    
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
        opts = {
            "outtmpl": output_template,
            "format": "bestaudio/best",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": bitrate,
            }],
            "quiet": True,
            "no_warnings": True,
        }
    else:
        # ✅ FIX: Use simpler format selection that works on all videos
        opts = {
            "outtmpl": output_template,
            "format": "best[ext=mp4]/best",  # Simplified — just get best mp4 available
            "merge_output_format": "mp4",
            "quiet": True,
            "no_warnings": True,
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