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


@router.get("/export", status_code=status.HTTP_200_OK, summary="Export return analysis series in CSV or JSON format")
def export_return_analysis(
    instrument_id: str = Query(..., description="UUID of target instrument"),
    start_date: Optional[datetime] = Query(None, description="Start date filter (UTC ISO)"),
    end_date: Optional[datetime] = Query(None, description="End date filter (UTC ISO)"),
    price_source: str = Query("adjusted", description="Price series source: 'adjusted' or 'close'"),
    return_type: str = Query("simple", description="Primary return calculation: 'simple' or 'log'"),
    frequency: DataFrequency = Query(DataFrequency.DAILY, description="Observation bar frequency"),
    format: str = Query("csv", description="Export format: 'csv' or 'json'"),
    db: Session = Depends(get_db)
):
    if start_date and end_date and start_date > end_date:
        raise ValidationError("start_date cannot be after end_date")

    service = ReturnService(db)
    analysis = service.calculate_returns(
        instrument_id=instrument_id,
        start_date=start_date,
        end_date=end_date,
        price_source=price_source,
        return_type=return_type,
        frequency=frequency
    )

    from app.export import ExportService, ExportMetadata

    metadata = ExportMetadata(
        export_type="RETURNS",
        instrument=instrument_id,
        symbol=analysis.symbol,
        date_range=f"{start_date.isoformat() if start_date else 'START'}_{end_date.isoformat() if end_date else 'END'}",
        frequency=frequency.value if hasattr(frequency, 'value') else str(frequency),
        price_source=price_source,
        extra={
            "return_type": return_type,
            "annualized_return": analysis.summary.annualized_return,
            "period_return": analysis.summary.period_return,
            "cumulative_return": analysis.summary.cumulative_return,
        }
    )

    fmt_lower = format.lower().strip()
    if fmt_lower == "json":
        data = analysis.model_dump(mode="json")
    else:
        # Standardized CSV according to Specification: Date, Price, Simple Return, Log Return, Cumulative Return
        headers = ["date", "price", "simple_return", "log_return", "cumulative_return"]
        rows = [
            [
                p.timestamp,
                p.price,
                p.simple_return,
                p.log_return,
                p.cumulative_return,
            ]
            for p in analysis.series
        ]
        data = {"headers": headers, "rows": rows}

    export_service = ExportService()
    date_part = f"{analysis.series[0].timestamp.strftime('%Y%m%d')}_{analysis.series[-1].timestamp.strftime('%Y%m%d')}" if analysis.series else "all"
    prefix = f"{analysis.symbol}_returns_{price_source}_{return_type}_{date_part}"
    return export_service.create_export_response(
        data=data,
        metadata=metadata,
        format_str=format,
        filename_prefix=prefix
    )

