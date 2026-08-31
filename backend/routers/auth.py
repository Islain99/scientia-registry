from time import time
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from database import get_db
from models.user import UserDocument, UserRole
from schemas.user import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserPublic
from services.auth_service import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_refresh_token,
)
from middleware.auth import get_current_user

router = APIRouter()


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    existing = await db["users"].find_one({"email": body.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un compte existe déjà avec cet email.",
        )

    now = int(time() * 1000)
    doc = {
        "name": body.name,
        "email": body.email,
        "hashed_password": hash_password(body.password),
        "role": UserRole.STUDENT,
        "favorites": [],
        "progress": {},
        "created_at": now,
        "updated_at": now,
        "is_active": True,
    }
    result = await db["users"].insert_one(doc)
    return UserPublic(
        id=str(result.inserted_id),
        name=body.name,
        email=body.email,
        role=UserRole.STUDENT,
        created_at=now,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await db["users"].find_one({"email": body.email})
    if not doc or not verify_password(body.password, doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
        )
    if not doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte est désactivé.",
        )
    user_id = str(doc["_id"])
    role = doc.get("role", UserRole.STUDENT)
    return TokenResponse(
        access_token=create_access_token(user_id, role),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    user_id = decode_refresh_token(body.refresh_token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalide ou expiré.",
        )
    try:
        doc = await db["users"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        doc = None

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur introuvable.")

    role = doc.get("role", UserRole.STUDENT)
    return TokenResponse(
        access_token=create_access_token(user_id, role),
        refresh_token=create_refresh_token(user_id),
    )


@router.get("/me", response_model=UserPublic)
async def me(current_user: UserDocument = Depends(get_current_user)):
    return UserPublic(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        favorites=current_user.favorites,
        created_at=current_user.created_at,
    )
