from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from app.schemas.school import SchoolRead


class PermissionRead(BaseModel):
    id: str
    code: str
    name: str
    module: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RoleRead(BaseModel):
    id: str
    name: str
    display_name: str
    description: Optional[str] = None
    is_system: bool
    permissions: List[PermissionRead] = []

    model_config = ConfigDict(from_attributes=True)


class SchoolMembershipRead(BaseModel):
    id: str
    school_id: str
    school: SchoolRead
    role: RoleRead
    is_active: bool
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileRead(BaseModel):
    id: str
    email: str
    full_name: str
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_superadmin: bool
    memberships: List[SchoolMembershipRead] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfileCreate(BaseModel):
    id: str  # Supabase Auth sub
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    is_superadmin: bool = False


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None


class UserContext(BaseModel):
    """The active authenticated user context with their active school role and permissions."""
    user_id: str
    email: str
    full_name: str
    is_superadmin: bool
    active_school_id: Optional[str] = None
    active_role: Optional[str] = None
    permissions: List[str] = []
    available_schools: List[SchoolRead] = []
