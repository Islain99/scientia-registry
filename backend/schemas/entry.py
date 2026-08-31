from typing import List, Optional
from pydantic import BaseModel, Field
from models.entry import Discipline, LearningLevel, ContentType, EntryStatus, EntryOrigin, Exercise


# ── Create / Update ───────────────────────────────────────────────────────────

class EntryCreate(BaseModel):
    title: str = Field(min_length=3, max_length=300)
    discipline: Discipline
    sub_discipline: Optional[str] = None
    level: LearningLevel
    type: ContentType
    definition: str = Field(min_length=10)
    statement: str
    context: str = ""
    examples: List[str] = []
    exercises: List[Exercise] = []
    keywords: List[str] = []
    references: List[str] = []
    related_ids: List[str] = []
    origin: EntryOrigin = EntryOrigin.MANUAL


class EntryUpdate(BaseModel):
    """All fields optional — partial updates."""
    title: Optional[str] = Field(default=None, min_length=3, max_length=300)
    discipline: Optional[Discipline] = None
    sub_discipline: Optional[str] = None
    level: Optional[LearningLevel] = None
    type: Optional[ContentType] = None
    definition: Optional[str] = Field(default=None, min_length=10)
    statement: Optional[str] = None
    context: Optional[str] = None
    examples: Optional[List[str]] = None
    exercises: Optional[List[Exercise]] = None
    keywords: Optional[List[str]] = None
    references: Optional[List[str]] = None
    related_ids: Optional[List[str]] = None


class EntryStatusUpdate(BaseModel):
    status: EntryStatus


# ── Response ──────────────────────────────────────────────────────────────────

class EntryResponse(BaseModel):
    id: str
    title: str
    discipline: Discipline
    sub_discipline: Optional[str] = None
    level: LearningLevel
    type: ContentType
    definition: str
    statement: str
    context: str
    examples: List[str]
    exercises: List[Exercise]
    keywords: List[str]
    references: List[str]
    related_ids: List[str]
    last_modified_by: Optional[str] = None
    created_by: Optional[str] = None
    created_at: int
    updated_at: int
    status: EntryStatus
    origin: EntryOrigin
    version: int


# ── Filters ───────────────────────────────────────────────────────────────────

class EntryFilters(BaseModel):
    discipline: Optional[Discipline] = None
    level: Optional[LearningLevel] = None
    status: Optional[EntryStatus] = None
    search: Optional[str] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)


class PaginatedEntries(BaseModel):
    items: List[EntryResponse]
    total: int
    page: int
    limit: int
    pages: int
