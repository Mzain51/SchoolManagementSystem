from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


StudentStatus = Literal["active", "inactive", "transferred", "graduated"]


class StudentFields(BaseModel):
    academic_year_id: str
    class_id: str
    section_id: str
    admission_number: str = Field(min_length=1, max_length=50)
    full_name: str = Field(min_length=2, max_length=200)
    date_of_birth: Optional[date] = None
    gender: Optional[Literal["female", "male", "other", "prefer_not_to_say"]] = None
    admission_date: date
    guardian_name: str = Field(min_length=2, max_length=200)
    guardian_relationship: Optional[str] = Field(default=None, max_length=50)
    guardian_phone: str = Field(min_length=7, max_length=30)
    address: Optional[str] = None
    previous_school: Optional[str] = Field(default=None, max_length=200)
    emergency_contact: Optional[str] = Field(default=None, max_length=30)
    status: StudentStatus = "active"


class StudentCreate(StudentFields):
    pass


class StudentUpdate(BaseModel):
    academic_year_id: Optional[str] = None
    class_id: Optional[str] = None
    section_id: Optional[str] = None
    admission_number: Optional[str] = Field(default=None, min_length=1, max_length=50)
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=200)
    date_of_birth: Optional[date] = None
    gender: Optional[Literal["female", "male", "other", "prefer_not_to_say"]] = None
    admission_date: Optional[date] = None
    guardian_name: Optional[str] = Field(default=None, min_length=2, max_length=200)
    guardian_relationship: Optional[str] = Field(default=None, max_length=50)
    guardian_phone: Optional[str] = Field(default=None, min_length=7, max_length=30)
    address: Optional[str] = None
    previous_school: Optional[str] = Field(default=None, max_length=200)
    emergency_contact: Optional[str] = Field(default=None, max_length=30)
    status: Optional[StudentStatus] = None


class StudentRead(StudentFields):
    id: str
    school_id: str
    created_at: datetime
    updated_at: datetime
    class_name: str
    section_name: str
    model_config = ConfigDict(from_attributes=True)


class StudentList(BaseModel):
    items: list[StudentRead]
    total: int
    page: int
    page_size: int
