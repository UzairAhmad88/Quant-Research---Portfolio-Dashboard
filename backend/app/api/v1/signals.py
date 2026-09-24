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
