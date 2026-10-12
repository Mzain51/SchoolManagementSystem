from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.config import settings
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """General health check verifying API and basic database response."""
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return HealthResponse(
        status="healthy" if "unhealthy" not in db_status else "degraded",
        environment=settings.ENVIRONMENT,
        version="1.0.0",
        database=db_status,
        timestamp=datetime.utcnow(),
    )


@router.get("/db")
def database_health(db: Session = Depends(get_db)):
    """Dedicated database connection test."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "connected", "database_url_dialect": settings.DATABASE_URL.split("://")[0]}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database unreachable: {str(e)}",
        )
