from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from database import get_db
from services.auth_service import decode_access_token
from models.user import UserDocument, UserRole, Permission, ROLE_PERMISSIONS

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> UserDocument:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expiré.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if not user_id:
        raise credentials_exception

    try:
        doc = await db["users"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise credentials_exception

    if not doc:
        raise credentials_exception

    doc["_id"] = str(doc["_id"])
    user = UserDocument(**doc)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte est désactivé.",
        )
    return user


def require_permission(permission: Permission):
    """Dependency factory — raises 403 if the current user lacks the permission."""
    async def _check(current_user: UserDocument = Depends(get_current_user)):
        allowed = ROLE_PERMISSIONS.get(current_user.role, [])
        if permission not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission requise : {permission.value}",
            )
        return current_user
    return _check


def require_role(*roles: UserRole):
    """Dependency factory — raises 403 if the current user's role isn't in the list."""
    async def _check(current_user: UserDocument = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Rôle insuffisant pour cette opération.",
            )
        return current_user
    return _check
