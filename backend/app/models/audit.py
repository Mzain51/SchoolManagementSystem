from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    school_id = Column(String(36), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("user_profiles.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)  # e.g., 'FEE_PAYMENT_RECORDED', 'ATTENDANCE_CORRECTED'
    entity_type = Column(String(100), nullable=False)  # e.g., 'FeePayment', 'Attendance'
    entity_id = Column(String(100), nullable=True)
    changes = Column(JSON, nullable=True)  # JSON representation of before/after or payload
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)

    # Relationships
    school = relationship("School", back_populates="audit_logs")
    user = relationship("UserProfile", back_populates="audit_logs")

    def __repr__(self) -> str:
        return f"<AuditLog {self.action} on {self.entity_type}:{self.entity_id}>"
