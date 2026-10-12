from sqlalchemy import Column, String, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class School(Base, TimestampMixin):
    __tablename__ = "schools"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, index=True)
    code = Column(String(50), nullable=False, unique=True, index=True)  # e.g., "DPS-LHR-01"
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True, default="Lahore")
    province = Column(String(100), nullable=True, default="Punjab")
    contact_phone = Column(String(50), nullable=True)
    contact_email = Column(String(255), nullable=True)
    logo_url = Column(String(500), nullable=True)
    
    # Financial & Localization
    currency = Column(String(10), nullable=False, default="PKR")
    timezone = Column(String(50), nullable=False, default="Asia/Karachi")
    is_active = Column(Boolean, nullable=False, default=True)

    # Relationships
    memberships = relationship("SchoolMembership", back_populates="school", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="school", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<School {self.name} ({self.code})>"
