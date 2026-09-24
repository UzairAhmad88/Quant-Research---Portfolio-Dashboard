from datetime import datetime
from typing import Optional, List
import pandas as pd
from sqlalchemy.orm import Session

from app.models.enums import DataFrequency
from app.repositories.instrument_repository import InstrumentRepository
from app.repositories.market_data_repository import MarketDataRepository
from app.services.data_quality_service import DataQualityService
from app.analytics.strategies import run_moving_average_strategy
from app.schemas.strategies import (
    MovingAverageStrategyResponse,
    StrategySummary,
    CrossoverEvent,
    StrategyObservation,
)
from app.validators import QualityStatus
from app.core.exceptions import NotFoundError, ValidationError


class StrategyService:
    def __init__(self, db: Session):
        self.db = db
        self.inst_repo = InstrumentRepository(db)
        self.market_repo = MarketDataRepository(db)
        self.quality_service = DataQualityService(db)

    def calculate_moving_average_strategy(
        self,
        instrument_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        price_source: str = "adjusted",
        ma_type: str = "sma",
        fast_window: int = 20,
        slow_window: int = 50,
        frequency: DataFrequency = DataFrequency.DAILY
    ) -> MovingAverageStrategyResponse:
        # 1. Parameter Validation
        if fast_window <= 0 or slow_window <= 0:
            raise ValidationError("Moving average windows must be positive integers.")

        if fast_window >= slow_window:
            raise ValidationError(
                f"Fast window ({fast_window}) must be strictly less than slow window ({slow_window})."
            )

        clean_price_source = price_source.lower().strip()
        if clean_price_source not in ("adjusted", "close"):
            raise ValidationError("Price source must be either 'adjusted' or 'close'.")

        clean_ma_type = ma_type.lower().strip()
        if clean_ma_type not in ("sma", "ema"):
            raise ValidationError("Moving average type must be either 'sma' or 'ema'.")

        instrument = self.inst_repo.get_by_id(instrument_id)
        if not instrument:
            raise NotFoundError(f"Instrument with ID '{instrument_id}' was not found.")

        # 2. Check Data Quality
        quality_report = self.quality_service.get_instrument_quality_report(
            instrument_id=instrument_id,
            start_date=start_date,
            end_date=end_date,
            frequency=frequency
        )

        quality_warning: Optional[str] = None
        if quality_report.status == QualityStatus.INVALID:
            raise ValidationError("Market data failed validation and cannot be used for strategy analysis.")
        elif quality_report.status == QualityStatus.GOOD_WITH_WARNINGS:
            quality_warning = "Dataset contains non-fatal quality warnings."

        # 3. Calculate Fetch Start Date (Warm-up lookback)
        fetch_start_date = start_date
        if start_date is not None:
            # Look back enough calendar days to cover slow_window observations
            fetch_start_date = start_date - timedelta(days=slow_window * 3)

        # 4. Fetch Bars (including warm-up lookback)
        bars = self.market_repo.get_bars(
            instrument_id=instrument_id,
            start_date=fetch_start_date,
            end_date=end_date,
            frequency=frequency,
            limit=10000
        )

        # 5. Handle Insufficient Data
        if len(bars) < slow_window:
            empty_summary = StrategySummary(
                instrument_id=instrument.id,
                symbol=instrument.symbol,
                name=instrument.name,
                asset_type=instrument.asset_type.value,
                price_source=clean_price_source,
                ma_type=clean_ma_type.upper(),
                fast_window=fast_window,
                slow_window=slow_window,
                start_date=start_date,
                end_date=end_date,
                observation_count=len(bars),
                current_signal="HOLD",
                latest_signal_event=None,
                last_crossover=None,
                bullish_crossover_count=0,
                bearish_crossover_count=0
            )
            return MovingAverageStrategyResponse(
                summary=empty_summary,
                crossovers=[],
                series=[],
                quality_status=quality_report.status.value,
                quality_warning=quality_warning,
                is_sufficient=False,
                message=f"Insufficient observations: Received {len(bars)} price bars, but slow window requires at least {slow_window}."
            )

        # 6. Extract Price Series & Timestamps
        prices_list: List[float] = []
        timestamps: List[datetime] = []
        for b in bars:
            p = float(b.adjusted_close) if (clean_price_source == "adjusted" and b.adjusted_close is not None) else float(b.close)
            prices_list.append(p)
            timestamps.append(b.timestamp)

        prices_series = pd.Series(prices_list)

        # 7. Execute Strategy Engine over combined warm-up + display dataset
        res = run_moving_average_strategy(
            prices=prices_series,
            timestamps=timestamps,
            ma_type=clean_ma_type,
            fast_window=fast_window,
            slow_window=slow_window
        )

        # 8. Filter Observations and Crossovers to requested start_date..end_date range
        all_crossovers = res["crossovers"]
        all_obs = res["observations"]

        if start_date is not None:
            filtered_obs = [o for o in all_obs if o["timestamp"] >= start_date]
            filtered_crossovers = [c for c in all_crossovers if c["timestamp"] >= start_date]
        else:
            filtered_obs = all_obs
            filtered_crossovers = all_crossovers

        # 9. Construct Response
        summary_dict = res["summary"]

        # Recalculate summary metrics for display range
        bullish_cnt = sum(1 for c in filtered_crossovers if c["event_type"] == "BULLISH")
        bearish_cnt = sum(1 for c in filtered_crossovers if c["event_type"] == "BEARISH")
        last_cross_ts = filtered_crossovers[-1]["timestamp"] if filtered_crossovers else None
        latest_event = filtered_crossovers[-1]["signal"] if filtered_crossovers else None
        curr_sig = filtered_obs[-1]["signal"] if filtered_obs else summary_dict["current_signal"]

        summary = StrategySummary(
            instrument_id=instrument.id,
            symbol=instrument.symbol,
            name=instrument.name,
            asset_type=instrument.asset_type.value,
            price_source=clean_price_source,
            ma_type=summary_dict["ma_type"],
            fast_window=summary_dict["fast_window"],
            slow_window=summary_dict["slow_window"],
            start_date=start_date,
            end_date=end_date,
            observation_count=len(filtered_obs),
            current_signal=curr_sig,
            latest_signal_event=latest_event,
            last_crossover=last_cross_ts,
            bullish_crossover_count=bullish_cnt,
            bearish_crossover_count=bearish_cnt,
        )

        crossovers = [CrossoverEvent(**c) for c in filtered_crossovers]
        series = [StrategyObservation(**o) for o in filtered_obs]

        return MovingAverageStrategyResponse(
            summary=summary,
            crossovers=crossovers,
            series=series,
            quality_status=quality_report.status.value,
            quality_warning=quality_warning,
            is_sufficient=True,
            message=None
        )
