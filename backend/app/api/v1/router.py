from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.schools import router as schools_router
from app.api.v1.dashboard import router as dashboard_router

api_router = APIRouter()

api_router.include_router(health_router, prefix="/health", tags=["Health"])
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication & Profile"])
api_router.include_router(schools_router, prefix="/schools", tags=["Schools & Multi-Tenancy"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
