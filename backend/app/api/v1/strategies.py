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


@router.get(
    "/moving-average/export",
    status_code=200,
    summary="Export Moving Average Crossover Strategy time series in CSV or JSON format"
)
def export_moving_average_strategy(
    instrument_id: str = Query(..., description="Target Instrument UUID"),
    start_date: Optional[datetime] = Query(None, description="Start date filter (UTC)"),
    end_date: Optional[datetime] = Query(None, description="End date filter (UTC)"),
    price_source: str = Query("adjusted", description="'adjusted' or 'close'"),
    ma_type: str = Query("sma", description="'sma' or 'ema'"),
    fast_window: int = Query(20, description="Fast moving average window size"),
    slow_window: int = Query(50, description="Slow moving average window size"),
    format: str = Query("csv", description="Export format: 'csv' or 'json'"),
    db: Session = Depends(get_db)
):
    from app.export import ExportService, ExportMetadata

    service = StrategyService(db)
    res = service.calculate_moving_average_strategy(
        instrument_id=instrument_id,
        start_date=start_date,
        end_date=end_date,
        price_source=price_source,
        ma_type=ma_type,
        fast_window=fast_window,
        slow_window=slow_window
    )

    strat_desc = f"{ma_type.upper()}_{fast_window}_{slow_window}"
    metadata = ExportMetadata(
        export_type="STRATEGY_MOVING_AVERAGE",
        instrument=instrument_id,
        symbol=res.summary.symbol,
        date_range=f"{start_date.isoformat() if start_date else 'START'}_{end_date.isoformat() if end_date else 'END'}",
        price_source=price_source,
        extra={
            "strategy_type": "MOVING_AVERAGE",
            "ma_type": ma_type,
            "fast_window": fast_window,
            "slow_window": slow_window,
            "crossover_count": len(res.crossovers),
        }
    )

    fmt_lower = format.lower().strip()
    if fmt_lower == "json":
        data = res.model_dump(mode="json")
    else:
        # Standardized CSV according to Specification:
        # Timestamp, Price, Fast MA, Slow MA, Signal, Strategy Configuration
        headers = ["timestamp", "price", "fast_ma", "slow_ma", "signal", "strategy_configuration"]
        rows = [
            [
                p.timestamp,
                p.price,
                p.fast_ma if p.fast_ma is not None else "",
                p.slow_ma if p.slow_ma is not None else "",
                p.signal or "",
                strat_desc,
            ]
            for p in res.series
        ]
        data = {"headers": headers, "rows": rows}

    export_service = ExportService()
    date_part = f"{res.series[0].timestamp.strftime('%Y%m%d')}_{res.series[-1].timestamp.strftime('%Y%m%d')}" if res.series else "all"
    prefix = f"{res.summary.symbol}_strategy_{strat_desc}_{date_part}"
    return export_service.create_export_response(
        data=data,
        metadata=metadata,
        format_str=format,
        filename_prefix=prefix
    )

