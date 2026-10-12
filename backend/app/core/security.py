import jwt
from typing import Optional, List
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.user import UserProfile, SchoolMembership, Role, Permission
from app.models.school import School
from app.schemas.user import UserContext, SchoolRead

security_scheme = HTTPBearer(auto_error=False)


def decode_supabase_token(token: str) -> dict:
    """
    Decodes and validates a Supabase JWT token.
    Supports JWT Secret (HS256) or JWKS verification.
    If dev mode is enabled and a dev token is passed, resolves dev user.
    """
    # 1. Check for development bypass if enabled
    if settings.ENABLE_DEV_AUTH_BYPASS and token.startswith("dev-token-"):
        role_type = token.replace("dev-token-", "")
        return {
            "sub": f"dev-{role_type}-id",
            "email": f"{role_type}@schools.pk",
            "role": "authenticated",
            "user_metadata": {"full_name": f"Demo {role_type.capitalize()}"},
        }

    # 2. Standard Supabase token verification
    try:
        if settings.SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
            return payload
        else:
            # If no secret is configured yet, decode unverified in dev or raise in prod
            if settings.ENVIRONMENT == "production":
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="SUPABASE_JWT_SECRET is not configured on the server.",
                )
            # In development fallback:
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again.",
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
        )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> UserProfile:
    """
    Extracts and authenticates the user from the Supabase Bearer token.
    Ensures user profile exists in database, syncing basic attributes if needed.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header with Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_supabase_token(credentials.credentials)
    user_id = payload.get("sub")
    email = payload.get("email")

    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims: missing subject or email.",
        )

    user = db.query(UserProfile).filter(UserProfile.id == user_id).first()

    if not user:
        # Auto-provision or register user profile on first valid Supabase login
        full_name = payload.get("user_metadata", {}).get("full_name", email.split("@")[0].capitalize())
        user = UserProfile(
            id=user_id,
            email=email,
            full_name=full_name,
            is_active=True,
            is_superadmin=False,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This user account has been deactivated. Contact your school administrator.",
        )

    return user


def get_user_context(
    current_user: UserProfile = Depends(get_current_user),
    x_school_id: Optional[str] = Header(None, alias="X-School-ID"),
    db: Session = Depends(get_db),
) -> UserContext:
    """
    Builds the complete operational security context for the user:
    - Active school ID (from header or primary membership)
    - Active role in that school
    - Permissions granted
    - List of schools the user belongs to
    """
    memberships = (
        db.query(SchoolMembership)
        .filter(SchoolMembership.user_id == current_user.id, SchoolMembership.is_active == True)
        .all()
    )

    available_schools = []
    active_membership = None

    for m in memberships:
        school_model = db.query(School).filter(School.id == m.school_id, School.is_active == True).first()
        if school_model:
            available_schools.append(SchoolRead.model_validate(school_model))
            if x_school_id and m.school_id == x_school_id:
                active_membership = m

    # If no specific X-School-ID was requested, use the first available school
    if not active_membership and memberships:
        active_membership = memberships[0]

    permissions_list: List[str] = []
    active_role_name: Optional[str] = None
    active_school_id: Optional[str] = None

    if active_membership:
        active_school_id = active_membership.school_id
        role = db.query(Role).filter(Role.id == active_membership.role_id).first()
        if role:
            active_role_name = role.name
            permissions_list = [p.code for p in role.permissions]

    # Superadmin bypass gets all roles/permissions conceptually
    if current_user.is_superadmin:
        active_role_name = "admin"

    return UserContext(
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        is_superadmin=current_user.is_superadmin,
        active_school_id=active_school_id,
        active_role=active_role_name,
        permissions=permissions_list,
        available_schools=available_schools,
    )


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, context: UserContext = Depends(get_user_context)) -> UserContext:
        if context.is_superadmin:
            return context

        if not context.active_role or context.active_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(self.allowed_roles)}. Your active role: {context.active_role or 'None'}.",
            )
        return context


class PermissionChecker:
    def __init__(self, required_permission: str):
        self.required_permission = required_permission

    def __call__(self, context: UserContext = Depends(get_user_context)) -> UserContext:
        if context.is_superadmin:
            return context

        if self.required_permission not in context.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Missing permission: '{self.required_permission}'.",
            )
        return context


def require_roles(roles: List[str]):
    return Depends(RoleChecker(roles))


def require_permission(perm: str):
    return Depends(PermissionChecker(perm))
