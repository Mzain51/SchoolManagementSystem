from sqlalchemy import Column, String, Boolean, ForeignKey, Table, UniqueConstraint, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


# Association table for Role <-> Permission
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", String(36), ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", String(36), ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class UserProfile(Base, TimestampMixin):
    """User profile record mapped to Supabase Auth user ID (sub)."""
    __tablename__ = "user_profiles"

    id = Column(String(64), primary_key=True)  # Supabase Auth UUID (sub)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(50), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superadmin = Column(Boolean, default=False, nullable=False)

    # Memberships across schools
    memberships = relationship("SchoolMembership", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

    def __repr__(self) -> str:
        return f"<UserProfile {self.email} ({self.full_name})>"


class Role(Base, TimestampMixin):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(50), unique=True, nullable=False, index=True)  # 'admin', 'teacher', 'accountant', 'staff'
    display_name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    is_system = Column(Boolean, default=True, nullable=False)

    # Relationships
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")
    memberships = relationship("SchoolMembership", back_populates="role")

    def __repr__(self) -> str:
        return f"<Role {self.name}>"


class Permission(Base, TimestampMixin):
    __tablename__ = "permissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(100), unique=True, nullable=False, index=True)  # e.g., 'students:view', 'fees:collect'
    name = Column(String(100), nullable=False)
    module = Column(String(50), nullable=False)  # 'academics', 'finance', 'attendance', 'admin'
    description = Column(String(255), nullable=True)

    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")

    def __repr__(self) -> str:
        return f"<Permission {self.code}>"


class SchoolMembership(Base, TimestampMixin):
    """Associates a user with a specific school and role."""
    __tablename__ = "school_memberships"
    __table_args__ = (
        UniqueConstraint("user_id", "school_id", name="uq_user_school_membership"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    school_id = Column(String(36), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(String(36), ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("UserProfile", back_populates="memberships")
    school = relationship("School", back_populates="memberships")
    role = relationship("Role", back_populates="memberships")

    def __repr__(self) -> str:
        return f"<SchoolMembership User:{self.user_id} School:{self.school_id} Role:{self.role_id}>"
