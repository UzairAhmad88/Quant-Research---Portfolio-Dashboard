from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings

router = APIRouter()

@router.get("/health", status_code=status.HTTP_200_OK, summary="Liveness Probe")
def get_liveness():
    """Liveness probe: returns OK if the Python process is healthy."""
    return {
        "status": "ok",
        "service": "quant-research-backend",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@router.get("/health/ready", status_code=status.HTTP_200_OK, summary="Readiness Probe")
def get_readiness(db: Session = Depends(get_db)):
    """Readiness probe: verifies database connectivity."""
    db_connected = False
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False

    if not db_connected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection unavailable"
        )

    return {
        "status": "ready",
        "service": "quant-research-backend",
        "version": settings.VERSION,
        "database": "connected",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

@router.get("/version", status_code=status.HTTP_200_OK, summary="Application Version")
def get_version():
    """Returns safe application version and build metadata."""
    return {
        "version": settings.VERSION,
        "build_id": settings.BUILD_ID,
        "environment": settings.ENVIRONMENT,
        "project": settings.PROJECT_NAME,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
