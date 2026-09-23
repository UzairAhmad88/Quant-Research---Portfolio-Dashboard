from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.return_service import ReturnService
from app.schemas.returns import ReturnAnalysisResponse
from app.models.enums import DataFrequency
from app.core.exceptions import ValidationError

router = APIRouter()

@router.get("", response_model=ReturnAnalysisResponse, status_code=status.HTTP_200_OK)
def get_return_analysis(
    instrument_id: str = Query(..., description="UUID of target instrument"),
    start_date: Optional[datetime] = Query(None, description="Start date filter (UTC ISO)"),
    end_date: Optional[datetime] = Query(None, description="End date filter (UTC ISO)"),
    price_source: str = Query("adjusted", description="Price series source: 'adjusted' or 'close'"),
    return_type: str = Query("simple", description="Primary return calculation: 'simple' or 'log'"),
    frequency: DataFrequency = Query(DataFrequency.DAILY, description="Observation bar frequency"),
    db: Session = Depends(get_db)
):
    """
    Calculate mathematical investment returns from validated market data series.
    Returns cumulative return curves, period performance, CAGR annualized return, and daily return series.
    """
    if start_date and end_date and start_date > end_date:
        raise ValidationError("start_date cannot be after end_date")

    service = ReturnService(db)
    return service.calculate_returns(
        instrument_id=instrument_id,
        start_date=start_date,
        end_date=end_date,
        price_source=price_source,
        return_type=return_type,
        frequency=frequency
    )
