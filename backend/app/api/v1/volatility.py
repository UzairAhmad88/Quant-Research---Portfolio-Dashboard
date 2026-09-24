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
