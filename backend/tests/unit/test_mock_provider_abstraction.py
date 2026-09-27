"""Unit tests verifying the MarketDataProvider abstraction using a Mocked Provider.

Ensures zero dependency on external network APIs (Yahoo Finance) during CI testing
and validates handling of all provider failure modes.
"""
import pytest
import datetime
from typing import List, Dict, Any, Optional

from app.providers.base import MarketDataProvider, ProviderCapabilities
from app.validators import OHLCVValidator, ValidationPipeline, QualityStatus
from app.analytics.market_data.freshness_policy import FreshnessPolicy
from app.models.enums import AssetType, DataFreshness


class MockMarketDataProvider(MarketDataProvider):
    """Deterministic in-memory mock provider implementing MarketDataProvider."""
    
    def __init__(self, mode: str = "success"):
        self.mode = mode
        self._capabilities = ProviderCapabilities(
            provider_name="MOCK_PROVIDER",
            historical=True,
            latest=True,
            intraday=False,
            streaming=False,
            supported_frequencies=["DAILY"],
            delayed_data=False,
            real_time_data=False
        )

    @property
    def capabilities(self) -> ProviderCapabilities:
        return self._capabilities

    @property
    def provider_name(self) -> str:
        return "MOCK_PROVIDER"

    async def search_instruments(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        if self.mode == "error":
            raise RuntimeError("Provider service unavailable (500)")
        return [{"symbol": query.upper(), "name": f"{query.upper()} Mock Corp.", "asset_type": "EQUITY"}]

    async def get_instrument_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        if self.mode == "error":
            raise RuntimeError("Provider connection failed")
        if self.mode == "empty":
            return None
        return {
            "symbol": symbol,
            "name": f"{symbol} Test Corp",
            "asset_type": "EQUITY",
            "exchange": "MOCK_EXCH",
            "currency": "USD"
        }

    async def get_historical_ohlcv(
        self,
        symbol: str,
        start_date: datetime.datetime,
        end_date: datetime.datetime,
        frequency: str = "DAILY"
    ) -> List[Dict[str, Any]]:
        if self.mode == "empty":
            return []
        if self.mode == "rate_limit":
            raise PermissionError("Rate limit exceeded (HTTP 429)")
        if self.mode == "timeout":
            raise TimeoutError("Connection to provider timed out")
        if self.mode == "error":
            raise ConnectionError("Provider service internal error (500)")
        if self.mode == "malformed":
            return [{"invalid_key": 123}]  # Missing required OHLCV schema
        if self.mode == "invalid_ohlc":
            t0 = datetime.datetime(2023, 1, 2, tzinfo=datetime.timezone.utc)
            return [{
                "timestamp": t0,
                "open": 100.0,
                "high": 90.0,  # High < Open violation
                "low": 105.0,
                "close": 95.0,
                "adjusted_close": 95.0,
                "volume": -500,  # Negative volume violation
            }]
        
        # Default success mode
        t0 = datetime.datetime(2023, 1, 2, tzinfo=datetime.timezone.utc)
        return [
            {
                "timestamp": t0,
                "open": 100.0,
                "high": 105.0,
                "low": 98.0,
                "close": 102.0,
                "adjusted_close": 102.0,
                "volume": 1000000,
            }
        ]

    async def get_latest_ohlcv(self, symbol: str) -> Optional[Dict[str, Any]]:
        if self.mode == "empty":
            return None
        if self.mode == "stale":
            # Bar from 14 days ago
            old_time = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=14)
            return {
                "timestamp": old_time,
                "open": 100.0,
                "high": 105.0,
                "low": 99.0,
                "close": 104.0,
                "adjusted_close": 104.0,
                "volume": 100000,
            }
        
        now = datetime.datetime.now(datetime.timezone.utc)
        return {
            "timestamp": now,
            "open": 150.0,
            "high": 155.0,
            "low": 149.0,
            "close": 153.0,
            "adjusted_close": 153.0,
            "volume": 500000,
        }

    async def get_latest_ohlcv_batch(self, symbols: List[str]) -> Dict[str, Optional[Dict[str, Any]]]:
        res = {}
        for s in symbols:
            res[s] = await self.get_latest_ohlcv(s)
        return res

    async def check_health(self) -> bool:
        return self.mode != "error"


# Test Cases
@pytest.mark.asyncio
async def test_mock_provider_success_pipeline():
    provider = MockMarketDataProvider(mode="success")
    start = datetime.datetime(2023, 1, 1, tzinfo=datetime.timezone.utc)
    end = datetime.datetime(2023, 1, 5, tzinfo=datetime.timezone.utc)
    
    bars = await provider.get_historical_ohlcv("AAPL", start, end)
    assert len(bars) == 1
    assert bars[0]["open"] == 100.0
    assert bars[0]["close"] == 102.0
    
    # Run validation engine on provider output
    validator = OHLCVValidator()
    is_valid, issues = validator.validate_bar(bars[0])
    assert is_valid is True
    assert len(issues) == 0


@pytest.mark.asyncio
async def test_mock_provider_empty_response():
    provider = MockMarketDataProvider(mode="empty")
    start = datetime.datetime(2023, 1, 1, tzinfo=datetime.timezone.utc)
    end = datetime.datetime(2023, 1, 5, tzinfo=datetime.timezone.utc)
    
    bars = await provider.get_historical_ohlcv("UNKNOWN", start, end)
    assert bars == []


@pytest.mark.asyncio
async def test_mock_provider_error_handling():
    provider_err = MockMarketDataProvider(mode="error")
    provider_rate = MockMarketDataProvider(mode="rate_limit")
    provider_timeout = MockMarketDataProvider(mode="timeout")
    
    start = datetime.datetime(2023, 1, 1, tzinfo=datetime.timezone.utc)
    end = datetime.datetime(2023, 1, 5, tzinfo=datetime.timezone.utc)
    
    with pytest.raises(ConnectionError, match="500"):
        await provider_err.get_historical_ohlcv("AAPL", start, end)
        
    with pytest.raises(PermissionError, match="429"):
        await provider_rate.get_historical_ohlcv("AAPL", start, end)
        
    with pytest.raises(TimeoutError):
        await provider_timeout.get_historical_ohlcv("AAPL", start, end)


@pytest.mark.asyncio
async def test_mock_provider_invalid_ohlc_rejection():
    provider = MockMarketDataProvider(mode="invalid_ohlc")
    start = datetime.datetime(2023, 1, 1, tzinfo=datetime.timezone.utc)
    end = datetime.datetime(2023, 1, 5, tzinfo=datetime.timezone.utc)
    
    bars = await provider.get_historical_ohlcv("AAPL", start, end)
    assert len(bars) == 1
    
    # Validation engine must catch High < Low and negative volume
    validator = OHLCVValidator()
    is_valid, issues = validator.validate_bar(bars[0])
    assert is_valid is False
    assert len(issues) > 0


@pytest.mark.asyncio
async def test_mock_provider_stale_data_detection():
    provider = MockMarketDataProvider(mode="stale")
    bar = await provider.get_latest_ohlcv("AAPL")
    assert bar is not None
    
    # Freshness policy should classify observation from 14 days ago as STALE
    status = FreshnessPolicy.evaluate_freshness(
        observation_timestamp=bar["timestamp"],
        asset_type=AssetType.EQUITY
    )
    assert status == DataFreshness.STALE
