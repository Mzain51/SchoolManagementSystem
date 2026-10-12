from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SchoolBase(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    city: Optional[str] = "Lahore"
    province: Optional[str] = "Punjab"
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    logo_url: Optional[str] = None
    currency: str = "PKR"
    timezone: str = "Asia/Karachi"
    is_active: bool = True


class SchoolCreate(SchoolBase):
    pass


class SchoolUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    logo_url: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    is_active: Optional[bool] = None


class SchoolRead(SchoolBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
