import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch

from app.core.exceptions import (
    ProviderException,
    ProviderTimeoutException,
    RateLimitedException,
    NotFoundException,
)
from app.providers.retry import execute_with_retry
from app.models.enums import AssetType, DataFrequency, DataFreshness
from app.models.instrument import Instrument
from app.models.market_data import OHLCV
from app.services.market_data_service import MarketDataService


@pytest.mark.asyncio
async def test_retry_policy_transient_failure_then_success():
    """Verify execute_with_retry retries transient timeouts and succeeds on attempt 3."""
    attempts = 0

    async def flaky_fetch():
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise ProviderTimeoutException(f"Simulated timeout on attempt {attempts}")
        return {"price": 150.0}

    result = await execute_with_retry(
        flaky_fetch,
        max_attempts=3,
        base_delay=0.01,  # fast test delay
        jitter=False,
        operation_name="Flaky Test Fetch"
    )

    assert result == {"price": 150.0}
    assert attempts == 3


@pytest.mark.asyncio
async def test_retry_policy_exhausted_retries_raises_provider_exception():
    """Verify execute_with_retry stops at max_attempts (3) and raises ProviderException."""
    attempts = 0

    async def constantly_failing():
        nonlocal attempts
        attempts += 1
        raise TimeoutError("Network connection timed out")

    with pytest.raises(ProviderTimeoutException):
        await execute_with_retry(
            constantly_failing,
            max_attempts=3,
            base_delay=0.01,
            jitter=False,
            operation_name="Constantly Failing Fetch"
        )

    assert attempts == 3


@pytest.mark.asyncio
async def test_retry_policy_permanent_error_not_retried():
    """Verify permanent errors (e.g. NotFoundException) fail immediately without retrying."""
    attempts = 0

    async def permanent_error():
        nonlocal attempts
        attempts += 1
        raise NotFoundException("Symbol INVALID does not exist")

    with pytest.raises(NotFoundException):
        await execute_with_retry(
            permanent_error,
            max_attempts=3,
            base_delay=0.01,
            jitter=False,
            operation_name="Permanent Error Fetch"
        )

    # Must NOT have retried
    assert attempts == 1


@pytest.mark.asyncio
async def test_retry_policy_rate_limit_429_detection():
    """Verify HTTP 429 Rate Limits are classified as RateLimitedException without retrying blindly."""
    async def rate_limited_call():
        raise Exception("HTTP 429 Too Many Requests: Rate limit exceeded")

    with pytest.raises(RateLimitedException) as exc_info:
        await execute_with_retry(
            rate_limited_call,
            max_attempts=3,
            base_delay=0.01,
            jitter=False,
            operation_name="Rate Limited Fetch"
        )

    assert exc_info.value.code == "RATE_LIMITED"
    assert exc_info.value.status_code == 429
    assert exc_info.value.retryable is True


@pytest.mark.asyncio
async def test_cached_data_fallback_when_provider_fails(sqlite_db):
    """
    Verify resilience policy: If provider refresh fails but validated historical data
    exists in the database, the service returns cached data with an explicit stale warning.
    """
    # 1. Seed instrument and one historical bar in SQLite
    instrument = Instrument(
        id="inst-fallback-1",
        symbol="SPY",
        name="SPDR S&P 500 ETF Trust",
        asset_type=AssetType.ETF,
        exchange="NYSE",
        currency="USD",
        active=True
    )
    sqlite_db.add(instrument)

    cached_bar = OHLCV(
        id="bar-fallback-1",
        instrument_id="inst-fallback-1",
        timestamp=datetime.now(timezone.utc) - timedelta(days=5),
        frequency=DataFrequency.DAILY,
        open=500.0,
        high=505.0,
        low=498.0,
        close=502.0,
        adjusted_close=502.0,
        volume=50000000.0,
        provider="yahoo_finance",
        provider_symbol="SPY",
        retrieved_at=datetime.now(timezone.utc) - timedelta(days=5)
    )
    sqlite_db.add(cached_bar)
    sqlite_db.commit()

    service = MarketDataService(sqlite_db)

    # 2. Mock provider to raise ProviderTimeoutException
    with patch("app.providers.registry.ProviderRegistry.get_provider") as mock_get_provider:
        mock_provider = AsyncMock()
        mock_provider.get_latest_ohlcv.side_effect = ProviderTimeoutException("Gateway Timeout")
        mock_get_provider.return_value = mock_provider

        # Force refresh should trigger provider call, fail, and fallback to cached bar
        response = await service.get_latest_market_data(
            instrument_id="inst-fallback-1",
            force_refresh=True
        )

        assert response.is_cached is True
        assert response.price == 502.0
        assert response.warning is not None
        assert "temporarily unavailable" in response.warning.lower() or "showing" in response.warning.lower()
        # Verify freshness is marked appropriately
        assert response.freshness in [DataFreshness.STALE.value, DataFreshness.RECENT.value, DataFreshness.UNKNOWN.value]


@pytest.mark.asyncio
async def test_no_cached_data_failure_raises_explicit_error_zero_fabrication(sqlite_db):
    """
    Verify zero fabrication rule: If provider fails and NO cached data exists,
    an explicit exception is raised. The system NEVER generates fake or zero prices.
    """
    instrument = Instrument(
        id="inst-nofallback-1",
        symbol="EMPTY",
        name="Empty Corp",
        asset_type=AssetType.EQUITY,
        exchange="NASDAQ",
        currency="USD",
        active=True
    )
    sqlite_db.add(instrument)
    sqlite_db.commit()

    service = MarketDataService(sqlite_db)

    with patch("app.providers.registry.ProviderRegistry.get_provider") as mock_get_provider:
        mock_provider = AsyncMock()
        mock_provider.get_latest_ohlcv.side_effect = ProviderException("Service connection refused")
        mock_get_provider.return_value = mock_provider

        with pytest.raises(Exception) as exc_info:
            await service.get_latest_market_data(
                instrument_id="inst-nofallback-1",
                force_refresh=True
            )

        # Confirm an exception was raised rather than returning a 0.0 or synthetic result
        assert exc_info.value is not None
