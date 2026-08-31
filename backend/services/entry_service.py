import math
from time import time
from typing import Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.entry import EntryDocument, EntryStatus
from schemas.entry import EntryCreate, EntryUpdate, EntryResponse, PaginatedEntries


def _doc_to_response(doc: dict) -> EntryResponse:
    doc["id"] = str(doc.pop("_id"))
    return EntryResponse(**doc)


async def create_entry(
    db: AsyncIOMotorDatabase,
    data: EntryCreate,
    created_by: str,
) -> EntryResponse:
    now = int(time() * 1000)
    doc = data.model_dump()
    doc.update(
        created_by=created_by,
        last_modified_by=created_by,
        created_at=now,
        updated_at=now,
        status=EntryStatus.DRAFT,
        version=1,
    )
    result = await db["entries"].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_response(doc)


async def get_entry(db: AsyncIOMotorDatabase, entry_id: str) -> Optional[EntryResponse]:
    try:
        doc = await db["entries"].find_one({"_id": ObjectId(entry_id)})
    except Exception:
        return None
    if not doc:
        return None
    return _doc_to_response(doc)


async def list_entries(
    db: AsyncIOMotorDatabase,
    discipline: Optional[str] = None,
    level: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    viewer_role: Optional[str] = None,
) -> PaginatedEntries:
    query: dict = {}

    # Role-based visibility
    if viewer_role in ("student", "guest"):
        query["status"] = EntryStatus.ACTIVE
    elif status:
        query["status"] = status

    if discipline:
        query["discipline"] = discipline
    if level:
        query["level"] = level
    if search:
        query["$text"] = {"$search": search}

    total = await db["entries"].count_documents(query)
    skip = (page - 1) * limit
    cursor = db["entries"].find(query).skip(skip).limit(limit).sort("created_at", -1)
    docs = await cursor.to_list(length=limit)

    return PaginatedEntries(
        items=[_doc_to_response(d) for d in docs],
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total else 1,
    )


async def update_entry(
    db: AsyncIOMotorDatabase,
    entry_id: str,
    data: EntryUpdate,
    modified_by: str,
) -> Optional[EntryResponse]:
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        return await get_entry(db, entry_id)

    now = int(time() * 1000)
    updates["updated_at"] = now
    updates["last_modified_by"] = modified_by
    updates["$inc"] = {"version": 1}

    # Pop $inc from the $set dict
    inc = updates.pop("$inc")
    try:
        await db["entries"].update_one(
            {"_id": ObjectId(entry_id)},
            {"$set": updates, "$inc": inc},
        )
    except Exception:
        return None
    return await get_entry(db, entry_id)


async def update_entry_status(
    db: AsyncIOMotorDatabase,
    entry_id: str,
    new_status: EntryStatus,
    modified_by: str,
) -> Optional[EntryResponse]:
    now = int(time() * 1000)
    try:
        await db["entries"].update_one(
            {"_id": ObjectId(entry_id)},
            {
                "$set": {
                    "status": new_status,
                    "updated_at": now,
                    "last_modified_by": modified_by,
                },
                "$inc": {"version": 1},
            },
        )
    except Exception:
        return None
    return await get_entry(db, entry_id)


async def soft_delete_entry(
    db: AsyncIOMotorDatabase,
    entry_id: str,
    modified_by: str,
) -> bool:
    """Marks the entry as DELETED instead of removing it."""
    result = await update_entry_status(db, entry_id, EntryStatus.DELETED, modified_by)
    return result is not None
