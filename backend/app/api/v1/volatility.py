from datetime import datetime
from typing import Optional, List, Union
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.volatility_service import VolatilityService
from app.schemas.volatility import SingleVolatilityResponse, MultiVolatilityResponse
from app.core.exceptions import ValidationError

router = APIRouter(prefix="/volatility", tags=["volatility"])


@router.get(
    "",
    response_model=Union[SingleVolatilityResponse, MultiVolatilityResponse],
    summary="Calculate historical and rolling volatility metrics"
)
def get_volatility_analytics(
    instrument_id: Optional[str] = Query(None, description="Single instrument ID for detailed analysis"),
    instrument_ids: Optional[List[str]] = Query(None, description="List of instrument IDs for comparison"),
    start_date: Optional[datetime] = Query(None, description="Start date filter (UTC)"),
    end_date: Optional[datetime] = Query(None, description="End date filter (UTC)"),
    price_source: str = Query("adjusted", description="'adjusted' or 'close'"),
    return_type: str = Query("simple", description="'simple' or 'log'"),
    rolling_window: int = Query(20, description="Rolling window observation size (e.g. 10, 20, 30, 60, 90, 120, 252)"),
    annualized: bool = Query(True, description="Whether rolling volatility values should be annualized"),
    db: Session = Depends(get_db)
):
    service = VolatilityService(db)

    # Resolve target instrument IDs
    target_ids: List[str] = []
    if instrument_ids:
        for item in instrument_ids:
            # Handle comma-separated query parameters
            for part in item.split(","):
                cleaned = part.strip()
                if cleaned and cleaned not in target_ids:
                    target_ids.append(cleaned)
    elif instrument_id:
        target_ids.append(instrument_id.strip())

    if not target_ids:
        raise ValidationError("At least one 'instrument_id' or 'instrument_ids' parameter must be provided.")

    if len(target_ids) == 1:
        return service.get_single_volatility(
            instrument_id=target_ids[0],
            start_date=start_date,
            end_date=end_date,
            price_source=price_source,
            return_type=return_type,
            rolling_window=rolling_window,
            annualized=annualized
        )

    return service.get_multi_volatility(
        instrument_ids=target_ids,
        start_date=start_date,
        end_date=end_date,
        price_source=price_source,
        return_type=return_type
    )


@router.get("/export", status_code=200, summary="Export historical volatility metrics or rolling series in CSV or JSON format")
def export_volatility(
    instrument_id: str = Query(..., description="Target instrument UUID"),
    data_type: str = Query("rolling", description="'rolling' or 'summary'"),
    format: str = Query("csv", description="Export format: 'csv' or 'json'"),
    start_date: Optional[datetime] = Query(None, description="Start date filter (UTC)"),
    end_date: Optional[datetime] = Query(None, description="End date filter (UTC)"),
    price_source: str = Query("adjusted", description="'adjusted' or 'close'"),
    return_type: str = Query("simple", description="'simple' or 'log'"),
    rolling_window: int = Query(20, description="Rolling window observation size"),
    annualized: bool = Query(True, description="Whether rolling volatility values should be annualized"),
    db: Session = Depends(get_db)
):
    from app.export import ExportService, ExportMetadata

    service = VolatilityService(db)
    res = service.get_single_volatility(
        instrument_id=instrument_id,
        start_date=start_date,
        end_date=end_date,
        price_source=price_source,
        return_type=return_type,
        rolling_window=rolling_window,
        annualized=annualized
    )

    metadata = ExportMetadata(
        export_type=f"VOLATILITY_{data_type.upper()}",
        instrument=instrument_id,
        symbol=res.symbol,
        date_range=f"{start_date.isoformat() if start_date else 'START'}_{end_date.isoformat() if end_date else 'END'}",
        price_source=price_source,
        extra={
            "return_type": return_type,
            "rolling_window": rolling_window,
            "annualized": annualized,
        }
    )

    fmt_lower = format.lower().strip()
    if fmt_lower == "json":
        data = res.model_dump(mode="json")
    else:
        if data_type == "summary":
            headers = ["metric", "value"]
            rows = [
                ["Instrument", res.symbol],
                ["Asset Type", res.asset_type],
                ["Price Source", res.price_source],
                ["Return Type", res.return_type],
                ["Annualization Factor", res.summary.annualization_factor],
                ["Daily Volatility", res.summary.daily_volatility if res.summary.daily_volatility is not None else ""],
                ["Annualized Volatility", res.summary.annualized_volatility if res.summary.annualized_volatility is not None else ""],
                ["Observation Count", res.summary.observation_count],
            ]
        else:
            # Default Rolling volatility: Date, Daily Volatility, Annualized Volatility
            headers = ["date", "rolling_volatility"]
            rows = [
                [p.timestamp, p.rolling_volatility if p.rolling_volatility is not None else ""]
                for p in res.rolling_series
            ]
        data = {"headers": headers, "rows": rows}

    export_service = ExportService()
    date_part = f"{res.rolling_series[0].timestamp.strftime('%Y%m%d')}_{res.rolling_series[-1].timestamp.strftime('%Y%m%d')}" if res.rolling_series else "all"
    prefix = f"{res.symbol}_volatility_{data_type}_{rolling_window}w_{date_part}"
    return export_service.create_export_response(
        data=data,
        metadata=metadata,
        format_str=format,
        filename_prefix=prefix
    )

