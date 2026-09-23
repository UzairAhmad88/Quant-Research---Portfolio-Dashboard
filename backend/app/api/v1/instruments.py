from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.instrument_service import InstrumentService
from app.schemas.instrument import InstrumentCreate, InstrumentUpdate, InstrumentResponse
from app.schemas.common import PaginatedResponse
from app.models.enums import AssetType
from app.core.exceptions import NotFoundError, ConflictError

router = APIRouter()

@router.get("", response_model=PaginatedResponse[InstrumentResponse], status_code=status.HTTP_200_OK)
def list_instruments(
    asset_type: Optional[AssetType] = Query(None, description="Filter by asset class"),
    symbol: Optional[str] = Query(None, description="Filter by ticker symbol prefix"),
    exchange: Optional[str] = Query(None, description="Filter by exchange venue"),
    active: bool = Query(True, description="Filter active instruments only"),
    limit: int = Query(50, ge=1, le=500, description="Max items per page"),
    offset: int = Query(0, ge=0, description="Page offset cursor"),
    db: Session = Depends(get_db)
):
    service = InstrumentService(db)
    instruments = service.list_instruments(asset_type=asset_type, active_only=active, limit=limit, offset=offset)
    
    # Filter by symbol prefix if specified
    if symbol:
        instruments = [i for i in instruments if i.symbol.startswith(symbol.upper())]
    if exchange:
        instruments = [i for i in instruments if i.exchange == exchange]

    total_count = len(instruments)
    return PaginatedResponse(
        items=[InstrumentResponse.model_validate(i) for i in instruments],
        total=total_count,
        limit=limit,
        offset=offset
    )

@router.get("/{instrument_id}", response_model=InstrumentResponse, status_code=status.HTTP_200_OK)
def get_instrument_by_id(instrument_id: str, db: Session = Depends(get_db)):
    service = InstrumentService(db)
    instrument = service.get_instrument(instrument_id)
    if not instrument:
        raise NotFoundError(f"Instrument with ID '{instrument_id}' was not found.")
    return InstrumentResponse.model_validate(instrument)

@router.post("", response_model=InstrumentResponse, status_code=status.HTTP_201_CREATED)
def create_instrument(payload: InstrumentCreate, db: Session = Depends(get_db)):
    service = InstrumentService(db)
    try:
        instrument = service.register_instrument(payload)
        return InstrumentResponse.model_validate(instrument)
    except ValueError as e:
        raise ConflictError(message=str(e))

@router.patch("/{instrument_id}", response_model=InstrumentResponse, status_code=status.HTTP_200_OK)
def update_instrument(instrument_id: str, payload: InstrumentUpdate, db: Session = Depends(get_db)):
    service = InstrumentService(db)
    updated = service.update_instrument(instrument_id, payload)
    if not updated:
        raise NotFoundError(f"Instrument with ID '{instrument_id}' was not found for update.")
    return InstrumentResponse.model_validate(updated)
