from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId


class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"
    GUEST = "guest"


class Permission(str, Enum):
    CONTENT_READ = "content:read"
    CONTENT_CREATE = "content:create"
    CONTENT_UPDATE = "content:update"
    CONTENT_DELETE = "content:delete"
    USER_MANAGE = "user:manage"
    SYSTEM_AUDIT = "system:audit"
    AI_ADVANCED = "ai:advanced"


ROLE_PERMISSIONS: Dict[UserRole, List[Permission]] = {
    UserRole.ADMIN: list(Permission),
    UserRole.TEACHER: [
        Permission.CONTENT_READ,
        Permission.CONTENT_CREATE,
        Permission.CONTENT_UPDATE,
        Permission.AI_ADVANCED,
    ],
    UserRole.STUDENT: [Permission.CONTENT_READ],
    UserRole.GUEST: [Permission.CONTENT_READ],
}


class ProgressStatus(int, Enum):
    NOT_STARTED = 0
    IN_PROGRESS = 1
    UNDERSTOOD = 2


class UserProgressEntry(BaseModel):
    status: ProgressStatus = ProgressStatus.NOT_STARTED
    last_updated: int  # Unix ms


class UserDocument(BaseModel):
    """Represents a user document stored in MongoDB."""
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    email: EmailStr
    hashed_password: str
    role: UserRole = UserRole.STUDENT
    favorites: List[str] = Field(default_factory=list)          # entry IDs
    progress: Dict[str, UserProgressEntry] = Field(default_factory=dict)
    created_at: int = 0   # Unix ms
    updated_at: int = 0   # Unix ms
    is_active: bool = True

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
