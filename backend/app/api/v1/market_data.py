from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.market_data_service import MarketDataService
from app.services.instrument_service import InstrumentService
from app.services.data_quality_service import DataQualityService
from app.repositories.market_data_repository import MarketDataRepository
from app.schemas.market_data import (
    OHLCVResponse,
    MarketDataFetchRequest,
    MarketDataFetchResponse,
    CoverageResponse,
    IngestionLogResponse,
    LatestMarketDataResponse,
    ProviderCapabilitiesResponse,
)
from app.schemas.data_quality import IngestionDetailResponse
from app.validators import QualityReport
from app.schemas.common import PaginatedResponse
from app.models.enums import DataFrequency
from app.export import ExportService, ExportMetadata
from app.repositories.instrument_repository import InstrumentRepository

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

@router.get("/providers/capabilities", response_model=List[ProviderCapabilitiesResponse], status_code=status.HTTP_200_OK)
def get_provider_capabilities(
    provider: Optional[str] = Query(None, description="Optional provider identifier"),
    db: Session = Depends(get_db)
):
    """
    Expose market-data provider capabilities (historical, latest, intraday, streaming, delayed vs real-time).
    """
    service = MarketDataService(db)
    return service.get_provider_capabilities(provider_name=provider)

@router.get("/latest/batch", response_model=List[LatestMarketDataResponse], status_code=status.HTTP_200_OK)
async def get_latest_market_data_batch(
    instrument_ids: Optional[str] = Query(None, description="Comma-separated instrument UUIDs"),
    symbols: Optional[str] = Query(None, description="Comma-separated ticker symbols"),
    frequency: DataFrequency = Query(DataFrequency.DAILY, description="Bar frequency"),
    force_refresh: bool = Query(False, description="Bypass cache and force provider retrieval"),
    provider: str = Query("yahoo_finance", description="Market data provider"),
    db: Session = Depends(get_db)
):
    """
    Batch retrieve the latest market observation for multiple instruments.
    """
    service = MarketDataService(db)
    inst_id_list = [i.strip() for i in instrument_ids.split(",") if i.strip()] if instrument_ids else None
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()] if symbols else None
    
    return await service.get_latest_market_data_batch(
        instrument_ids=inst_id_list,
        symbols=symbol_list,
        frequency=frequency,
        force_refresh=force_refresh,
        provider_name=provider
    )

@router.get("/latest", response_model=LatestMarketDataResponse, status_code=status.HTTP_200_OK)
async def get_latest_market_data_observation(
    instrument_id: Optional[str] = Query(None, description="UUID of target instrument"),
    symbol: Optional[str] = Query(None, description="Ticker symbol (e.g. AAPL)"),
    frequency: DataFrequency = Query(DataFrequency.DAILY, description="Bar frequency"),
    force_refresh: bool = Query(False, description="Bypass cache and force provider retrieval"),
    provider: str = Query("yahoo_finance", description="Market data provider"),
    db: Session = Depends(get_db)
):
    """
    Retrieve the latest available market observation for a single instrument.
    Database-First: checks local PostgreSQL observations before querying provider.
    """
    if not instrument_id and not symbol:
        raise ValidationError("Either instrument_id or symbol must be provided.")

    service = MarketDataService(db)
    return await service.get_latest_market_data(
        instrument_id=instrument_id,
        symbol=symbol,
        frequency=frequency,
        force_refresh=force_refresh,
        provider_name=provider
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

@router.get("/{instrument_id}/quality", response_model=QualityReport, status_code=status.HTTP_200_OK)
def get_market_data_quality_report(
    instrument_id: str,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    frequency: DataFrequency = Query(DataFrequency.DAILY),
    db: Session = Depends(get_db)
):
    quality_service = DataQualityService(db)
    return quality_service.get_instrument_quality_report(
        instrument_id=instrument_id,
        start_date=start_date,
        end_date=end_date,
        frequency=frequency
    )

@router.get("/{instrument_id}/ingestions", response_model=List[IngestionLogResponse], status_code=status.HTTP_200_OK)
def get_ingestion_history(
    instrument_id: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    service = MarketDataService(db)
    logs = service.get_ingestion_history(instrument_id=instrument_id, limit=limit)
    return [IngestionLogResponse.model_validate(l) for l in logs]

@router.get("/{instrument_id}/ingestions/{ingestion_id}", response_model=IngestionDetailResponse, status_code=status.HTTP_200_OK)
def get_ingestion_detail(
    instrument_id: str,
    ingestion_id: str,
    db: Session = Depends(get_db)
):
    quality_service = DataQualityService(db)
    log, report = quality_service.get_ingestion_detail(instrument_id=instrument_id, ingestion_id=ingestion_id)
    return IngestionDetailResponse(
        id=log.id,
        instrument_id=log.instrument_id,
        provider=log.provider,
        frequency=log.frequency,
        requested_start=log.requested_start,
        requested_end=log.requested_end,
        actual_start=log.actual_start,
        actual_end=log.actual_end,
        rows_received=log.rows_received,
        rows_inserted=log.rows_inserted,
        rows_skipped=log.rows_skipped,
        rows_invalid=log.rows_invalid,
        duration_ms=log.duration_ms,
        status=log.status,
        error_message=log.error_message,
        created_at=log.created_at,
        quality_report=report
    )

def _build_market_data_export_response(
    instrument_id: str,
    start_date: Optional[datetime],
    end_date: Optional[datetime],
    frequency: DataFrequency,
    format_str: str,
    db: Session
) -> Response:
    inst_repo = InstrumentRepository(db)
    instrument = inst_repo.get_by_id(instrument_id)
    if not instrument:
        raise NotFoundError(f"Instrument with ID '{instrument_id}' was not found.")

    market_repo = MarketDataRepository(db)
    bars = market_repo.get_bars(
        instrument_id=instrument_id,
        start_date=start_date,
        end_date=end_date,
        frequency=frequency,
        limit=10000
    )

    metadata = ExportMetadata(
        export_type="MARKET_DATA",
        instrument=str(instrument.id),
        symbol=instrument.symbol,
        date_range=f"{start_date.isoformat() if start_date else 'START'}_{end_date.isoformat() if end_date else 'END'}",
        provider="yahoo_finance",
        frequency=frequency.value if hasattr(frequency, 'value') else str(frequency),
    )

    fmt_lower = format_str.lower().strip()
    if fmt_lower == "json":
        data = [
            {
                "timestamp": b.timestamp.strftime("%Y-%m-%dT%H:%M:%SZ") if isinstance(b.timestamp, datetime) else str(b.timestamp),
                "open": float(b.open),
                "high": float(b.high),
                "low": float(b.low),
                "close": float(b.close),
                "adjusted_close": float(b.adjusted_close) if b.adjusted_close is not None else None,
                "volume": float(b.volume) if b.volume is not None else None,
                "instrument": instrument.symbol,
                "provider": b.provider,
                "frequency": b.frequency.value if hasattr(b.frequency, 'value') else str(b.frequency)
            }
            for b in bars
        ]
    else:
        headers = ["timestamp", "open", "high", "low", "close", "adjusted_close", "volume", "instrument", "provider", "frequency"]
        rows = [
            [
                b.timestamp,
                float(b.open),
                float(b.high),
                float(b.low),
                float(b.close),
                float(b.adjusted_close) if b.adjusted_close is not None else "",
                float(b.volume) if b.volume is not None else "",
                instrument.symbol,
                b.provider,
                b.frequency.value if hasattr(b.frequency, 'value') else str(b.frequency)
            ]
            for b in bars
        ]
        data = {"headers": headers, "rows": rows}

    export_service = ExportService()
    date_part = f"{bars[0].timestamp.strftime('%Y%m%d')}_{bars[-1].timestamp.strftime('%Y%m%d')}" if bars else "all"
    freq_str = frequency.value if hasattr(frequency, 'value') else str(frequency)
    prefix = f"{instrument.symbol}_market_data_{freq_str}_{date_part}"
    return export_service.create_export_response(
        data=data,
        metadata=metadata,
        format_str=format_str,
        filename_prefix=prefix
    )

@router.get("/export", status_code=status.HTTP_200_OK, summary="Export market data in CSV or JSON format")
def export_market_data_query(
    instrument_id: str = Query(..., description="Target instrument UUID"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    frequency: DataFrequency = Query(DataFrequency.DAILY),
    format: str = Query("csv", description="Export format: 'csv' or 'json'"),
    db: Session = Depends(get_db)
):
    return _build_market_data_export_response(
        instrument_id=instrument_id,
        start_date=start_date,
        end_date=end_date,
        frequency=frequency,
        format_str=format,
        db=db
    )

@router.get("/{instrument_id}/export", status_code=status.HTTP_200_OK, summary="Export market data for instrument in CSV or JSON format")
def export_market_data_for_instrument(
    instrument_id: str,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    frequency: DataFrequency = Query(DataFrequency.DAILY),
    format: str = Query("csv", description="Export format: 'csv' or 'json'"),
    db: Session = Depends(get_db)
):
    return _build_market_data_export_response(
        instrument_id=instrument_id,
        start_date=start_date,
        end_date=end_date,
        frequency=frequency,
        format_str=format,
        db=db
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
