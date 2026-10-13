from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.core.security import get_user_context, require_roles
from app.models.academic import AcademicYear, SchoolClass, Section, Subject, TeacherClassAssignment
from app.models.user import Role, SchoolMembership
from app.schemas.academic import (
    AcademicYearCreate, AcademicYearRead, ClassCreate, ClassRead,
    SectionCreate, SectionRead, SubjectCreate, SubjectRead,
    TeacherAssignmentCreate, TeacherAssignmentRead,
)
from app.schemas.user import UserContext

router = APIRouter()


@router.get("/academic-years", response_model=list[AcademicYearRead])
def list_academic_years(context: UserContext = Depends(get_user_context), db: Session = Depends(get_db)):
    return db.query(AcademicYear).filter_by(school_id=context.active_school_id).order_by(AcademicYear.start_date.desc()).all()


@router.post("/academic-years", response_model=AcademicYearRead, status_code=status.HTTP_201_CREATED)
def create_academic_year(payload: AcademicYearCreate, context: UserContext = require_roles(["admin"]), db: Session = Depends(get_db)):
    if payload.is_active:
        db.query(AcademicYear).filter_by(school_id=context.active_school_id).update({"is_active": False})
    year = AcademicYear(school_id=context.active_school_id, **payload.model_dump())
    db.add(year)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="An academic year with this name already exists.")
    db.refresh(year)
    return year


@router.get("/classes", response_model=list[ClassRead])
def list_classes(academic_year_id: str | None = None, context: UserContext = Depends(get_user_context), db: Session = Depends(get_db)):
    query = db.query(SchoolClass).filter_by(school_id=context.active_school_id)
    if academic_year_id:
        query = query.filter_by(academic_year_id=academic_year_id)
    return query.order_by(SchoolClass.sort_order, SchoolClass.name).all()


@router.post("/classes", response_model=ClassRead, status_code=status.HTTP_201_CREATED)
def create_class(payload: ClassCreate, context: UserContext = require_roles(["admin"]), db: Session = Depends(get_db)):
    year = db.query(AcademicYear).filter_by(id=payload.academic_year_id, school_id=context.active_school_id).first()
    if not year:
        raise HTTPException(status_code=404, detail="Academic year not found.")
    classroom = SchoolClass(school_id=context.active_school_id, **payload.model_dump())
    db.add(classroom)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This class already exists for the selected academic year.")
    db.refresh(classroom)
    return classroom


@router.get("/sections", response_model=list[SectionRead])
def list_sections(class_id: str | None = None, context: UserContext = Depends(get_user_context), db: Session = Depends(get_db)):
    query = db.query(Section).filter_by(school_id=context.active_school_id)
    if class_id:
        query = query.filter_by(class_id=class_id)
    return query.order_by(Section.name).all()


@router.post("/sections", response_model=SectionRead, status_code=status.HTTP_201_CREATED)
def create_section(payload: SectionCreate, context: UserContext = require_roles(["admin"]), db: Session = Depends(get_db)):
    classroom = db.query(SchoolClass).filter_by(id=payload.class_id, school_id=context.active_school_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Class not found.")
    section = Section(school_id=context.active_school_id, **payload.model_dump())
    db.add(section)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This section already exists in the selected class.")
    db.refresh(section)
    return section


@router.get("/subjects", response_model=list[SubjectRead])
def list_subjects(academic_year_id: str | None = None, context: UserContext = Depends(get_user_context), db: Session = Depends(get_db)):
    query = db.query(Subject).filter_by(school_id=context.active_school_id)
    if academic_year_id:
        query = query.filter_by(academic_year_id=academic_year_id)
    return query.order_by(Subject.name).all()


@router.post("/subjects", response_model=SubjectRead, status_code=status.HTTP_201_CREATED)
def create_subject(payload: SubjectCreate, context: UserContext = require_roles(["admin"]), db: Session = Depends(get_db)):
    year = db.query(AcademicYear).filter_by(id=payload.academic_year_id, school_id=context.active_school_id).first()
    if not year:
        raise HTTPException(status_code=404, detail="Academic year not found.")
    subject = Subject(school_id=context.active_school_id, **payload.model_dump())
    db.add(subject)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This subject code already exists for the selected year.")
    db.refresh(subject)
    return subject


@router.get("/teacher-assignments", response_model=list[TeacherAssignmentRead])
def list_teacher_assignments(context: UserContext = require_roles(["admin"]), db: Session = Depends(get_db)):
    return db.query(TeacherClassAssignment).filter_by(school_id=context.active_school_id).all()


@router.post("/teacher-assignments", response_model=TeacherAssignmentRead, status_code=status.HTTP_201_CREATED)
def create_teacher_assignment(payload: TeacherAssignmentCreate, context: UserContext = require_roles(["admin"]), db: Session = Depends(get_db)):
    teacher_membership = (
        db.query(SchoolMembership)
        .join(Role, Role.id == SchoolMembership.role_id)
        .filter(
            SchoolMembership.school_id == context.active_school_id,
            SchoolMembership.user_id == payload.user_id,
            SchoolMembership.is_active == True,
            Role.name == "teacher",
        )
        .first()
    )
    classroom = db.query(SchoolClass).filter_by(
        id=payload.class_id, school_id=context.active_school_id, academic_year_id=payload.academic_year_id
    ).first()
    section = None
    if payload.section_id:
        section = db.query(Section).filter_by(
            id=payload.section_id, school_id=context.active_school_id, class_id=payload.class_id
        ).first()
    if not teacher_membership or not classroom or (payload.section_id and not section):
        raise HTTPException(status_code=422, detail="Teacher, year, class, and section must belong to the active school.")
    assignment = TeacherClassAssignment(school_id=context.active_school_id, **payload.model_dump())
    db.add(assignment)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This teacher assignment already exists.")
    db.refresh(assignment)
    return assignment
