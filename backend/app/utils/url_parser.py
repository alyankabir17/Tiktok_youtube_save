from typing import Literal

Platform = Literal["tiktok", "youtube", "vimeo"]

def detect_platform(url: str) -> Platform | None:
    candidate = url.strip()

    if "tiktok.com" in candidate:
        return "tiktok"

    if "youtube.com" in candidate or "youtu.be" in candidate:
        return "youtube"

    if "vimeo.com" in candidate:
        return "vimeo"

    return None