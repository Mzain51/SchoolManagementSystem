from typing import List
from sqlalchemy.orm import Session
from app.models.school import School
from app.models.user import SchoolMembership, Role, UserProfile
from app.models.audit import AuditLog
from app.models.academic import SchoolClass, Section
from app.models.student import Student
from app.schemas.dashboard import (
    DashboardStatsResponse,
    TrendPoint,
    ActivityItem,
    NoticeItem,
)


class DashboardService:
    @staticmethod
    def get_school_dashboard_stats(db: Session, school_id: str) -> DashboardStatsResponse:
        school = db.query(School).filter(School.id == school_id).first()
        if not school:
            school_name = "Default School"
            currency = "PKR"
        else:
            school_name = school.name
            currency = school.currency

        # Real queries for staff & teachers in this school
        teacher_role = db.query(Role).filter(Role.name == "teacher").first()
        staff_role = db.query(Role).filter(Role.name.in_(["accountant", "staff"])).first()

        total_teachers = 0
        if teacher_role:
            total_teachers = (
                db.query(SchoolMembership)
                .filter(
                    SchoolMembership.school_id == school_id,
                    SchoolMembership.role_id == teacher_role.id,
                    SchoolMembership.is_active == True,
                )
                .count()
            )

        total_staff = 0
        if staff_role:
            total_staff = (
                db.query(SchoolMembership)
                .filter(
                    SchoolMembership.school_id == school_id,
                    SchoolMembership.role_id == staff_role.id,
                    SchoolMembership.is_active == True,
                )
                .count()
            )

        total_students = db.query(Student).filter(
            Student.school_id == school_id, Student.status == "active"
        ).count()
        total_classes = db.query(SchoolClass).filter(SchoolClass.school_id == school_id).count()
        total_sections = db.query(Section).filter(Section.school_id == school_id).count()

        # Today's attendance counts
        students_present_today = 0
        students_absent_today = 0
        students_leave_today = 0
        student_attendance_pct = 0.0

        # Attendance is not yet implemented; do not report staff as present without records.
        staff_present_today = 0
        staff_absent_today = 0
        staff_attendance_pct = 0.0

        # Financials in PKR
        today_fee_collection = 0.0
        month_fee_collection = 0.0
        total_outstanding_balance = 0.0
        overdue_students_count = 0

        # Attendance and finance are not implemented, so their charts remain empty until backed by records.
        attendance_trend: List[TrendPoint] = []
        fee_collection_trend: List[TrendPoint] = []

        # Recent activities from AuditLog
        recent_logs = (
            db.query(AuditLog)
            .filter(AuditLog.school_id == school_id)
            .order_by(AuditLog.created_at.desc())
            .limit(5)
            .all()
        )

        recent_activities: List[ActivityItem] = []
        for log in recent_logs:
            user_name = log.user.full_name if log.user else "System"
            recent_activities.append(
                ActivityItem(
                    id=log.id,
                    action=log.action,
                    description=f"{log.action} on {log.entity_type}",
                    user_name=user_name,
                    created_at=log.created_at,
                )
            )



        # Recent notices
        recent_notices: List[NoticeItem] = []

        return DashboardStatsResponse(
            school_id=school_id,
            school_name=school_name,
            currency=currency,
            total_students=total_students,
            total_teachers=total_teachers,
            total_staff=total_staff,
            total_classes=total_classes,
            total_sections=total_sections,
            student_attendance_percentage=student_attendance_pct,
            students_present_today=students_present_today,
            students_absent_today=students_absent_today,
            students_leave_today=students_leave_today,
            staff_attendance_percentage=staff_attendance_pct,
            staff_present_today=staff_present_today,
            staff_absent_today=staff_absent_today,
            today_fee_collection=today_fee_collection,
            month_fee_collection=month_fee_collection,
            total_outstanding_balance=total_outstanding_balance,
            overdue_students_count=overdue_students_count,
            attendance_trend=attendance_trend,
            fee_collection_trend=fee_collection_trend,
            recent_activities=recent_activities,
            recent_notices=recent_notices,
        )
