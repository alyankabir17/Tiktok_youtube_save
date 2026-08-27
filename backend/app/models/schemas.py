import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DownloadInfoRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        v = value.strip()
        # Auto-add https:// if missing
        if not v.startswith("http"):
            v = "https://" + v
        v_lower = v.lower()
        if not ("tiktok.com" in v_lower or "youtube.com" in v_lower or "youtu.be" in v_lower or "vimeo.com" in v_lower or "instagram.com" in v_lower or "instagr.am" in v_lower):
            raise ValueError("Only TikTok, YouTube, Vimeo, and Instagram URLs are supported")
        return v


class FormatOption(BaseModel):
    id: str
    label: str
    format: str
    quality: str


class VideoInfoResponse(BaseModel):
    title: str
    thumbnail: str | None = None
    duration: int | None = None
    platform: str
    formats: list[FormatOption]
    uploader: str | None = None
    view_count: int | None = None  # ✅ Remove the alias entirely

    model_config = ConfigDict(populate_by_name=True)


class DownloadStartRequest(BaseModel):
    url: str
    format: str
    quality: str

    @field_validator("format")
    @classmethod
    def validate_format(cls, value: str) -> str:
        if value not in {"mp4", "mp3"}:
            raise ValueError("Format must be mp4 or mp3")
        return value


class DownloadStartResponse(BaseModel):
    job_id: str = Field(alias="jobId")
    download_url: str = Field(alias="downloadUrl")
    filename: str
    file_size: int | None = Field(default=None, alias="fileSize")
    title: str | None = None
    thumbnail: str | None = None

    model_config = ConfigDict(populate_by_name=True)


class UserRegisterRequest(BaseModel):
    email: str
    password: str
    username: str | None = None


class UserLoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    username: str | None = None


class TokenResponse(BaseModel):
    access_token: str = Field(alias="accessToken")
    token_type: str = Field(default="bearer", alias="tokenType")
    user: UserResponse

    model_config = ConfigDict(populate_by_name=True)


class MeResponse(BaseModel):
    user: UserResponse | None = None


class HistoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    platform: str
    video_title: str | None = Field(default=None, alias="videoTitle")
    thumbnail_url: str | None = Field(default=None, alias="thumbnailUrl")
    format: str
    quality: str | None = None
    file_size: int | None = Field(default=None, alias="fileSize")
    downloaded_at: datetime = Field(alias="downloadedAt")
    original_url: str = Field(alias="originalUrl")


class HistoryListResponse(BaseModel):
    items: list[HistoryItemResponse]
    total: int
    page: int
    page_size: int = Field(alias="pageSize")

    model_config = ConfigDict(populate_by_name=True)


class DownloadStatsResponse(BaseModel):
    total_downloads: int = Field(alias="totalDownloads")
    tiktok_downloads: int = Field(alias="tiktokDownloads")
    youtube_downloads: int = Field(alias="youtubeDownloads")
    instagram_downloads: int = Field(default=0, alias="instagramDownloads")
    downloads_today: int = Field(alias="downloadsToday")

    model_config = ConfigDict(populate_by_name=True)
