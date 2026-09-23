from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.instrument import Instrument
from app.models.enums import AssetType
from app.schemas.instrument import InstrumentCreate, InstrumentUpdate

class InstrumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: InstrumentCreate) -> Instrument:
        instrument = Instrument(
            symbol=data.symbol.upper(),
            name=data.name,
            asset_type=data.asset_type,
            exchange=data.exchange,
            currency=data.currency,
            country=data.country,
            provider_symbol=data.provider_symbol,
            active=data.active,
            metadata_json=data.metadata_json,
        )
        self.db.add(instrument)
        self.db.commit()
        self.db.refresh(instrument)
        return instrument

    def get_by_id(self, instrument_id: str) -> Optional[Instrument]:
        return self.db.query(Instrument).filter(Instrument.id == instrument_id).first()

    def get_by_symbol(
        self,
        symbol: str,
        exchange: str = "UNKNOWN",
        asset_type: Optional[AssetType] = None
    ) -> Optional[Instrument]:
        query = self.db.query(Instrument).filter(
            Instrument.symbol == symbol.upper(),
            Instrument.exchange == exchange,
        )
        if asset_type:
            query = query.filter(Instrument.asset_type == asset_type)
        return query.first()

    def list_instruments(
        self,
        asset_type: Optional[AssetType] = None,
        active_only: bool = True,
        limit: int = 50,
        offset: int = 0
    ) -> List[Instrument]:
        query = self.db.query(Instrument)
        if active_only:
            query = query.filter(Instrument.active.is_(True))
        if asset_type:
            query = query.filter(Instrument.asset_type == asset_type)
        return query.order_by(Instrument.symbol.asc()).offset(offset).limit(limit).all()

    def update(self, instrument_id: str, data: InstrumentUpdate) -> Optional[Instrument]:
        instrument = self.get_by_id(instrument_id)
        if not instrument:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(instrument, key, value)

        self.db.commit()
        self.db.refresh(instrument)
        return instrument

    def deactivate(self, instrument_id: str) -> bool:
        instrument = self.get_by_id(instrument_id)
        if not instrument:
            return False
        instrument.active = False
        self.db.commit()
        return True
