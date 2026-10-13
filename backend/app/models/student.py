from sqlalchemy import Column, Date, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class Student(Base, TimestampMixin):
    __tablename__ = "students"
    __table_args__ = (UniqueConstraint("school_id", "admission_number", name="uq_student_school_admission"),)

    id = Column(String(36), primary_key=True, default=generate_uuid)
    school_id = Column(String(36), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    academic_year_id = Column(String(36), ForeignKey("academic_years.id", ondelete="RESTRICT"), nullable=False, index=True)
    class_id = Column(String(36), ForeignKey("academic_classes.id", ondelete="RESTRICT"), nullable=False, index=True)
    section_id = Column(String(36), ForeignKey("sections.id", ondelete="RESTRICT"), nullable=False, index=True)
    admission_number = Column(String(50), nullable=False, index=True)
    full_name = Column(String(200), nullable=False, index=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(30), nullable=True)
    admission_date = Column(Date, nullable=False)
    guardian_name = Column(String(200), nullable=False)
    guardian_relationship = Column(String(50), nullable=True)
    guardian_phone = Column(String(30), nullable=False, index=True)
    address = Column(Text, nullable=True)
    previous_school = Column(String(200), nullable=True)
    emergency_contact = Column(String(30), nullable=True)
    status = Column(String(20), nullable=False, default="active", index=True)

    school_class = relationship("SchoolClass", back_populates="students")
    section = relationship("Section", back_populates="students")

    @property
    def class_name(self):
        return self.school_class.name if self.school_class else ""

    @property
    def section_name(self):
        return self.section.name if self.section else ""
