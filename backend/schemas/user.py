from typing import Dict, List, Optional
from pydantic import BaseModel, EmailStr, Field
from models.user import UserRole, ProgressStatus, UserProgressEntry


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ── User ──────────────────────────────────────────────────────────────────────

class UserPublic(BaseModel):
    """Safe user representation returned to the client."""
    id: str
    name: str
    email: EmailStr
    role: UserRole
    favorites: List[str] = []
    created_at: int


class UserUpdateRole(BaseModel):
    role: UserRole


# ── Progress ──────────────────────────────────────────────────────────────────

class ProgressUpdate(BaseModel):
    status: ProgressStatus


class ProgressResponse(BaseModel):
    entry_id: str
    status: ProgressStatus
    last_updated: int
