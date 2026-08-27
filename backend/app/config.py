import json
from pathlib import Path
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "VideoSave API"
    APP_VERSION: str = "1.0.0"

    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/videosave"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    ALLOWED_ORIGINS: list[str] | str | Any = Field(default_factory=lambda: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://*.vercel.app",
    ])

    TEMP_DIR: str = "/tmp/downloads"
    CLEANUP_DELAY_SECONDS: int = 3600
    MAX_DOWNLOAD_SIZE_MB: int = 500
    ANON_RATE_LIMIT_PER_HOUR: int = 30
    AUTH_RATE_LIMIT_PER_HOUR: int = 120

    TIKTOK_COOKIE_FILE: str | None = None
    YOUTUBE_COOKIE_FILE: str | None = None
    YOUTUBE_COOKIES: str | None = None
    YOUTUBE_PO_TOKEN: str | None = None
    INSTAGRAM_COOKIE_FILE: str | None = None
    INSTAGRAM_COOKIES: str | None = None
    VIMEO_COOKIE_FILE: str | None = None

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def _parse_allowed_origins(cls, value: Any) -> list[str]:
        if isinstance(value, list):
            return [str(v).strip() for v in value if str(v).strip()]
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return ["http://localhost:3000"]
            if stripped.startswith("["):
                try:
                    parsed = json.loads(stripped)
                    if isinstance(parsed, list):
                        return [str(v).strip() for v in parsed if str(v).strip()]
                except Exception:
                    pass
            return [v.strip() for v in stripped.split(",") if v.strip()]
        return ["http://localhost:3000"]

    @property
    def temp_path(self) -> Path:
        return Path(self.TEMP_DIR)


settings = Settings()
