from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.repositories.signal_repository import SignalRepository
from app.repositories.instrument_repository import InstrumentRepository
from app.schemas.signal import SignalEventResponse, SignalListResponse
from app.core.exceptions import NotFoundError, ValidationError


class SignalService:
    def __init__(self, db: Session):
        self.db = db
        self.signal_repo = SignalRepository(db)
        self.inst_repo = InstrumentRepository(db)

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
    ) -> SignalListResponse:
        if limit <= 0 or limit > 1000:
            raise ValidationError("Limit must be between 1 and 1000.")
        if offset < 0:
            raise ValidationError("Offset cannot be negative.")

        if instrument_id and not self.inst_repo.get_by_id(instrument_id):
            raise NotFoundError(f"Instrument with ID '{instrument_id}' was not found.")

        if signal_type:
            clean_type = signal_type.upper().strip()
            if clean_type not in ("BUY", "SELL"):
                raise ValidationError("Signal type filter must be either 'BUY' or 'SELL'.")

        if signal_state:
            clean_state = signal_state.upper().strip()
            if clean_state not in ("BULLISH", "BEARISH", "NEUTRAL"):
                raise ValidationError("Signal state filter must be 'BULLISH', 'BEARISH', or 'NEUTRAL'.")

        signals, total = self.signal_repo.get_signals(
            instrument_id=instrument_id,
            strategy_type=strategy_type,
            strategy_configuration_id=strategy_configuration_id,
            signal_type=signal_type,
            signal_state=signal_state,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset
        )

        items = [SignalEventResponse.model_validate(s) for s in signals]
        for idx, s_model in enumerate(items):
            if signals[idx].configuration:
                s_model.strategy_type = signals[idx].configuration.strategy_type

        return SignalListResponse(
            items=items,
            total=total,
            limit=limit,
            offset=offset
        )

    def get_signal_by_id(self, signal_id: str) -> SignalEventResponse:
        signal = self.signal_repo.get_signal_by_id(signal_id)
        if not signal:
            raise NotFoundError(f"Signal with ID '{signal_id}' was not found.")

        res = SignalEventResponse.model_validate(signal)
        if signal.configuration:
            res.strategy_type = signal.configuration.strategy_type
        return res

    def persist_moving_average_signals(
        self,
        instrument_id: str,
        crossovers: List[Dict[str, Any]],
        ma_type: str,
        fast_window: int,
        slow_window: int,
        price_source: str
    ) -> Tuple[str, int, int]:
        """
        Idempotently registers strategy configuration and persists standardized signal events.
        
        Returns:
            Tuple[strategy_configuration_id, created_count, skipped_count]
        """
        config = self.signal_repo.get_or_create_configuration(
            instrument_id=instrument_id,
            strategy_type="MOVING_AVERAGE",
            ma_type=ma_type,
            fast_window=fast_window,
            slow_window=slow_window,
            price_source=price_source
        )

        signals_payload = []
        for c in crossovers:
            sig_type = str(c.get("signal", "BUY")).upper().strip()
            sig_state = "BULLISH" if sig_type == "BUY" else "BEARISH"
            
            signals_payload.append({
                "timestamp": c["timestamp"],
                "signal_type": sig_type,
                "signal_state": sig_state,
                "price": float(c["price"]),
                "source": "STRATEGY_ENGINE",
                "metadata": {
                    "fast_ma": float(c["fast_ma"]) if c.get("fast_ma") is not None else None,
                    "slow_ma": float(c["slow_ma"]) if c.get("slow_ma") is not None else None,
                    "fast_window": fast_window,
                    "slow_window": slow_window,
                    "ma_type": ma_type.upper(),
                    "price_source": price_source
                }
            })

        created_cnt, skipped_cnt = self.signal_repo.bulk_create_signals(
            strategy_configuration_id=config.id,
            instrument_id=instrument_id,
            signals_data=signals_payload
        )

        return config.id, created_cnt, skipped_cnt
