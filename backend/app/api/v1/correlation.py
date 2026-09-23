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
