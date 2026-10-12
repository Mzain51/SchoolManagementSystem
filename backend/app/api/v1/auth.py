from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user, get_user_context
from app.models.user import UserProfile
from app.schemas.user import UserProfileRead, UserProfileUpdate, UserContext

router = APIRouter()


@router.get("/me", response_model=UserContext)
def get_current_user_profile(
    context: UserContext = Depends(get_user_context),
):
    """
    Returns the authenticated user's profile, active school context,
    assigned roles, and operational permissions.
    """
    return context


@router.put("/me", response_model=UserProfileRead)
def update_current_user_profile(
    payload: UserProfileUpdate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates editable personal attributes of the authenticated user."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.phone_number is not None:
        current_user.phone_number = payload.phone_number
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url

    db.commit()
    db.refresh(current_user)
    return current_user
