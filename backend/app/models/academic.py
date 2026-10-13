from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin, generate_uuid


class AcademicYear(Base, TimestampMixin):
    __tablename__ = "academic_years"
    __table_args__ = (UniqueConstraint("school_id", "name", name="uq_academic_year_school_name"),)

    id = Column(String(36), primary_key=True, default=generate_uuid)
    school_id = Column(String(36), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_active = Column(Boolean, nullable=False, default=False)

    classes = relationship("SchoolClass", back_populates="academic_year", cascade="all, delete-orphan")


class SchoolClass(Base, TimestampMixin):
    __tablename__ = "academic_classes"
    __table_args__ = (UniqueConstraint("school_id", "academic_year_id", "name", name="uq_class_year_name"),)

    id = Column(String(36), primary_key=True, default=generate_uuid)
    school_id = Column(String(36), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    academic_year_id = Column(String(36), ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)

    academic_year = relationship("AcademicYear", back_populates="classes")
    sections = relationship("Section", back_populates="school_class", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="school_class")


class Section(Base, TimestampMixin):
    __tablename__ = "sections"
    __table_args__ = (UniqueConstraint("class_id", "name", name="uq_section_class_name"),)

    id = Column(String(36), primary_key=True, default=generate_uuid)
    school_id = Column(String(36), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    class_id = Column(String(36), ForeignKey("academic_classes.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(50), nullable=False)
    capacity = Column(Integer, nullable=True)

    school_class = relationship("SchoolClass", back_populates="sections")
    students = relationship("Student", back_populates="section")


class Subject(Base, TimestampMixin):
    __tablename__ = "subjects"
    __table_args__ = (UniqueConstraint("school_id", "academic_year_id", "code", name="uq_subject_year_code"),)

    id = Column(String(36), primary_key=True, default=generate_uuid)
    school_id = Column(String(36), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    academic_year_id = Column(String(36), ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    code = Column(String(30), nullable=False)


class TeacherClassAssignment(Base, TimestampMixin):
    __tablename__ = "teacher_class_assignments"
    __table_args__ = (
        UniqueConstraint("user_id", "academic_year_id", "class_id", "section_id", name="uq_teacher_class_assignment"),
    )

    id = Column(String(36), primary_key=True, default=generate_uuid)
    school_id = Column(String(36), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(64), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    academic_year_id = Column(String(36), ForeignKey("academic_years.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(String(36), ForeignKey("academic_classes.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(String(36), ForeignKey("sections.id", ondelete="CASCADE"), nullable=True)
