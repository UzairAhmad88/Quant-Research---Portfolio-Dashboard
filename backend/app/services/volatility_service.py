from datetime import datetime
from typing import Optional, List
import pandas as pd
from sqlalchemy.orm import Session

from app.models.enums import DataFrequency
from app.repositories.instrument_repository import InstrumentRepository
from app.services.return_service import ReturnService
from app.analytics.returns import AnnualizationConvention
from app.analytics.volatility import (
    calculate_daily_volatility,
    calculate_annualized_volatility,
    calculate_upside_volatility,
    calculate_downside_volatility,
    calculate_rolling_volatility,
    calculate_return_distribution,
    validate_volatility_inputs,
)
from app.schemas.volatility import (
    SingleVolatilityResponse,
    MultiVolatilityResponse,
    VolatilitySummary,
    RollingVolatilityPoint,
    ReturnDistributionResponse,
    ReturnDistributionSummary,
    ReturnHistogramBin,
    InstrumentVolatilityItem,
)
from app.core.exceptions import NotFoundError, ValidationError


class VolatilityService:
    def __init__(self, db: Session):
        self.db = db
        self.inst_repo = InstrumentRepository(db)
        self.return_service = ReturnService(db)

    def get_single_volatility(
        self,
        instrument_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        price_source: str = "adjusted",
        return_type: str = "simple",
        rolling_window: int = 20,
        annualized: bool = True,
        frequency: DataFrequency = DataFrequency.DAILY
    ) -> SingleVolatilityResponse:
        instrument = self.inst_repo.get_by_id(instrument_id)
        if not instrument:
            raise NotFoundError(f"Instrument with ID '{instrument_id}' was not found.")

        # 1. Fetch Returns from Return Engine
        return_analysis = self.return_service.calculate_returns(
            instrument_id=instrument_id,
            start_date=start_date,
            end_date=end_date,
            price_source=price_source,
            return_type=return_type,
            frequency=frequency
        )

        annual_factor = AnnualizationConvention.get_annualization_factor(instrument.asset_type)

        # Build Pandas Series of returns
        timestamps = [obs.timestamp for obs in return_analysis.series]
        returns_list = [
            obs.simple_return if return_type == "simple" else obs.log_return
            for obs in return_analysis.series
        ]
        
        # Filter out initial None (first price observation has no return)
        valid_pairs = [(ts, r) for ts, r in zip(timestamps, returns_list) if r is not None]
        
        if not valid_pairs:
            series_ts, series_r = [], []
        else:
            series_ts, series_r = zip(*valid_pairs)

        returns_series = pd.Series(data=series_r, index=pd.DatetimeIndex(series_ts))

        # 2. Validate Minimum Observations
        is_sufficient, validation_msg = validate_volatility_inputs(returns_series, min_obs=30)

        empty_summary = VolatilitySummary(
            daily_volatility=None,
            annualized_volatility=None,
            upside_volatility=None,
            downside_volatility=None,
            observation_count=len(returns_series),
            annualization_factor=annual_factor
        )
        empty_distribution = ReturnDistributionResponse(
            summary=ReturnDistributionSummary(
                mean=0.0, median=0.0, min=0.0, max=0.0, std_dev=0.0,
                positive_observations=0, negative_observations=0, zero_observations=0, total_observations=0
            ),
            histogram=[]
        )

        if not is_sufficient:
            return SingleVolatilityResponse(
                instrument_id=instrument.id,
                symbol=instrument.symbol,
                name=instrument.name,
                asset_type=instrument.asset_type.value,
                price_source=price_source,
                return_type=return_type,
                rolling_window=rolling_window,
                annualized=annualized,
                quality_status=return_analysis.quality_status,
                quality_warning=return_analysis.quality_warning,
                is_sufficient=False,
                message=validation_msg,
                summary=empty_summary,
                rolling_series=[],
                distribution=empty_distribution
            )

        # 3. Calculate Summary Volatility
        daily_vol = calculate_daily_volatility(returns_series)
        annual_vol = calculate_annualized_volatility(daily_vol, annual_factor)
        upside_vol = calculate_upside_volatility(returns_series)
        downside_vol = calculate_downside_volatility(returns_series)

        summary = VolatilitySummary(
            daily_volatility=daily_vol,
            annualized_volatility=annual_vol,
            upside_volatility=upside_vol,
            downside_volatility=downside_vol,
            observation_count=len(returns_series),
            annualization_factor=annual_factor
        )

        # 4. Calculate Rolling Volatility Series
        rolling_series_pd = calculate_rolling_volatility(
            returns=returns_series,
            window=rolling_window,
            annualization_factor=annual_factor,
            annualized=annualized
        )

        rolling_points: List[RollingVolatilityPoint] = []
        for ts, vol_val in rolling_series_pd.items():
            val = float(vol_val) if not pd.isna(vol_val) else None
            rolling_points.append(RollingVolatilityPoint(
                timestamp=ts.to_pydatetime(),
                rolling_volatility=val
            ))

        # 5. Calculate Distribution
        dist_data = calculate_return_distribution(returns_series)
        dist_summary = ReturnDistributionSummary(**dist_data["summary"])
        dist_histogram = [ReturnHistogramBin(**b) for b in dist_data["histogram"]]
        distribution = ReturnDistributionResponse(
            summary=dist_summary,
            histogram=dist_histogram
        )

        return SingleVolatilityResponse(
            instrument_id=instrument.id,
            symbol=instrument.symbol,
            name=instrument.name,
            asset_type=instrument.asset_type.value,
            price_source=price_source,
            return_type=return_type,
            rolling_window=rolling_window,
            annualized=annualized,
            quality_status=return_analysis.quality_status,
            quality_warning=return_analysis.quality_warning,
            is_sufficient=True,
            message=None,
            summary=summary,
            rolling_series=rolling_points,
            distribution=distribution
        )

    def get_multi_volatility(
        self,
        instrument_ids: List[str],
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        price_source: str = "adjusted",
        return_type: str = "simple",
        frequency: DataFrequency = DataFrequency.DAILY
    ) -> MultiVolatilityResponse:
        items: List[InstrumentVolatilityItem] = []

        for inst_id in instrument_ids:
            instrument = self.inst_repo.get_by_id(inst_id)
            if not instrument:
                continue

            try:
                return_analysis = self.return_service.calculate_returns(
                    instrument_id=inst_id,
                    start_date=start_date,
                    end_date=end_date,
                    price_source=price_source,
                    return_type=return_type,
                    frequency=frequency
                )
            except Exception as e:
                items.append(InstrumentVolatilityItem(
                    instrument_id=instrument.id,
                    symbol=instrument.symbol,
                    name=instrument.name,
                    asset_type=instrument.asset_type.value,
                    observation_count=0,
                    daily_volatility=None,
                    annualized_volatility=None,
                    upside_volatility=None,
                    downside_volatility=None,
                    annualization_factor=252,
                    is_sufficient=False,
                    message=str(e)
                ))
                continue

            annual_factor = AnnualizationConvention.get_annualization_factor(instrument.asset_type)

            timestamps = [obs.timestamp for obs in return_analysis.series]
            returns_list = [
                obs.simple_return if return_type == "simple" else obs.log_return
                for obs in return_analysis.series
            ]
            valid_pairs = [(ts, r) for ts, r in zip(timestamps, returns_list) if r is not None]
            
            if not valid_pairs:
                returns_series = pd.Series(dtype=float)
            else:
                _, series_r = zip(*valid_pairs)
                returns_series = pd.Series(series_r)

            is_sufficient, validation_msg = validate_volatility_inputs(returns_series, min_obs=30)

            if not is_sufficient:
                items.append(InstrumentVolatilityItem(
                    instrument_id=instrument.id,
                    symbol=instrument.symbol,
                    name=instrument.name,
                    asset_type=instrument.asset_type.value,
                    observation_count=len(returns_series),
                    daily_volatility=None,
                    annualized_volatility=None,
                    upside_volatility=None,
                    downside_volatility=None,
                    annualization_factor=annual_factor,
                    is_sufficient=False,
                    message=validation_msg
                ))
            else:
                daily_vol = calculate_daily_volatility(returns_series)
                annual_vol = calculate_annualized_volatility(daily_vol, annual_factor)
                upside_vol = calculate_upside_volatility(returns_series)
                downside_vol = calculate_downside_volatility(returns_series)

                items.append(InstrumentVolatilityItem(
                    instrument_id=instrument.id,
                    symbol=instrument.symbol,
                    name=instrument.name,
                    asset_type=instrument.asset_type.value,
                    observation_count=len(returns_series),
                    daily_volatility=daily_vol,
                    annualized_volatility=annual_vol,
                    upside_volatility=upside_vol,
                    downside_volatility=downside_vol,
                    annualization_factor=annual_factor,
                    is_sufficient=True,
                    message=None
                ))

        return MultiVolatilityResponse(
            return_type=return_type,
            price_source=price_source,
            instruments=items
        )
