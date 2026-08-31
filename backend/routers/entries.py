from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_db
from middleware.auth import get_current_user, require_permission
from models.user import UserDocument, Permission
from models.entry import EntryStatus
from schemas.entry import EntryCreate, EntryUpdate, EntryStatusUpdate, EntryResponse, PaginatedEntries
from services import entry_service
from utils.rbac import can, is_at_least_teacher

router = APIRouter()


@router.get("", response_model=PaginatedEntries)
async def list_entries(
    discipline: Optional[str] = Query(default=None),
    level: Optional[str] = Query(default=None),
    entry_status: Optional[str] = Query(default=None, alias="status"),
    search: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserDocument = Depends(get_current_user),
):
    return await entry_service.list_entries(
        db=db,
        discipline=discipline,
        level=level,
        status=entry_status,
        search=search,
        page=page,
        limit=limit,
        viewer_role=current_user.role.value,
    )


@router.get("/{entry_id}", response_model=EntryResponse)
async def get_entry(
    entry_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserDocument = Depends(get_current_user),
):
    entry = await entry_service.get_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Concept introuvable.")

    # Students / Guests can only see ACTIVE entries
    if current_user.role.value in ("student", "guest") and entry.status != EntryStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="Accès non autorisé à ce concept.")

    return entry


@router.post("", response_model=EntryResponse, status_code=status.HTTP_201_CREATED)
async def create_entry(
    body: EntryCreate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserDocument = Depends(require_permission(Permission.CONTENT_CREATE)),
):
    return await entry_service.create_entry(db, body, created_by=current_user.id)


@router.put("/{entry_id}", response_model=EntryResponse)
async def update_entry(
    entry_id: str,
    body: EntryUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserDocument = Depends(require_permission(Permission.CONTENT_UPDATE)),
):
    existing = await entry_service.get_entry(db, entry_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Concept introuvable.")

    # Teachers can only edit their own entries; admins can edit any
    if not can(current_user, Permission.CONTENT_DELETE):  # only admins have CONTENT_DELETE
        if existing.created_by != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Vous ne pouvez modifier que vos propres concepts.",
            )

    updated = await entry_service.update_entry(db, entry_id, body, current_user.id)
    if not updated:
        raise HTTPException(status_code=500, detail="Échec de la mise à jour.")
    return updated


@router.patch("/{entry_id}/status", response_model=EntryResponse)
async def update_status(
    entry_id: str,
    body: EntryStatusUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserDocument = Depends(require_permission(Permission.CONTENT_DELETE)),
):
    """Admin-only: change lifecycle status (activate, archive, etc.)."""
    entry = await entry_service.get_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Concept introuvable.")

    updated = await entry_service.update_entry_status(db, entry_id, body.status, current_user.id)
    if not updated:
        raise HTTPException(status_code=500, detail="Échec de la mise à jour du statut.")
    return updated


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserDocument = Depends(require_permission(Permission.CONTENT_DELETE)),
):
    """Soft-delete: marks status as DELETED, never removes from database."""
    success = await entry_service.soft_delete_entry(db, entry_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Concept introuvable.")
