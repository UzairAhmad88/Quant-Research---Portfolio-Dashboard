from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from app.repositories.market_data_repository import MarketDataRepository
from app.repositories.instrument_repository import InstrumentRepository
from app.models.market_data import OHLCV
from app.models.enums import DataFrequency
from app.schemas.market_data import OHLCVCreate

class MarketDataService:
    def __init__(self, db: Session):
        self.repo = MarketDataRepository(db)
        self.inst_repo = InstrumentRepository(db)

    def record_bar(self, data: OHLCVCreate) -> OHLCV:
        # Validate parent instrument exists
        instrument = self.inst_repo.get_by_id(data.instrument_id)
        if not instrument:
            raise ValueError(f"Parent instrument with ID '{data.instrument_id}' does not exist")

        # Validate OHLC bounds
        if data.high < data.open or data.high < data.close:
            raise ValueError(f"Invalid bar: High ({data.high}) must be >= Open ({data.open}) and Close ({data.close})")
        if data.low > data.open or data.low > data.close:
            raise ValueError(f"Invalid bar: Low ({data.low}) must be <= Open ({data.open}) and Close ({data.close})")

        return self.repo.insert_bar(data)

    def bulk_record_bars(self, bars: List[OHLCVCreate]) -> int:
        for b in bars:
            if b.high < b.open or b.high < b.close or b.low > b.open or b.low > b.close:
                raise ValueError(f"Invalid bar bounds for timestamp {b.timestamp}")
        return self.repo.bulk_insert_bars(bars)

    def get_historical_bars(
        self,
        instrument_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        frequency: DataFrequency = DataFrequency.DAILY,
        limit: int = 1000
    ) -> List[OHLCV]:
        return self.repo.get_bars(instrument_id, start_date, end_date, frequency, limit)

    def get_latest_observation(
        self,
        instrument_id: str,
        frequency: DataFrequency = DataFrequency.DAILY
    ) -> Optional[OHLCV]:
        return self.repo.get_latest_bar(instrument_id, frequency)
