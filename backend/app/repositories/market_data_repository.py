from datetime import datetime, timezone
from typing import List, Optional, Set, Tuple, Dict


from sqlalchemy import func
from sqlalchemy.orm import Session
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
        instrument_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        frequency: DataFrequency = DataFrequency.DAILY,
        provider: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[OHLCV]:
        query = self.db.query(OHLCV)
        if instrument_id:
            query = query.filter(OHLCV.instrument_id == instrument_id)
        if frequency:
            query = query.filter(OHLCV.frequency == frequency)
        if provider:
            query = query.filter(OHLCV.provider == provider)
        if start_date:
            query = query.filter(OHLCV.timestamp >= start_date)
        if end_date:
            query = query.filter(OHLCV.timestamp <= end_date)

        return query.order_by(OHLCV.timestamp.asc()).offset(offset).limit(limit).all()

    def get_bars_batch(
        self,
        instrument_ids: List[str],
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        frequency: DataFrequency = DataFrequency.DAILY,
        provider: Optional[str] = None,
    ) -> Dict[str, List[OHLCV]]:
        if not instrument_ids:
            return {}
        query = self.db.query(OHLCV).filter(
            OHLCV.instrument_id.in_(instrument_ids),
            OHLCV.frequency == frequency
        )
        if provider:
            query = query.filter(OHLCV.provider == provider)
        if start_date:
            query = query.filter(OHLCV.timestamp >= start_date)
        if end_date:
            query = query.filter(OHLCV.timestamp <= end_date)

        rows = query.order_by(OHLCV.instrument_id, OHLCV.timestamp.asc()).all()
        result: Dict[str, List[OHLCV]] = {i_id: [] for i_id in instrument_ids}
        for bar in rows:
            result[bar.instrument_id].append(bar)
        return result

    def get_price_series(
        self,
        instrument_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        frequency: DataFrequency = DataFrequency.DAILY,
        price_source: str = "adjusted"
    ) -> List[Tuple[datetime, float]]:
        """
        Optimized column-selected query returning only (timestamp, target_price).
        Avoids loading full ORM entity objects and unnecessary columns.
        """
        cols = [OHLCV.timestamp, OHLCV.close]
        if price_source == "adjusted":
            cols.append(OHLCV.adjusted_close)
        
        query = self.db.query(*cols).filter(
            OHLCV.instrument_id == instrument_id,
            OHLCV.frequency == frequency
        )
        if start_date:
            query = query.filter(OHLCV.timestamp >= start_date)
        if end_date:
            query = query.filter(OHLCV.timestamp <= end_date)

        rows = query.order_by(OHLCV.timestamp.asc()).all()
        series = []
        if price_source == "adjusted":
            for ts, close_val, adj_close_val in rows:
                p = float(adj_close_val) if adj_close_val is not None else float(close_val)
                series.append((ts, p))
        else:
            for ts, close_val in rows:
                series.append((ts, float(close_val)))
        return series

    def count_bars(
        self,
        instrument_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        frequency: DataFrequency = DataFrequency.DAILY,
        provider: Optional[str] = None
    ) -> int:
        query = self.db.query(OHLCV)
        if instrument_id:
            query = query.filter(OHLCV.instrument_id == instrument_id)
        if frequency:
            query = query.filter(OHLCV.frequency == frequency)
        if provider:
            query = query.filter(OHLCV.provider == provider)
        if start_date:
            query = query.filter(OHLCV.timestamp >= start_date)
        if end_date:
            query = query.filter(OHLCV.timestamp <= end_date)
        return query.count()

    def get_observation_counts_batch(
        self,
        instrument_ids: List[str],
        frequency: DataFrequency = DataFrequency.DAILY
    ) -> Dict[str, int]:
        if not instrument_ids:
            return {}
        counts = (
            self.db.query(
                OHLCV.instrument_id,
                func.count(OHLCV.id)
            )
            .filter(OHLCV.instrument_id.in_(instrument_ids), OHLCV.frequency == frequency)
            .group_by(OHLCV.instrument_id)
            .all()
        )
        res = {i_id: 0 for i_id in instrument_ids}
        for inst_id, c in counts:
            res[inst_id] = c
        return res

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

    def get_recent_bars(
        self,
        instrument_id: str,
        limit: int = 2,
        frequency: DataFrequency = DataFrequency.DAILY
    ) -> List[OHLCV]:
        return (
            self.db.query(OHLCV)
            .filter(OHLCV.instrument_id == instrument_id, OHLCV.frequency == frequency)
            .order_by(OHLCV.timestamp.desc())
            .limit(limit)
            .all()
        )

    def get_latest_bars_batch(
        self,
        instrument_ids: List[str],
        frequency: DataFrequency = DataFrequency.DAILY
    ) -> Dict[str, OHLCV]:
        if not instrument_ids:
            return {}
        # Single grouped query to find latest bar per instrument
        subq = (
            self.db.query(
                OHLCV.instrument_id,
                func.max(OHLCV.timestamp).label("max_ts")
            )
            .filter(OHLCV.instrument_id.in_(instrument_ids), OHLCV.frequency == frequency)
            .group_by(OHLCV.instrument_id)
            .subquery()
        )
        bars = (
            self.db.query(OHLCV)
            .join(
                subq,
                (OHLCV.instrument_id == subq.c.instrument_id) & (OHLCV.timestamp == subq.c.max_ts)
            )
            .filter(OHLCV.frequency == frequency)
            .all()
        )
        return {b.instrument_id: b for b in bars}

    def insert_bar_idempotent(self, data: OHLCVCreate) -> Tuple[OHLCV, bool]:
        existing = (
            self.db.query(OHLCV)
            .filter(
                OHLCV.instrument_id == data.instrument_id,
                OHLCV.timestamp == data.timestamp,
                OHLCV.frequency == data.frequency,
                OHLCV.provider == data.provider
            )
            .first()
        )
        if existing:
            # Update fields if new data received
            existing.open = data.open
            existing.high = data.high
            existing.low = data.low
            existing.close = data.close
            existing.adjusted_close = data.adjusted_close
            existing.volume = data.volume
            existing.provider_symbol = data.provider_symbol
            existing.retrieved_at = datetime.now(timezone.utc)
            self.db.commit()
            self.db.refresh(existing)
            return existing, False

        new_bar = self.insert_bar(data)
        return new_bar, True


    def get_existing_timestamps(
        self,
        instrument_id: str,
        frequency: DataFrequency,
        start_date: datetime,
        end_date: datetime
    ) -> Set[datetime]:
        rows = (
            self.db.query(OHLCV.timestamp)
            .filter(
                OHLCV.instrument_id == instrument_id,
                OHLCV.frequency == frequency,
                OHLCV.timestamp >= start_date,
                OHLCV.timestamp <= end_date
            )
            .all()
        )
        result = set()
        for r in rows:
            ts = r[0]
            if isinstance(ts, str):
                try:
                    ts = datetime.fromisoformat(ts)
                except Exception:
                    continue
            if isinstance(ts, datetime):
                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=timezone.utc)
                else:
                    ts = ts.astimezone(timezone.utc)
                result.add(ts)
        return result


    def get_date_bounds(
        self,
        instrument_id: str,
        frequency: DataFrequency = DataFrequency.DAILY
    ) -> Tuple[Optional[datetime], Optional[datetime]]:
        min_ts = (
            self.db.query(OHLCV.timestamp)
            .filter(OHLCV.instrument_id == instrument_id, OHLCV.frequency == frequency)
            .order_by(OHLCV.timestamp.asc())
            .first()
        )
        max_ts = (
            self.db.query(OHLCV.timestamp)
            .filter(OHLCV.instrument_id == instrument_id, OHLCV.frequency == frequency)
            .order_by(OHLCV.timestamp.desc())
            .first()
        )
        return (min_ts[0] if min_ts else None, max_ts[0] if max_ts else None)
