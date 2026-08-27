from typing import Literal

Platform = Literal["tiktok", "youtube", "vimeo", "instagram"]

def detect_platform(url: str) -> Platform | None:
    candidate = url.strip().lower()

    if "tiktok.com" in candidate:
        return "tiktok"

    if "youtube.com" in candidate or "youtu.be" in candidate:
        return "youtube"

    if "vimeo.com" in candidate:
        return "vimeo"

    if "instagram.com" in candidate or "instagr.am" in candidate:
        return "instagram"

    return None