from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.signal_service import SignalService
from app.schemas.signal import SignalListResponse, SignalEventResponse

router = APIRouter(prefix="/signals", tags=["Signals"])


@router.get(
    "",
    response_model=SignalListResponse,
    summary="Query standardized signal events across instruments and strategies"
)
def get_signals(
    instrument_id: Optional[str] = Query(None, description="Target Instrument UUID"),
    strategy_type: Optional[str] = Query(None, description="Strategy Type filter (e.g. 'MOVING_AVERAGE')"),
    strategy_configuration_id: Optional[str] = Query(None, description="Strategy Configuration UUID filter"),
    signal_type: Optional[str] = Query(None, description="Signal type filter ('BUY' or 'SELL')"),
    signal_state: Optional[str] = Query(None, description="Signal state filter ('BULLISH', 'BEARISH', or 'NEUTRAL')"),
    start_date: Optional[datetime] = Query(None, description="Start date filter (UTC)"),
    end_date: Optional[datetime] = Query(None, description="End date filter (UTC)"),
    limit: int = Query(100, ge=1, le=1000, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Records offset for pagination"),
    db: Session = Depends(get_db)
):
    service = SignalService(db)
    return service.get_signals(
        instrument_id=instrument_id,
        strategy_type=strategy_type,
        strategy_configuration_id=strategy_configuration_id,
        signal_type=signal_type,
        signal_state=signal_state,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )


@router.get(
    "/export",
    status_code=200,
    summary="Export standardized strategy signals in CSV or JSON format"
)
def export_signals(
    instrument_id: Optional[str] = Query(None, description="Target Instrument UUID"),
    strategy_type: Optional[str] = Query(None, description="Strategy Type filter"),
    strategy_configuration_id: Optional[str] = Query(None, description="Strategy Configuration UUID"),
    signal_type: Optional[str] = Query(None, description="Signal type filter ('BUY' or 'SELL')"),
    signal_state: Optional[str] = Query(None, description="Signal state filter"),
    start_date: Optional[datetime] = Query(None, description="Start date filter (UTC)"),
    end_date: Optional[datetime] = Query(None, description="End date filter (UTC)"),
    format: str = Query("csv", description="Export format: 'csv' or 'json'"),
    limit: int = Query(1000, ge=1, le=1000, description="Max records to export"),
    db: Session = Depends(get_db)
):
    from app.export import ExportService, ExportMetadata

    service = SignalService(db)
    res = service.get_signals(
        instrument_id=instrument_id,
        strategy_type=strategy_type,
        strategy_configuration_id=strategy_configuration_id,
        signal_type=signal_type,
        signal_state=signal_state,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=0
    )

    metadata = ExportMetadata(
        export_type="SIGNALS",
        instrument=instrument_id,
        date_range=f"{start_date.isoformat() if start_date else 'START'}_{end_date.isoformat() if end_date else 'END'}",
        extra={
            "strategy_type": strategy_type or "ALL",
            "total_signals": res.total,
        }
    )

    fmt_lower = format.lower().strip()
    if fmt_lower == "json":
        data = [s.model_dump(mode="json") for s in res.items]
    else:
        # Standardized CSV according to Specification:
        # Signal ID, Timestamp, Instrument, Strategy, Signal Type, Signal Source, Configuration ID
        headers = ["signal_id", "timestamp", "instrument_id", "strategy_type", "signal_type", "signal_state", "signal_source", "configuration_id"]
        rows = [
            [
                s.id,
                s.timestamp,
                s.instrument_id,
                s.strategy_type,
                s.signal_type,
                s.signal_state,
                s.signal_source,
                s.strategy_configuration_id,
            ]
            for s in res.items
        ]
        data = {"headers": headers, "rows": rows}

    export_service = ExportService()
    prefix = f"signals_{strategy_type or 'all'}_{len(res.items)}records"
    return export_service.create_export_response(
        data=data,
        metadata=metadata,
        format_str=format,
        filename_prefix=prefix
    )


@router.get(
    "/{signal_id}",
    response_model=SignalEventResponse,
    summary="Get details for a specific standardized signal event by UUID"
)
def get_signal_by_id(
    signal_id: str,
    db: Session = Depends(get_db)
):
    service = SignalService(db)
    return service.get_signal_by_id(signal_id)
