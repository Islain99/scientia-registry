from models.user import UserDocument, UserRole, Permission, ROLE_PERMISSIONS


def can(user: UserDocument, permission: Permission) -> bool:
    """Return True if the user has the given permission."""
    return permission in ROLE_PERMISSIONS.get(user.role, [])


def is_admin(user: UserDocument) -> bool:
    return user.role == UserRole.ADMIN


def is_at_least_teacher(user: UserDocument) -> bool:
    return user.role in (UserRole.ADMIN, UserRole.TEACHER)
