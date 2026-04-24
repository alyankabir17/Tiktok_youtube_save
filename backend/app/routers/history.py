import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.schemas import HistoryItemResponse, HistoryListResponse
from app.models.user import User
from app.services.history_service import count_history_for_user, delete_history_item_for_user, list_history_for_user
from app.utils.dependencies import get_current_user


router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=HistoryListResponse)
async def list_history(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="pageSize"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> HistoryListResponse:
    items = await list_history_for_user(db, user_id=user.id, page=page, page_size=page_size)
    total = await count_history_for_user(db, user_id=user.id)

    response_items = [HistoryItemResponse.model_validate(item, from_attributes=True) for item in items]
    return HistoryListResponse(items=response_items, total=total, page=page, page_size=page_size)


@router.delete("/{item_id}")
async def delete_history_item(
    item_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    deleted = await delete_history_item_for_user(db, user_id=user.id, item_id=item_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="History item not found")
    return {"success": True}
