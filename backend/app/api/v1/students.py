from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_user_context, require_roles
from app.schemas.student import StudentCreate, StudentList, StudentRead, StudentUpdate
from app.schemas.user import UserContext
from app.services import student_service

router = APIRouter()


@router.get("", response_model=StudentList)
def list_students(
    q: str | None = Query(default=None, max_length=100),
    status_filter: str | None = Query(default=None, alias="status", pattern="^(active|inactive|transferred|graduated)$"),
    class_id: str | None = None,
    section_id: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    context: UserContext = require_roles(["admin", "teacher", "accountant"]),
    db: Session = Depends(get_db),
):
    result = student_service.list_students(db, context, q, status_filter, class_id, section_id, page, page_size)
    result["items"] = [StudentRead.model_validate(item) for item in result["items"]]
    return result


@router.get("/{student_id}", response_model=StudentRead)
def get_student(student_id: str, context: UserContext = require_roles(["admin", "teacher", "accountant"]), db: Session = Depends(get_db)):
    return student_service.get_student(db, context, student_id)


@router.post("", response_model=StudentRead, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentCreate, context: UserContext = require_roles(["admin"]), db: Session = Depends(get_db)):
    return student_service.create_student(db, context, payload)


@router.patch("/{student_id}", response_model=StudentRead)
def update_student(student_id: str, payload: StudentUpdate, context: UserContext = require_roles(["admin"]), db: Session = Depends(get_db)):
    return student_service.update_student(db, context, student_id, payload)
