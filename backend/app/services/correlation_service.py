from datetime import datetime
from typing import List, Optional, Dict, Tuple
from sqlalchemy.orm import Session
import pandas as pd

from app.models.enums import DataFrequency
from app.repositories.instrument_repository import InstrumentRepository
from app.services.return_service import ReturnService
from app.services.data_quality_service import DataQualityService
from app.analytics.correlation import (
    CorrelationCalculator,
    CorrelationAlignment,
    MIN_CORRELATION_OBSERVATIONS,
)
from app.schemas.correlation import (
    CorrelationMatrixResponse,
    CorrelationPairwiseResponse,
    RollingCorrelationResponse,
    MatrixCellItem,
    ScatterPointItem,
    RollingPointItem,
)
from app.validators import QualityStatus
from app.core.exceptions import NotFoundError, ValidationError

MAX_CORRELATION_INSTRUMENTS = 20

class CorrelationService:
    def __init__(self, db: Session):
        self.db = db
        self.inst_repo = InstrumentRepository(db)
        self.return_service = ReturnService(db)
        self.quality_service = DataQualityService(db)

    def calculate_matrix(
        self,
        instrument_ids: List[str],
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        return_type: str = "simple",
        price_source: str = "adjusted",
        alignment_mode: str = "pairwise_complete",
        frequency: DataFrequency = DataFrequency.DAILY,
    ) -> CorrelationMatrixResponse:
        if not instrument_ids or len(instrument_ids) < 2:
            raise ValidationError("Correlation matrix requires at least 2 instruments.")

        if len(instrument_ids) > MAX_CORRELATION_INSTRUMENTS:
            raise ValidationError(
                f"Maximum {MAX_CORRELATION_INSTRUMENTS} instruments can be analyzed at once."
            )

        # Validate instruments exist and preserve requested order
        instruments = []
        for i_id in instrument_ids:
            inst = self.inst_repo.get_by_id(i_id)
            if not inst:
                raise NotFoundError(f"Instrument with ID '{i_id}' was not found.")
            instruments.append(inst)

        symbols = [inst.symbol for inst in instruments]
        id_symbol_map = {inst.id: inst.symbol for inst in instruments}

        # Gather returns and data quality status
        quality_status = QualityStatus.GOOD.value
        quality_warnings: List[str] = []
        return_dict: Dict[str, List[Tuple[datetime, float]]] = {}

        for inst in instruments:
            # Data quality check
            q_report = self.quality_service.get_instrument_quality_report(
                instrument_id=inst.id,
                start_date=start_date,
                end_date=end_date,
                frequency=frequency,
            )
            if q_report.status == QualityStatus.INVALID:
                quality_status = QualityStatus.INVALID.value
                quality_warnings.append(
                    f"Instrument '{inst.symbol}' market data is invalid."
                )
            elif q_report.status == QualityStatus.GOOD_WITH_WARNINGS and quality_status != QualityStatus.INVALID.value:
                quality_status = QualityStatus.GOOD_WITH_WARNINGS.value
                quality_warnings.append(
                    f"Instrument '{inst.symbol}' has data quality warnings."
                )

            # Compute returns via ReturnService
            ret_response = self.return_service.calculate_returns(
                instrument_id=inst.id,
                start_date=start_date,
                end_date=end_date,
                price_source=price_source,
                return_type=return_type,
                frequency=frequency,
            )

            # Map series observations: (timestamp, target_return_value)
            obs_list: List[Tuple[datetime, float]] = []
            for item in ret_response.series:
                ret_val = (
                    item.simple_return if return_type.lower() == "simple" else item.log_return
                )
                if ret_val is not None:
                    obs_list.append((item.timestamp, ret_val))

            return_dict[inst.symbol] = obs_list

        # Perform timestamp alignment
        aligned_df = CorrelationAlignment.align_return_series(return_dict, mode=alignment_mode)

        # Calculate matrix
        symbols, matrix = CorrelationCalculator.calculate_correlation_matrix(aligned_df)

        # Build flat pairwise summaries
        pairwise_items: List[MatrixCellItem] = []
        n = len(symbols)
        for i in range(n):
            for j in range(i + 1, n):
                sym_a = symbols[i]
                sym_b = symbols[j]

                # Calculate observation count
                sub_df = aligned_df[[sym_a, sym_b]].dropna()
                obs_count = len(sub_df)

                corr = matrix[i][j]
                if obs_count < MIN_CORRELATION_OBSERVATIONS:
                    corr = None
                    interpretation = f"Insufficient Data (< {MIN_CORRELATION_OBSERVATIONS} observations)"
                    if f"Pair {sym_a} x {sym_b} has fewer than {MIN_CORRELATION_OBSERVATIONS} observations." not in quality_warnings:
                        quality_warnings.append(
                            f"Pair {sym_a} x {sym_b} has only {obs_count} aligned observations (min {MIN_CORRELATION_OBSERVATIONS} required)."
                        )
                else:
                    interpretation = CorrelationCalculator.get_correlation_interpretation(corr)

                pairwise_items.append(
                    MatrixCellItem(
                        symbol_a=sym_a,
                        symbol_b=sym_b,
                        correlation=corr,
                        observations=obs_count,
                        interpretation=interpretation,
                    )
                )

        return CorrelationMatrixResponse(
            instruments=symbols,
            instrument_ids=[inst.id for inst in instruments],
            method="pearson",
            return_type=return_type,
            price_source=price_source,
            alignment=alignment_mode,
            matrix=matrix,
            pairwise=pairwise_items,
            quality_status=quality_status,
            quality_warnings=quality_warnings,
        )

    def calculate_pairwise(
        self,
        instrument_a_id: str,
        instrument_b_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        return_type: str = "simple",
        price_source: str = "adjusted",
        frequency: DataFrequency = DataFrequency.DAILY,
    ) -> CorrelationPairwiseResponse:
        inst_a = self.inst_repo.get_by_id(instrument_a_id)
        if not inst_a:
            raise NotFoundError(f"Instrument '{instrument_a_id}' not found.")

        inst_b = self.inst_repo.get_by_id(instrument_b_id)
        if not inst_b:
            raise NotFoundError(f"Instrument '{instrument_b_id}' not found.")

        ret_a = self.return_service.calculate_returns(
            instrument_id=inst_a.id,
            start_date=start_date,
            end_date=end_date,
            price_source=price_source,
            return_type=return_type,
            frequency=frequency,
        )

        ret_b = self.return_service.calculate_returns(
            instrument_id=inst_b.id,
            start_date=start_date,
            end_date=end_date,
            price_source=price_source,
            return_type=return_type,
            frequency=frequency,
        )

        obs_a = [
            (i.timestamp, i.simple_return if return_type == "simple" else i.log_return)
            for i in ret_a.series
        ]
        obs_b = [
            (i.timestamp, i.simple_return if return_type == "simple" else i.log_return)
            for i in ret_b.series
        ]

        timestamps, series_a, series_b = CorrelationAlignment.get_pairwise_aligned_observations(
            obs_a, obs_b
        )

        obs_count = len(timestamps)
        min_met = CorrelationAlignment.validate_minimum_observations(obs_count)

        corr = CorrelationCalculator.calculate_pearson_correlation(series_a, series_b) if min_met else None
        interp = (
            CorrelationCalculator.get_correlation_interpretation(corr)
            if min_met
            else f"Insufficient Data (< {MIN_CORRELATION_OBSERVATIONS} observations)"
        )

        scatter_points = [
            ScatterPointItem(timestamp=ts, return_a=series_a[idx], return_b=series_b[idx])
            for idx, ts in enumerate(timestamps)
        ]

        return CorrelationPairwiseResponse(
            instrument_a=inst_a.id,
            instrument_b=inst_b.id,
            symbol_a=inst_a.symbol,
            symbol_b=inst_b.symbol,
            correlation=corr,
            observations=obs_count,
            interpretation=interp,
            min_observations_met=min_met,
            return_type=return_type,
            price_source=price_source,
            quality_status=QualityStatus.GOOD.value,
            quality_warnings=[],
            scatter_points=scatter_points,
        )

    def calculate_rolling(
        self,
        instrument_a_id: str,
        instrument_b_id: str,
        window: int = 60,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        return_type: str = "simple",
        price_source: str = "adjusted",
        frequency: DataFrequency = DataFrequency.DAILY,
    ) -> RollingCorrelationResponse:
        if window < 5:
            raise ValidationError("Rolling window size must be at least 5 observations.")

        pairwise = self.calculate_pairwise(
            instrument_a_id=instrument_a_id,
            instrument_b_id=instrument_b_id,
            start_date=start_date,
            end_date=end_date,
            return_type=return_type,
            price_source=price_source,
            frequency=frequency,
        )

        timestamps = [pt.timestamp for pt in pairwise.scatter_points]
        returns_a = [pt.return_a for pt in pairwise.scatter_points]
        returns_b = [pt.return_b for pt in pairwise.scatter_points]

        rolling_res = CorrelationCalculator.calculate_rolling_correlation(
            series_a=returns_a,
            series_b=returns_b,
            timestamps=timestamps,
            window=window,
        )

        series = [RollingPointItem(timestamp=ts, correlation=c) for ts, c in rolling_res]

        return RollingCorrelationResponse(
            instrument_a=pairwise.instrument_a,
            instrument_b=pairwise.instrument_b,
            symbol_a=pairwise.symbol_a,
            symbol_b=pairwise.symbol_b,
            window=window,
            return_type=return_type,
            price_source=price_source,
            quality_status=pairwise.quality_status,
            quality_warnings=pairwise.quality_warnings,
            series=series,
        )
