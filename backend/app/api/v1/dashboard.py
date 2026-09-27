from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import DashboardOverviewResponse

router = APIRouter()


@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(db: Session = Depends(get_db)):
    """
    Returns consolidated overview summary data for the Quant Research Dashboard.
    Aggregates market data, portfolios, strategies, signals, backtests, and system health status.
    """
    service = DashboardService(db)
    return service.get_dashboard_overview()
