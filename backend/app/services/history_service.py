import uuid
from datetime import UTC, datetime

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.download_history import DownloadHistory


async def create_history_entry(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    platform: str,
    original_url: str,
    video_title: str | None,
    thumbnail_url: str | None,
    duration: int | None,
    file_format: str,
    quality: str | None,
    file_size: int | None,
    ip_address: str | None,
    status: str = "completed",
) -> DownloadHistory:
    item = DownloadHistory(
        user_id=user_id,
        platform=platform,
        original_url=original_url,
        video_title=video_title,
        thumbnail_url=thumbnail_url,
        duration=duration,
        format=file_format,
        quality=quality,
        file_size=file_size,
        ip_address=ip_address,
        status=status,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def list_history_for_user(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    page: int,
    page_size: int,
) -> list[DownloadHistory]:
    offset = (page - 1) * page_size
    query = (
        select(DownloadHistory)
        .where(DownloadHistory.user_id == user_id)
        .order_by(DownloadHistory.downloaded_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def count_history_for_user(db: AsyncSession, *, user_id: uuid.UUID) -> int:
    query = select(func.count(DownloadHistory.id)).where(DownloadHistory.user_id == user_id)
    result = await db.execute(query)
    return int(result.scalar() or 0)


async def delete_history_item_for_user(db: AsyncSession, *, user_id: uuid.UUID, item_id: uuid.UUID) -> bool:
    query = delete(DownloadHistory).where(
        DownloadHistory.id == item_id,
        DownloadHistory.user_id == user_id,
    )
    result = await db.execute(query)
    await db.commit()
    return bool(result.rowcount and result.rowcount > 0)


async def get_download_stats(db: AsyncSession) -> dict[str, int]:
    today_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)

    total_query = select(func.count(DownloadHistory.id))
    tiktok_query = select(func.count(DownloadHistory.id)).where(DownloadHistory.platform == "tiktok")
    youtube_query = select(func.count(DownloadHistory.id)).where(DownloadHistory.platform == "youtube")
    instagram_query = select(func.count(DownloadHistory.id)).where(DownloadHistory.platform == "instagram")
    today_query = select(func.count(DownloadHistory.id)).where(DownloadHistory.downloaded_at >= today_start)

    total = int((await db.execute(total_query)).scalar() or 0)
    tiktok = int((await db.execute(tiktok_query)).scalar() or 0)
    youtube = int((await db.execute(youtube_query)).scalar() or 0)
    instagram = int((await db.execute(instagram_query)).scalar() or 0)
    today = int((await db.execute(today_query)).scalar() or 0)

    return {
        "totalDownloads": total,
        "tiktokDownloads": tiktok,
        "youtubeDownloads": youtube,
        "instagramDownloads": instagram,
        "downloadsToday": today,
    }
