from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.strategy_service import StrategyService
from app.schemas.strategies import MovingAverageStrategyResponse

router = APIRouter(prefix="/strategies", tags=["Strategies"])


@router.get(
    "/moving-average",
    response_model=MovingAverageStrategyResponse,
    summary="Execute Moving Average Crossover Strategy and generate research signals"
)
def get_moving_average_strategy(
    instrument_id: str = Query(..., description="Target Instrument UUID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter (UTC)"),
    end_date: Optional[datetime] = Query(None, description="End date filter (UTC)"),
    price_source: str = Query("adjusted", description="'adjusted' or 'close'"),
    ma_type: str = Query("sma", description="'sma' or 'ema'"),
    fast_window: int = Query(20, description="Fast moving average window size (e.g. 20)"),
    slow_window: int = Query(50, description="Slow moving average window size (e.g. 50)"),
    db: Session = Depends(get_db)
):
    service = StrategyService(db)
    return service.calculate_moving_average_strategy(
        instrument_id=instrument_id,
        start_date=start_date,
        end_date=end_date,
        price_source=price_source,
        ma_type=ma_type,
        fast_window=fast_window,
        slow_window=slow_window
    )
