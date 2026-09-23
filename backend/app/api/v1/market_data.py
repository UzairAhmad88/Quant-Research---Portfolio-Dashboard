from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.market_data_service import MarketDataService
from app.services.instrument_service import InstrumentService
from app.repositories.market_data_repository import MarketDataRepository
from app.schemas.market_data import (
    OHLCVResponse,
    MarketDataFetchRequest,
    MarketDataFetchResponse,
    CoverageResponse,
    IngestionLogResponse
)
from app.schemas.common import PaginatedResponse
from app.models.enums import DataFrequency
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter()

@router.post("/fetch", response_model=MarketDataFetchResponse, status_code=status.HTTP_200_OK)
async def fetch_market_data(payload: MarketDataFetchRequest, db: Session = Depends(get_db)):
    """
    Trigger historical market data acquisition from a provider.
    Inspects PostgreSQL cache, calculates missing ranges, validates OHLC bars, and persists valid records.
    """
    service = MarketDataService(db)
    summary = await service.fetch_and_ingest_market_data(payload)
    return MarketDataFetchResponse(
        message=f"Market data acquisition for symbol '{summary.symbol}' completed with status '{summary.status.value}'.",
        summary=summary
    )

@router.get("", response_model=PaginatedResponse[OHLCVResponse], status_code=status.HTTP_200_OK)
def query_market_data(
    instrument_id: Optional[str] = Query(None, description="UUID of target instrument"),
    frequency: DataFrequency = Query(DataFrequency.DAILY, description="Bar frequency"),
    start_date: Optional[datetime] = Query(None, description="Start date filter (UTC ISO)"),
    end_date: Optional[datetime] = Query(None, description="End date filter (UTC ISO)"),
    provider: Optional[str] = Query(None, description="Filter by data provider"),
    limit: int = Query(50, ge=1, le=5000, description="Max bars per response page"),
    offset: int = Query(0, ge=0, description="Page offset cursor"),
    db: Session = Depends(get_db)
):
    if start_date and end_date and start_date > end_date:
        raise ValidationError("start_date cannot be after end_date")

    repo = MarketDataRepository(db)
    bars = repo.get_bars(
        instrument_id=instrument_id,
        start_date=start_date,
        end_date=end_date,
        frequency=frequency,
        provider=provider,
        limit=limit,
        offset=offset
    )
    total_count = repo.count_bars(
        instrument_id=instrument_id,
        start_date=start_date,
        end_date=end_date,
        frequency=frequency,
        provider=provider
    )

    return PaginatedResponse(
        items=[OHLCVResponse.model_validate(b) for b in bars],
        total=total_count,
        limit=limit,
        offset=offset
    )

@router.get("/{instrument_id}/coverage", response_model=CoverageResponse, status_code=status.HTTP_200_OK)
def get_market_data_coverage(
    instrument_id: str,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    service = MarketDataService(db)
    return service.get_coverage(instrument_id=instrument_id, requested_start=start_date, requested_end=end_date)

@router.get("/{instrument_id}/ingestions", response_model=List[IngestionLogResponse], status_code=status.HTTP_200_OK)
def get_ingestion_history(
    instrument_id: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    service = MarketDataService(db)
    logs = service.get_ingestion_history(instrument_id=instrument_id, limit=limit)
    return [IngestionLogResponse.model_validate(l) for l in logs]

@router.get("/{instrument_id}/export", status_code=status.HTTP_200_OK)
def export_market_data_csv(
    instrument_id: str,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    service = MarketDataService(db)
    csv_data = service.export_csv(instrument_id=instrument_id, start_date=start_date, end_date=end_date)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="market_data_{instrument_id[:8]}.csv"'}
    )

@router.get("/{instrument_id}/latest", response_model=OHLCVResponse, status_code=status.HTTP_200_OK)
def get_latest_market_data(
    instrument_id: str,
    frequency: DataFrequency = Query(DataFrequency.DAILY),
    db: Session = Depends(get_db)
):
    repo = MarketDataRepository(db)
    bar = repo.get_latest_bar(instrument_id=instrument_id, frequency=frequency)
    if not bar:
        raise NotFoundError(f"No stored market data observations found for instrument ID '{instrument_id}'.")
    return OHLCVResponse.model_validate(bar)

@router.get("/{instrument_id}", response_model=PaginatedResponse[OHLCVResponse], status_code=status.HTTP_200_OK)
def get_market_data_for_instrument(
    instrument_id: str,
    frequency: DataFrequency = Query(DataFrequency.DAILY),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(50, ge=1, le=5000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    return query_market_data(
        instrument_id=instrument_id,
        frequency=frequency,
        start_date=start_date,
        end_date=end_date,
        provider=None,
        limit=limit,
        offset=offset,
        db=db
    )
