from time import time
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from database import get_db
from middleware.auth import get_current_user, require_role, require_permission
from models.user import UserDocument, UserRole, Permission
from schemas.user import UserPublic, UserUpdateRole, ProgressUpdate, ProgressResponse

router = APIRouter()


# ── Admin: user list & role management ───────────────────────────────────────

@router.get("", response_model=list[UserPublic])
async def list_users(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _: UserDocument = Depends(require_permission(Permission.USER_MANAGE)),
):
    docs = await db["users"].find({}, {"hashed_password": 0}).to_list(length=500)
    return [
        UserPublic(
            id=str(d["_id"]),
            name=d["name"],
            email=d["email"],
            role=d.get("role", UserRole.STUDENT),
            favorites=d.get("favorites", []),
            created_at=d.get("created_at", 0),
        )
        for d in docs
    ]


@router.patch("/{user_id}/role", response_model=UserPublic)
async def update_user_role(
    user_id: str,
    body: UserUpdateRole,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserDocument = Depends(require_permission(Permission.USER_MANAGE)),
):
    try:
        result = await db["users"].find_one_and_update(
            {"_id": ObjectId(user_id)},
            {"$set": {"role": body.role, "updated_at": int(time() * 1000)}},
            return_document=True,
            projection={"hashed_password": 0},
        )
    except Exception:
        result = None

    if not result:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

    return UserPublic(
        id=str(result["_id"]),
        name=result["name"],
        email=result["email"],
        role=result["role"],
        favorites=result.get("favorites", []),
        created_at=result.get("created_at", 0),
    )


# ── Self: favorites & progress ────────────────────────────────────────────────

@router.get("/me/favorites", response_model=list[str])
async def get_my_favorites(current_user: UserDocument = Depends(get_current_user)):
    return current_user.favorites


@router.post("/me/favorites/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def add_favorite(
    entry_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserDocument = Depends(get_current_user),
):
    await db["users"].update_one(
        {"_id": ObjectId(current_user.id)},
        {"$addToSet": {"favorites": entry_id}},
    )


@router.delete("/me/favorites/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    entry_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserDocument = Depends(get_current_user),
):
    await db["users"].update_one(
        {"_id": ObjectId(current_user.id)},
        {"$pull": {"favorites": entry_id}},
    )


@router.get("/me/progress", response_model=dict)
async def get_my_progress(current_user: UserDocument = Depends(get_current_user)):
    return {k: v.model_dump() for k, v in current_user.progress.items()}


@router.put("/me/progress/{entry_id}", response_model=ProgressResponse)
async def update_my_progress(
    entry_id: str,
    body: ProgressUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: UserDocument = Depends(get_current_user),
):
    now = int(time() * 1000)
    progress_data = {"status": body.status, "last_updated": now}
    await db["users"].update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {f"progress.{entry_id}": progress_data}},
    )
    return ProgressResponse(entry_id=entry_id, status=body.status, last_updated=now)
