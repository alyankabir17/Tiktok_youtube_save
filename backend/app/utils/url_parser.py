from typing import Literal

Platform = Literal["tiktok", "youtube"]

def detect_platform(url: str) -> Platform | None:
    candidate = url.strip()

    if "tiktok.com" in candidate:
        return "tiktok"

    if "youtube.com" in candidate or "youtu.be" in candidate:
        return "youtube"

    return None