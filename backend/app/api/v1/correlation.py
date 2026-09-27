from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.correlation_service import CorrelationService
from app.schemas.correlation import (
    CorrelationMatrixResponse,
    CorrelationPairwiseResponse,
    RollingCorrelationResponse,
)

router = APIRouter(prefix="/correlation", tags=["correlation"])

@router.get("", response_model=CorrelationMatrixResponse)
def get_correlation_matrix(
    instrument_ids: List[str] = Query(..., description="List of instrument UUIDs (min 2, max 20)"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    return_type: str = Query("simple", description="Return type: 'simple' or 'log'"),
    price_source: str = Query("adjusted", description="Price source: 'adjusted' or 'close'"),
    alignment_mode: str = Query("pairwise_complete", description="Alignment mode: 'pairwise_complete' or 'common_intersection'"),
    db: Session = Depends(get_db),
):
    service = CorrelationService(db)
    return service.calculate_matrix(
        instrument_ids=instrument_ids,
        start_date=start_date,
        end_date=end_date,
        return_type=return_type,
        price_source=price_source,
        alignment_mode=alignment_mode,
    )

@router.get("/pair", response_model=CorrelationPairwiseResponse)
def get_pairwise_correlation(
    instrument_a: str = Query(..., description="UUID of Instrument A"),
    instrument_b: str = Query(..., description="UUID of Instrument B"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    return_type: str = Query("simple", description="Return type: 'simple' or 'log'"),
    price_source: str = Query("adjusted", description="Price source: 'adjusted' or 'close'"),
    db: Session = Depends(get_db),
):
    service = CorrelationService(db)
    return service.calculate_pairwise(
        instrument_a_id=instrument_a,
        instrument_b_id=instrument_b,
        start_date=start_date,
        end_date=end_date,
        return_type=return_type,
        price_source=price_source,
    )

@router.get("/rolling", response_model=RollingCorrelationResponse)
def get_rolling_correlation(
    instrument_a: str = Query(..., description="UUID of Instrument A"),
    instrument_b: str = Query(..., description="UUID of Instrument B"),
    window: int = Query(60, ge=5, le=500, description="Rolling window size in observations"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    return_type: str = Query("simple", description="Return type: 'simple' or 'log'"),
    price_source: str = Query("adjusted", description="Price source: 'adjusted' or 'close'"),
    db: Session = Depends(get_db),
):
    service = CorrelationService(db)
    return service.calculate_rolling(
        instrument_a_id=instrument_a,
        instrument_b_id=instrument_b,
        window=window,
        start_date=start_date,
        end_date=end_date,
        return_type=return_type,
        price_source=price_source,
    )


@router.get("/export", status_code=status.HTTP_200_OK, summary="Export correlation matrix, pairwise, or rolling series in CSV or JSON format")
def export_correlation(
    instrument_ids: Optional[List[str]] = Query(None, description="List of instrument UUIDs for matrix"),
    instrument_a: Optional[str] = Query(None, description="UUID of Instrument A for pairwise/rolling"),
    instrument_b: Optional[str] = Query(None, description="UUID of Instrument B for pairwise/rolling"),
    window: int = Query(60, ge=5, le=500, description="Rolling window size"),
    data_type: str = Query("matrix", description="'matrix', 'pairwise', or 'rolling'"),
    format: str = Query("csv", description="Export format: 'csv' or 'json'"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    return_type: str = Query("simple", description="Return type: 'simple' or 'log'"),
    price_source: str = Query("adjusted", description="Price source: 'adjusted' or 'close'"),
    alignment_mode: str = Query("pairwise_complete", description="Alignment mode"),
    db: Session = Depends(get_db),
):
    from app.export import ExportService, ExportMetadata

    service = CorrelationService(db)
    export_service = ExportService()
    fmt_lower = format.lower().strip()

    metadata = ExportMetadata(
        export_type=f"CORRELATION_{data_type.upper()}",
        date_range=f"{start_date.isoformat() if start_date else 'START'}_{end_date.isoformat() if end_date else 'END'}",
        price_source=price_source,
        extra={
            "return_type": return_type,
            "alignment_mode": alignment_mode,
        }
    )

    if data_type == "rolling":
        if not instrument_a or not instrument_b:
            from app.core.exceptions import ValidationError
            raise ValidationError("Rolling correlation export requires 'instrument_a' and 'instrument_b'.")
        rolling_res = service.calculate_rolling(
            instrument_a_id=instrument_a,
            instrument_b_id=instrument_b,
            window=window,
            start_date=start_date,
            end_date=end_date,
            return_type=return_type,
            price_source=price_source,
        )
        if fmt_lower == "json":
            data = rolling_res.model_dump(mode="json")
        else:
            headers = ["date", "correlation", "instrument_a", "instrument_b", "window"]
            rows = [
                [p.date, p.correlation, rolling_res.symbol_a, rolling_res.symbol_b, window]
                for p in rolling_res.series
            ]
            data = {"headers": headers, "rows": rows}
        prefix = f"correlation_rolling_{rolling_res.symbol_a}_{rolling_res.symbol_b}_{window}w"

    elif data_type == "pairwise":
        if not instrument_a or not instrument_b:
            from app.core.exceptions import ValidationError
            raise ValidationError("Pairwise correlation export requires 'instrument_a' and 'instrument_b'.")
        pairwise_res = service.calculate_pairwise(
            instrument_a_id=instrument_a,
            instrument_b_id=instrument_b,
            start_date=start_date,
            end_date=end_date,
            return_type=return_type,
            price_source=price_source,
        )
        if fmt_lower == "json":
            data = pairwise_res.model_dump(mode="json")
        else:
            headers = ["instrument_a", "instrument_b", "symbol_a", "symbol_b", "correlation", "observation_count"]
            rows = [[
                pairwise_res.instrument_a_id,
                pairwise_res.instrument_b_id,
                pairwise_res.symbol_a,
                pairwise_res.symbol_b,
                pairwise_res.correlation,
                pairwise_res.observation_count
            ]]
            data = {"headers": headers, "rows": rows}
        prefix = f"correlation_pair_{pairwise_res.symbol_a}_{pairwise_res.symbol_b}"

    else:
        # Default Matrix
        if not instrument_ids or len(instrument_ids) < 2:
            from app.core.exceptions import ValidationError
            raise ValidationError("Matrix correlation export requires at least 2 'instrument_ids'.")
        matrix_res = service.calculate_matrix(
            instrument_ids=instrument_ids,
            start_date=start_date,
            end_date=end_date,
            return_type=return_type,
            price_source=price_source,
            alignment_mode=alignment_mode,
        )
        if fmt_lower == "json":
            data = matrix_res.model_dump(mode="json")
        else:
            # Clean Matrix format:
            #         AAPL   MSFT   SPY
            # AAPL    1.00   0.82   0.71
            # MSFT    0.82   1.00   0.75
            # SPY     0.71   0.75   1.00
            headers = [""] + matrix_res.symbols
            rows = []
            for i, sym in enumerate(matrix_res.symbols):
                row = [sym] + [matrix_res.matrix[i][j] for j in range(len(matrix_res.symbols))]
                rows.append(row)
            data = {"headers": headers, "rows": rows}
        prefix = f"correlation_matrix_{len(matrix_res.symbols)}assets"

    return export_service.create_export_response(
        data=data,
        metadata=metadata,
        format_str=format,
        filename_prefix=prefix
    )

