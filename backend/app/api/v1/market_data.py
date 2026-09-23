from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.market_data_service import MarketDataService
from app.services.instrument_service import InstrumentService
from app.schemas.market_data import OHLCVResponse
from app.schemas.common import PaginatedResponse
from app.models.enums import DataFrequency
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter()

@router.get("", response_model=PaginatedResponse[OHLCVResponse], status_code=status.HTTP_200_OK)
def query_market_data(
    instrument_id: str = Query(..., description="UUID of target instrument"),
    frequency: DataFrequency = Query(DataFrequency.DAILY, description="Bar frequency"),
    start_date: Optional[datetime] = Query(None, description="Start date filter (UTC ISO)"),
    end_date: Optional[datetime] = Query(None, description="End date filter (UTC ISO)"),
    provider: Optional[str] = Query(None, description="Filter by data provider"),
    limit: int = Query(1000, ge=1, le=10000, description="Max bars per response"),
    offset: int = Query(0, ge=0, description="Page offset cursor"),
    db: Session = Depends(get_db)
):
    # Validate date range
    if start_date and end_date and start_date > end_date:
        raise ValidationError("start_date cannot be greater than end_date")

    inst_service = InstrumentService(db)
    if not inst_service.get_instrument(instrument_id):
        raise NotFoundError(f"Instrument with ID '{instrument_id}' was not found.")

    md_service = MarketDataService(db)
    bars = md_service.get_historical_bars(
        instrument_id=instrument_id,
        start_date=start_date,
        end_date=end_date,
        frequency=frequency,
        limit=limit
    )

    if provider:
        bars = [b for b in bars if b.provider == provider]

    return PaginatedResponse(
        items=[OHLCVResponse.model_validate(b) for b in bars],
        total=len(bars),
        limit=limit,
        offset=offset
    )

@router.get("/{instrument_id}", response_model=PaginatedResponse[OHLCVResponse], status_code=status.HTTP_200_OK)
def get_market_data_for_instrument(
    instrument_id: str,
    frequency: DataFrequency = Query(DataFrequency.DAILY),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(1000, ge=1, le=10000),
    db: Session = Depends(get_db)
):
    return query_market_data(
        instrument_id=instrument_id,
        frequency=frequency,
        start_date=start_date,
        end_date=end_date,
        provider=None,
        limit=limit,
        offset=0,
        db=db
    )
