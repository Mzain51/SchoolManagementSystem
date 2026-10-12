from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_user_context, require_roles
from app.models.school import School
from app.models.user import SchoolMembership, Role
from app.schemas.school import SchoolRead, SchoolCreate, SchoolUpdate
from app.schemas.user import UserContext

router = APIRouter()


@router.get("", response_model=List[SchoolRead])
def list_my_schools(
    context: UserContext = Depends(get_user_context),
    db: Session = Depends(get_db),
):
    """Lists all schools where the authenticated user has an active membership."""
    if context.is_superadmin:
        return db.query(School).filter(School.is_active == True).all()

    return context.available_schools


@router.get("/{school_id}", response_model=SchoolRead)
def get_school_details(
    school_id: str,
    context: UserContext = Depends(get_user_context),
    db: Session = Depends(get_db),
):
    """Returns details of a specific school, validating tenant isolation."""
    # Check if user has membership in this school or is superadmin
    allowed = context.is_superadmin or any(s.id == school_id for s in context.available_schools)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You do not belong to this school.",
        )

    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found.",
        )
    return school


@router.post("", response_model=SchoolRead, status_code=status.HTTP_201_CREATED)
def create_school(
    payload: SchoolCreate,
    context: UserContext = Depends(get_user_context),
    db: Session = Depends(get_db),
):
    """Creates a new school and assigns creator as primary Admin."""
    # Only superadmin or existing admins can create new school tenants
    if not context.is_superadmin and context.active_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create new school tenants.",
        )

    existing = db.query(School).filter(School.code == payload.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A school with code '{payload.code}' already exists.",
        )

    school = School(
        name=payload.name,
        code=payload.code,
        address=payload.address,
        city=payload.city,
        province=payload.province,
        contact_phone=payload.contact_phone,
        contact_email=payload.contact_email,
        logo_url=payload.logo_url,
        currency=payload.currency,
        timezone=payload.timezone,
        is_active=payload.is_active,
    )
    db.add(school)
    db.flush()

    # Assign creator as admin of the newly created school
    admin_role = db.query(Role).filter(Role.name == "admin").first()
    if admin_role:
        membership = SchoolMembership(
            user_id=context.user_id,
            school_id=school.id,
            role_id=admin_role.id,
            is_active=True,
        )
        db.add(membership)

    db.commit()
    db.refresh(school)
    return school
