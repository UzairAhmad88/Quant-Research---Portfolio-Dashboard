from datetime import datetime
from fastapi import APIRouter
from sqlalchemy import text
from app.core.config import settings
from app.db.session import SessionLocal
from app.schemas.health import ApiResponse, HealthData

router = APIRouter()

@router.get("/health", response_model=ApiResponse[HealthData])
def check_health():
    db_connected = False
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_connected = True
    except Exception:
        db_connected = False

    return ApiResponse(
        success=True,
        data=HealthData(
            status="ok",
            version=settings.VERSION,
            environment=settings.ENVIRONMENT,
            dbConnected=db_connected,
            timestamp=datetime.utcnow().isoformat(),
        ),
        error=None,
        metadata={},
    )
