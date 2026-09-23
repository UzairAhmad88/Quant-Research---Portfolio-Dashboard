import pytest
from datetime import datetime, timezone, date, timedelta
from app.models.enums import AssetType
from app.validators import (
    OHLCVValidator,
    TimestampValidator,
    DuplicateValidator,
    GapValidator,
    EquityCalendar,
    CryptoCalendar,
    AnomalyValidator,
    ValidationPipeline,
    Severity,
    QualityStatus,
    ErrorCode
)

def test_ohlcv_validator_valid_and_invalid():
    validator = OHLCVValidator()
    now = datetime.now(timezone.utc)

    # Valid bar
    valid_bar = {
        "timestamp": now,
        "open": 100.0,
        "high": 105.0,
        "low": 98.0,
        "close": 102.0,
        "volume": 1000.0
    }
    is_valid, issues = validator.validate_bar(valid_bar)
    assert is_valid is True
    assert len(issues) == 0

    # Invalid: High < Open
    invalid_bar = {
        "timestamp": now,
        "open": 100.0,
        "high": 95.0,
        "low": 90.0,
        "close": 92.0,
        "volume": 1000.0
    }
    is_valid, issues = validator.validate_bar(invalid_bar)
    assert is_valid is False
    assert any(i.code == ErrorCode.INVALID_OHLC_RELATIONSHIP for i in issues)

    # Invalid: Negative price
    neg_bar = {
        "timestamp": now,
        "open": -10.0,
        "high": 5.0,
        "low": -15.0,
        "close": 2.0,
        "volume": 10.0
    }
    is_valid, issues = validator.validate_bar(neg_bar)
    assert is_valid is False
    assert any(i.code == ErrorCode.NEGATIVE_PRICE for i in issues)

def test_timestamp_validator_utc_and_order():
    validator = TimestampValidator()
    now = datetime.now(timezone.utc)

    bars = [
        {"timestamp": now - timedelta(days=1), "open": 10.0, "high": 11.0, "low": 9.0, "close": 10.5, "volume": 100},
        {"timestamp": now - timedelta(days=2), "open": 9.0, "high": 10.0, "low": 8.5, "close": 9.5, "volume": 100}
    ]

    sorted_bars, issues = validator.validate_chronological_order(bars)
    assert len(issues) == 1
    assert issues[0].code == ErrorCode.OUT_OF_ORDER_TIMESTAMP
    assert sorted_bars[0]["timestamp"] < sorted_bars[1]["timestamp"]

def test_duplicate_validator():
    validator = DuplicateValidator()
    now = datetime.now(timezone.utc)
    ts1 = now - timedelta(days=1)
    ts2 = now - timedelta(days=2)

    bars = [
        {"timestamp": ts1, "open": 10.0, "high": 11.0, "low": 9.0, "close": 10.5, "volume": 100},
        {"timestamp": ts1, "open": 10.0, "high": 11.0, "low": 9.0, "close": 10.5, "volume": 100},
        {"timestamp": ts2, "open": 9.0, "high": 10.0, "low": 8.5, "close": 9.5, "volume": 100}
    ]

    unique_bars, dup_bars, issues = validator.find_duplicates(bars, existing_timestamps=set())
    assert len(unique_bars) == 2
    assert len(dup_bars) == 1
    assert any(i.code == ErrorCode.DUPLICATE_RECORD for i in issues)

def test_gap_validator_equity_vs_crypto():
    validator = GapValidator()

    # Friday to Monday
    fri = datetime(2026, 3, 20, tzinfo=timezone.utc) # Friday
    mon = datetime(2026, 3, 23, tzinfo=timezone.utc) # Monday

    bars = [
        {"timestamp": fri, "open": 100.0, "high": 105.0, "low": 98.0, "close": 102.0, "volume": 1000},
        {"timestamp": mon, "open": 102.0, "high": 106.0, "low": 101.0, "close": 104.0, "volume": 1000}
    ]

    # Equity calendar: Sat/Sun are expected non-trading days -> 0 missing session warnings
    missing_equity, issues_equity = validator.detect_missing_sessions(bars, asset_type=AssetType.EQUITY)
    assert len(missing_equity) == 0

    # Crypto calendar: Sat/Sun are continuous trading days -> 2 missing session warnings
    missing_crypto, issues_crypto = validator.detect_missing_sessions(bars, asset_type=AssetType.CRYPTO)
    assert len(missing_crypto) == 2
    assert len(issues_crypto) == 2

def test_anomaly_validator_price_jump():
    validator = AnomalyValidator(price_jump_threshold_pct=20.0)
    now = datetime.now(timezone.utc)

    bars = [
        {"timestamp": now - timedelta(days=2), "open": 100.0, "high": 105.0, "low": 98.0, "close": 100.0, "volume": 1000},
        {"timestamp": now - timedelta(days=1), "open": 140.0, "high": 145.0, "low": 138.0, "close": 140.0, "volume": 1000} # 40% jump
    ]

    issues = validator.detect_anomalies(bars, asset_type=AssetType.EQUITY)
    assert any(i.code == ErrorCode.SUSPICIOUS_PRICE_JUMP for i in issues)

def test_validation_pipeline_integration():
    pipeline = ValidationPipeline()
    now = datetime.now(timezone.utc)

    bars = [
        {"timestamp": now - timedelta(days=2), "open": 100.0, "high": 105.0, "low": 98.0, "close": 102.0, "volume": 1000},
        {"timestamp": now - timedelta(days=1), "open": 102.0, "high": 106.0, "low": 101.0, "close": 104.0, "volume": 1000}
    ]

    unique_bars, report = pipeline.validate_dataset(bars, asset_type=AssetType.EQUITY)
    assert len(unique_bars) == 2
    assert report.status == QualityStatus.GOOD
    assert report.summary.total_records == 2
    assert report.summary.valid_records == 2
