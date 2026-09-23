from typing import List, Optional
from sqlalchemy.orm import Session
from app.repositories.instrument_repository import InstrumentRepository
from app.models.instrument import Instrument
from app.models.enums import AssetType
from app.schemas.instrument import InstrumentCreate, InstrumentUpdate

class InstrumentService:
    def __init__(self, db: Session):
        self.repo = InstrumentRepository(db)

    def register_instrument(self, data: InstrumentCreate) -> Instrument:
        existing = self.repo.get_by_symbol(data.symbol, data.exchange, data.asset_type)
        if existing:
            raise ValueError(
                f"Instrument {data.symbol} on {data.exchange} with type {data.asset_type} already exists"
            )
        return self.repo.create(data)

    def get_instrument(self, instrument_id: str) -> Optional[Instrument]:
        return self.repo.get_by_id(instrument_id)

    def list_instruments(
        self,
        asset_type: Optional[AssetType] = None,
        active_only: bool = True,
        limit: int = 50,
        offset: int = 0
    ) -> List[Instrument]:
        return self.repo.list_instruments(asset_type, active_only, limit, offset)

    def update_instrument(self, instrument_id: str, data: InstrumentUpdate) -> Optional[Instrument]:
        return self.repo.update(instrument_id, data)

    def deactivate_instrument(self, instrument_id: str) -> bool:
        return self.repo.deactivate(instrument_id)
