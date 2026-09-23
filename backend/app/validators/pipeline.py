from datetime import datetime, date
from typing import Dict, Any, List, Set, Tuple, Optional
from app.models.enums import AssetType
from app.validators.quality import (
    QualityReport,
    QualityStatus,
    ValidationSummary,
    ValidationIssue,
    Severity,
    ErrorCode
)
from app.validators.ohlcv import OHLCVValidator
from app.validators.timestamps import TimestampValidator
from app.validators.duplicates import DuplicateValidator
from app.validators.gaps import GapValidator
from app.validators.anomalies import AnomalyValidator

class ValidationPipeline:
    """
    Unified multi-layer market data validation pipeline.
    Executes schema, timestamp, OHLC, duplicate, gap, and anomaly validation.
    """
    def __init__(
        self,
        max_invalid_ratio: float = 0.2,
        price_jump_pct: float = 20.0,
        volume_spike_multiplier: float = 10.0
    ):
        self.max_invalid_ratio = max_invalid_ratio
        self.ohlcv_validator = OHLCVValidator()
        self.timestamp_validator = TimestampValidator()
        self.duplicate_validator = DuplicateValidator()
        self.gap_validator = GapValidator()
        self.anomaly_validator = AnomalyValidator(
            price_jump_threshold_pct=price_jump_pct,
            volume_spike_multiplier=volume_spike_multiplier
        )

    def validate_dataset(
        self,
        bars: List[Dict[str, Any]],
        asset_type: AssetType = AssetType.EQUITY,
        existing_timestamps: Optional[Set[datetime]] = None,
        instrument_id: Optional[str] = None,
        symbol: Optional[str] = None,
        provider: Optional[str] = None,
        requested_start: Optional[datetime] = None,
        requested_end: Optional[datetime] = None
    ) -> Tuple[List[Dict[str, Any]], QualityReport]:
        all_issues: List[ValidationIssue] = []
        existing_ts = existing_timestamps or set()
        
        total_records = len(bars)
        if total_records == 0:
            summary = ValidationSummary(
                total_records=0,
                valid_records=0,
                invalid_records=0,
                warning_count=0,
                error_count=0,
                critical_count=0,
                duplicate_records=0,
                potential_missing_sessions=0
            )
            return [], QualityReport(
                status=QualityStatus.NO_DATA,
                summary=summary,
                issues=[ValidationIssue(
                    severity=Severity.INFO,
                    code=ErrorCode.MISSING_REQUIRED_FIELD,
                    message="Dataset contains zero price observations."
                )],
                instrument_id=instrument_id,
                symbol=symbol,
                asset_type=asset_type.value if hasattr(asset_type, "value") else str(asset_type),
                provider=provider,
                start_date=requested_start,
                end_date=requested_end
            )

        # 1. Normalize UTC Timestamps & Chronological Order
        normalized_bars: List[Dict[str, Any]] = []
        for idx, bar in enumerate(bars):
            raw_ts = bar.get("timestamp")
            is_valid_ts, utc_ts, ts_issues = self.timestamp_validator.normalize_utc(raw_ts)
            all_issues.extend(ts_issues)
            if is_valid_ts and utc_ts:
                bar_copy = dict(bar)
                bar_copy["timestamp"] = utc_ts
                normalized_bars.append(bar_copy)
            else:
                all_issues.append(ValidationIssue(
                    severity=Severity.ERROR,
                    code=ErrorCode.INVALID_TIMESTAMP,
                    message=f"Observation at index {idx} has unparseable or missing timestamp.",
                    record_reference=f"bar_{idx}"
                ))

        sorted_bars, order_issues = self.timestamp_validator.validate_chronological_order(normalized_bars)
        all_issues.extend(order_issues)

        # 2. OHLCV Structural & Price Validation
        structurally_valid_bars: List[Dict[str, Any]] = []
        invalid_count = 0

        for idx, bar in enumerate(sorted_bars):
            is_valid_ohlc, ohlc_issues = self.ohlcv_validator.validate_bar(bar, index=idx)
            all_issues.extend(ohlc_issues)
            if is_valid_ohlc:
                structurally_valid_bars.append(bar)
            else:
                invalid_count += 1

        # 3. Duplicate Detection
        unique_bars, duplicate_bars, dup_issues = self.duplicate_validator.find_duplicates(
            structurally_valid_bars,
            existing_timestamps=existing_ts
        )
        all_issues.extend(dup_issues)
        duplicate_count = len(duplicate_bars)

        # 4. Gap & Market Calendar Session Detection
        missing_dates, gap_issues = self.gap_validator.detect_missing_sessions(
            unique_bars,
            asset_type=asset_type,
            start_date=requested_start,
            end_date=requested_end
        )
        all_issues.extend(gap_issues)

        # 5. Anomaly Detection
        anomaly_issues = self.anomaly_validator.detect_anomalies(unique_bars, asset_type=asset_type)
        all_issues.extend(anomaly_issues)

        # 6. Aggregate Counts & Quality Status
        valid_records = len(unique_bars)
        warning_count = sum(1 for i in all_issues if i.severity == Severity.WARNING)
        error_count = sum(1 for i in all_issues if i.severity == Severity.ERROR)
        critical_count = sum(1 for i in all_issues if i.severity == Severity.CRITICAL)

        invalid_ratio = (invalid_count + error_count) / max(total_records, 1)

        if invalid_ratio > self.max_invalid_ratio or critical_count > 0:
            status = QualityStatus.INVALID
        elif warning_count > 0 or invalid_count > 0 or duplicate_count > 0 or len(missing_dates) > 0:
            status = QualityStatus.GOOD_WITH_WARNINGS
        else:
            status = QualityStatus.GOOD

        start_dt = unique_bars[0]["timestamp"] if unique_bars else requested_start
        end_dt = unique_bars[-1]["timestamp"] if unique_bars else requested_end

        summary = ValidationSummary(
            total_records=total_records,
            valid_records=valid_records,
            invalid_records=invalid_count,
            warning_count=warning_count,
            error_count=error_count,
            critical_count=critical_count,
            duplicate_records=duplicate_count,
            potential_missing_sessions=len(missing_dates)
        )

        report = QualityReport(
            status=status,
            summary=summary,
            issues=all_issues,
            instrument_id=instrument_id,
            symbol=symbol,
            asset_type=asset_type.value if hasattr(asset_type, "value") else str(asset_type),
            provider=provider,
            start_date=start_dt,
            end_date=end_dt
        )

        return unique_bars, report
