from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_user_context
from app.schemas.user import UserContext
from app.schemas.dashboard import DashboardStatsResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    context: UserContext = Depends(get_user_context),
    db: Session = Depends(get_db),
):
    """
    Returns verified, live database operational metrics for the user's active school.
    Includes active students, staff attendance, fee collections in PKR, and audit logs.
    """
    if not context.active_school_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active school selected or user does not belong to any school.",
        )

    return DashboardService.get_school_dashboard_stats(db, context.active_school_id)
