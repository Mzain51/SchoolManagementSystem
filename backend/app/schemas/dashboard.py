from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel


class MetricCard(BaseModel):
    title: str
    value: str
    numeric_value: float
    change_text: Optional[str] = None
    trend: Optional[str] = "neutral"  # 'up', 'down', 'neutral'
    badge: Optional[str] = None


class TrendPoint(BaseModel):
    label: str
    value: float
    secondary_value: Optional[float] = None


class ActivityItem(BaseModel):
    id: str
    action: str
    description: str
    user_name: Optional[str] = None
    created_at: datetime


class NoticeItem(BaseModel):
    id: str
    title: str
    category: str
    date: date
    is_urgent: bool = False


class DashboardStatsResponse(BaseModel):
    school_id: str
    school_name: str
    currency: str
    
    # Overview counts
    total_students: int
    total_teachers: int
    total_staff: int
    total_classes: int
    total_sections: int
    
    # Today's Student Attendance
    student_attendance_percentage: float
    students_present_today: int
    students_absent_today: int
    students_leave_today: int
    
    # Today's Staff Attendance
    staff_attendance_percentage: float
    staff_present_today: int
    staff_absent_today: int
    
    # Financial metrics (Real PKR numbers)
    today_fee_collection: float
    month_fee_collection: float
    total_outstanding_balance: float
    overdue_students_count: int
    
    # Trends for Recharts
    attendance_trend: List[TrendPoint] = []
    fee_collection_trend: List[TrendPoint] = []
    
    # Lists
    recent_activities: List[ActivityItem] = []
    recent_notices: List[NoticeItem] = []
