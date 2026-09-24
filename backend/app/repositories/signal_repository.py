import hashlib
import json
from datetime import datetime
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_

from app.models.strategy import StrategyConfiguration, SignalEvent
from app.models.enums import SignalType, SignalState, SignalSource, StrategyType


class SignalRepository:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def generate_config_hash(
        strategy_type: str,
        instrument_id: str,
        parameters: Dict[str, Any]
    ) -> str:
        """
        Generates a deterministic SHA256 hash for a strategy configuration.
        """
        raw_key = f"{strategy_type.upper().strip()}:{instrument_id}:{json.dumps(parameters, sort_keys=True)}"
        return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    def get_or_create_configuration(
        self,
        instrument_id: str,
        strategy_type: str = "MOVING_AVERAGE",
        ma_type: Optional[str] = "SMA",
        fast_window: Optional[int] = 20,
        slow_window: Optional[int] = 50,
        price_source: Optional[str] = "adjusted",
        custom_params: Optional[Dict[str, Any]] = None
    ) -> StrategyConfiguration:
        """
        Fetches or creates a unique StrategyConfiguration row.
        """
        clean_strategy_type = strategy_type.upper().strip()
        params = custom_params or {
            "ma_type": (ma_type or "SMA").upper().strip(),
            "fast_window": fast_window,
            "slow_window": slow_window,
            "price_source": (price_source or "adjusted").lower().strip()
        }

        config_hash = self.generate_config_hash(clean_strategy_type, instrument_id, params)

        existing = (
            self.db.query(StrategyConfiguration)
            .filter(
                StrategyConfiguration.instrument_id == instrument_id,
                StrategyConfiguration.strategy_type == clean_strategy_type,
                StrategyConfiguration.configuration_hash == config_hash
            )
            .first()
        )
        if existing:
            return existing

        new_config = StrategyConfiguration(
            strategy_type=clean_strategy_type,
            instrument_id=instrument_id,
            configuration_hash=config_hash,
            ma_type=params.get("ma_type"),
            fast_window=params.get("fast_window"),
            slow_window=params.get("slow_window"),
            price_source=params.get("price_source"),
            configuration_json=params,
            active=True
        )
        self.db.add(new_config)
        self.db.commit()
        self.db.refresh(new_config)
        return new_config

    def get_configuration_by_id(self, config_id: str) -> Optional[StrategyConfiguration]:
        return self.db.query(StrategyConfiguration).filter(StrategyConfiguration.id == config_id).first()

    def bulk_create_signals(
        self,
        strategy_configuration_id: str,
        instrument_id: str,
        signals_data: List[Dict[str, Any]]
    ) -> Tuple[int, int]:
        """
        Idempotently inserts signal events in bulk.
        
        Args:
            strategy_configuration_id: Target strategy config UUID.
            instrument_id: Instrument UUID.
            signals_data: List of dicts containing:
                - timestamp: datetime
                - signal_type: str ('BUY', 'SELL')
                - signal_state: str ('BULLISH', 'BEARISH')
                - price: float
                - source: optional str
                - metadata: optional dict
                
        Returns:
            Tuple[created_count, skipped_duplicate_count]
        """
        if not signals_data:
            return 0, 0

        # Query existing timestamps for this configuration to enforce idempotency
        timestamps = [s["timestamp"] for s in signals_data]
        existing_rows = (
            self.db.query(SignalEvent.timestamp, SignalEvent.signal_type)
            .filter(
                SignalEvent.strategy_configuration_id == strategy_configuration_id,
                SignalEvent.timestamp.in_(timestamps)
            )
            .all()
        )
        existing_keys = {(row.timestamp, row.signal_type) for row in existing_rows}

        new_signal_objects = []
        skipped_count = 0

        for s in signals_data:
            ts = s["timestamp"]
            sig_type = str(s["signal_type"]).upper().strip()
            
            if (ts, sig_type) in existing_keys:
                skipped_count += 1
                continue

            existing_keys.add((ts, sig_type))
            
            sig_obj = SignalEvent(
                strategy_configuration_id=strategy_configuration_id,
                instrument_id=instrument_id,
                timestamp=ts,
                signal_type=sig_type,
                signal_state=str(s.get("signal_state", "BULLISH" if sig_type == "BUY" else "BEARISH")).upper().strip(),
                price=s["price"],
                source=s.get("source", "STRATEGY_ENGINE"),
                metadata_json=s.get("metadata")
            )
            new_signal_objects.append(sig_obj)

        if new_signal_objects:
            self.db.bulk_save_objects(new_signal_objects)
            self.db.commit()

        return len(new_signal_objects), skipped_count

    def get_signals(
        self,
        instrument_id: Optional[str] = None,
        strategy_type: Optional[str] = None,
        strategy_configuration_id: Optional[str] = None,
        signal_type: Optional[str] = None,
        signal_state: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Tuple[List[SignalEvent], int]:
        """
        Queries standardized signal events with filtering and pagination.
        
        Returns:
            Tuple[List[SignalEvent], total_count]
        """
        query = self.db.query(SignalEvent).options(joinedload(SignalEvent.configuration))

        if instrument_id:
            query = query.filter(SignalEvent.instrument_id == instrument_id)
        if strategy_configuration_id:
            query = query.filter(SignalEvent.strategy_configuration_id == strategy_configuration_id)
        if signal_type:
            query = query.filter(SignalEvent.signal_type == signal_type.upper().strip())
        if signal_state:
            query = query.filter(SignalEvent.signal_state == signal_state.upper().strip())
        if start_date:
            query = query.filter(SignalEvent.timestamp >= start_date)
        if end_date:
            query = query.filter(SignalEvent.timestamp <= end_date)

        if strategy_type:
            query = query.join(SignalEvent.configuration).filter(
                StrategyConfiguration.strategy_type == strategy_type.upper().strip()
            )

        total_count = query.count()
        signals = query.order_by(SignalEvent.timestamp.desc()).offset(offset).limit(limit).all()

        return signals, total_count

    def get_signal_by_id(self, signal_id: str) -> Optional[SignalEvent]:
        return (
            self.db.query(SignalEvent)
            .options(joinedload(SignalEvent.configuration))
            .filter(SignalEvent.id == signal_id)
            .first()
        )

    def delete_signals_for_configuration(
        self,
        strategy_configuration_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> int:
        """
        Deletes signals for a specific strategy configuration within a date range (for recomputation/rebuilding).
        """
        query = self.db.query(SignalEvent).filter(
            SignalEvent.strategy_configuration_id == strategy_configuration_id
        )
        if start_date:
            query = query.filter(SignalEvent.timestamp >= start_date)
        if end_date:
            query = query.filter(SignalEvent.timestamp <= end_date)

        deleted_count = query.delete(synchronize_session=False)
        self.db.commit()
        return deleted_count
