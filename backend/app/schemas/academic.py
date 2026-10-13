from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AcademicYearCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    start_date: date
    end_date: date
    is_active: bool = False

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date <= self.start_date:
            raise ValueError("End date must be after start date.")
        return self


class AcademicYearRead(AcademicYearCreate):
    id: str
    school_id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ClassCreate(BaseModel):
    academic_year_id: str
    name: str = Field(min_length=1, max_length=100)
    sort_order: int = Field(default=0, ge=0)


class ClassRead(ClassCreate):
    id: str
    school_id: str
    model_config = ConfigDict(from_attributes=True)


class SectionCreate(BaseModel):
    class_id: str
    name: str = Field(min_length=1, max_length=50)
    capacity: Optional[int] = Field(default=None, gt=0)


class SectionRead(SectionCreate):
    id: str
    school_id: str
    model_config = ConfigDict(from_attributes=True)


class SubjectCreate(BaseModel):
    academic_year_id: str
    name: str = Field(min_length=1, max_length=120)
    code: str = Field(min_length=1, max_length=30)


class SubjectRead(SubjectCreate):
    id: str
    school_id: str
    model_config = ConfigDict(from_attributes=True)


class TeacherAssignmentCreate(BaseModel):
    user_id: str
    academic_year_id: str
    class_id: str
    section_id: Optional[str] = None


class TeacherAssignmentRead(TeacherAssignmentCreate):
    id: str
    school_id: str
    model_config = ConfigDict(from_attributes=True)
