from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.models.market_data import OHLCV
from app.models.enums import DataFrequency
from app.schemas.market_data import OHLCVCreate

class MarketDataRepository:
    def __init__(self, db: Session):
        self.db = db

    def insert_bar(self, data: OHLCVCreate) -> OHLCV:
        bar = OHLCV(
            instrument_id=data.instrument_id,
            timestamp=data.timestamp,
            frequency=data.frequency,
            open=data.open,
            high=data.high,
            low=data.low,
            close=data.close,
            adjusted_close=data.adjusted_close,
            volume=data.volume,
            provider=data.provider,
            provider_symbol=data.provider_symbol,
        )
        self.db.add(bar)
        self.db.commit()
        self.db.refresh(bar)
        return bar

    def bulk_insert_bars(self, bars_data: List[OHLCVCreate]) -> int:
        if not bars_data:
            return 0

        bar_objects = [
            OHLCV(
                instrument_id=b.instrument_id,
                timestamp=b.timestamp,
                frequency=b.frequency,
                open=b.open,
                high=b.high,
                low=b.low,
                close=b.close,
                adjusted_close=b.adjusted_close,
                volume=b.volume,
                provider=b.provider,
                provider_symbol=b.provider_symbol,
            )
            for b in bars_data
        ]
        
        try:
            self.db.bulk_save_objects(bar_objects)
            self.db.commit()
            return len(bar_objects)
        except Exception:
            self.db.rollback()
            raise

    def get_bars(
        self,
        instrument_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        frequency: DataFrequency = DataFrequency.DAILY,
        limit: int = 1000
    ) -> List[OHLCV]:
        query = self.db.query(OHLCV).filter(
            OHLCV.instrument_id == instrument_id,
            OHLCV.frequency == frequency
        )

        if start_date:
            query = query.filter(OHLCV.timestamp >= start_date)
        if end_date:
            query = query.filter(OHLCV.timestamp <= end_date)

        return query.order_by(OHLCV.timestamp.asc()).limit(limit).all()

    def get_latest_bar(
        self,
        instrument_id: str,
        frequency: DataFrequency = DataFrequency.DAILY
    ) -> Optional[OHLCV]:
        return (
            self.db.query(OHLCV)
            .filter(OHLCV.instrument_id == instrument_id, OHLCV.frequency == frequency)
            .order_by(OHLCV.timestamp.desc())
            .first()
        )
