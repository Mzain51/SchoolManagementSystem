from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.academic import AcademicYear, SchoolClass, Section, TeacherClassAssignment
from app.models.audit import AuditLog
from app.models.student import Student
from app.schemas.student import StudentCreate, StudentUpdate
from app.schemas.user import UserContext


def _validate_placement(db: Session, school_id: str, year_id: str, class_id: str, section_id: str) -> None:
    year = db.query(AcademicYear).filter_by(id=year_id, school_id=school_id).first()
    classroom = db.query(SchoolClass).filter_by(
        id=class_id, school_id=school_id, academic_year_id=year_id
    ).first()
    section = db.query(Section).filter_by(id=section_id, school_id=school_id, class_id=class_id).first()
    if not year or not classroom or not section:
        raise HTTPException(
            status_code=422,
            detail="Academic year, class, and section must exist in the selected school and belong together.",
        )


def _student_query(db: Session):
    return db.query(Student).options(joinedload(Student.school_class), joinedload(Student.section))


def list_students(
    db: Session,
    context: UserContext,
    q: str | None,
    status_filter: str | None,
    class_id: str | None,
    section_id: str | None,
    page: int,
    page_size: int,
):
    query = _student_query(db).filter(Student.school_id == context.active_school_id)
    if context.active_role == "teacher":
        assignments = db.query(TeacherClassAssignment).filter_by(
            school_id=context.active_school_id, user_id=context.user_id
        ).all()
        if not assignments:
            query = query.filter(Student.id == "")
        else:
            from sqlalchemy import and_
            assignment_filters = [
                and_(Student.academic_year_id == a.academic_year_id, Student.class_id == a.class_id,
                     (Student.section_id == a.section_id) if a.section_id else True)
                for a in assignments
            ]
            query = query.filter(or_(*assignment_filters))
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(or_(Student.full_name.ilike(term), Student.admission_number.ilike(term), Student.guardian_phone.ilike(term)))
    if status_filter:
        query = query.filter(Student.status == status_filter)
    if class_id:
        query = query.filter(Student.class_id == class_id)
    if section_id:
        query = query.filter(Student.section_id == section_id)
    total = query.count()
    items = query.order_by(Student.full_name.asc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}


def get_student(db: Session, context: UserContext, student_id: str) -> Student:
    query = _student_query(db).filter(Student.id == student_id, Student.school_id == context.active_school_id)
    if context.active_role == "teacher":
        query = query.join(
            TeacherClassAssignment,
            (TeacherClassAssignment.school_id == Student.school_id)
            & (TeacherClassAssignment.user_id == context.user_id)
            & (TeacherClassAssignment.academic_year_id == Student.academic_year_id)
            & (TeacherClassAssignment.class_id == Student.class_id)
            & ((TeacherClassAssignment.section_id == Student.section_id) | TeacherClassAssignment.section_id.is_(None)),
        )
    student = query.first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found.")
    return student


def create_student(db: Session, context: UserContext, payload: StudentCreate) -> Student:
    _validate_placement(db, context.active_school_id, payload.academic_year_id, payload.class_id, payload.section_id)
    duplicate = db.query(Student).filter_by(
        school_id=context.active_school_id, admission_number=payload.admission_number
    ).first()
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Admission number already exists in this school.")
    student = Student(school_id=context.active_school_id, **payload.model_dump())
    db.add(student)
    db.flush()
    db.add(AuditLog(school_id=context.active_school_id, user_id=context.user_id, action="STUDENT_CREATED",
                    entity_type="Student", entity_id=student.id, changes={"admission_number": student.admission_number}))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Admission number already exists in this school.")
    return get_student(db, context, student.id)


def update_student(db: Session, context: UserContext, student_id: str, payload: StudentUpdate) -> Student:
    student = get_student(db, context, student_id)
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    next_year = changes.get("academic_year_id", student.academic_year_id)
    next_class = changes.get("class_id", student.class_id)
    next_section = changes.get("section_id", student.section_id)
    _validate_placement(db, context.active_school_id, next_year, next_class, next_section)
    admission_number = changes.get("admission_number", student.admission_number)
    duplicate = db.query(Student).filter(
        Student.school_id == context.active_school_id,
        Student.admission_number == admission_number,
        Student.id != student_id,
    ).first()
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Admission number already exists in this school.")
    before = {key: getattr(student, key) for key in changes}
    for key, value in changes.items():
        setattr(student, key, value)
    db.add(AuditLog(school_id=context.active_school_id, user_id=context.user_id, action="STUDENT_UPDATED",
                    entity_type="Student", entity_id=student.id,
                    changes={"before": {k: str(v) for k, v in before.items()}, "after": {k: str(v) for k, v in changes.items()}}))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Admission number already exists in this school.")
    return get_student(db, context, student.id)
