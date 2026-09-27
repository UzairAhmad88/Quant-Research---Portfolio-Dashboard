import pytest
from datetime import datetime, timezone, timedelta, date
from unittest.mock import MagicMock, patch, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.models.enums import AssetType, DataFrequency, DataFreshness
from app.models.instrument import Instrument
from app.models.market_data import OHLCV
from app.analytics.market_data.freshness_policy import FreshnessPolicy
from app.providers.yahoo import YahooFinanceProvider
from app.providers.base import ProviderCapabilities
from app.services.market_data_service import MarketDataService

@pytest.fixture
def test_client():
    return TestClient(app)

def test_provider_capabilities():
    provider = YahooFinanceProvider()
    caps = provider.capabilities
    assert isinstance(caps, ProviderCapabilities)
    assert caps.provider_name == "yahoo_finance"
    assert caps.historical is True
    assert caps.latest is True
    assert caps.intraday is False
    assert caps.delayed_data is True
    assert caps.real_time_data is False
    assert "DAILY" in caps.supported_frequencies

def test_freshness_policy_evaluations():
    # As of a Wednesday at 15:00 UTC
    as_of_wednesday = datetime(2026, 9, 23, 15, 0, tzinfo=timezone.utc)
    
    # 1. Observation from Tuesday (1 day prior) while Wednesday market is open -> CURRENT
    obs_tuesday = datetime(2026, 9, 22, 20, 0, tzinfo=timezone.utc)
    freshness = FreshnessPolicy.evaluate_freshness(
        obs_tuesday,
        asset_type=AssetType.EQUITY,
        as_of=as_of_wednesday
    )
    assert freshness == DataFreshness.CURRENT

    # 2. Observation from Wednesday itself -> CURRENT
    obs_wed = datetime(2026, 9, 23, 20, 0, tzinfo=timezone.utc)
    freshness = FreshnessPolicy.evaluate_freshness(
        obs_wed,
        asset_type=AssetType.EQUITY,
        as_of=as_of_wednesday
    )
    assert freshness == DataFreshness.CURRENT

    # 3. Observation from Monday (2 sessions prior) -> RECENT
    obs_monday = datetime(2026, 9, 21, 20, 0, tzinfo=timezone.utc)
    freshness = FreshnessPolicy.evaluate_freshness(
        obs_monday,
        asset_type=AssetType.EQUITY,
        as_of=as_of_wednesday
    )
    assert freshness == DataFreshness.RECENT

    # 4. Observation from 2 weeks prior -> STALE
    obs_old = datetime(2026, 9, 1, 20, 0, tzinfo=timezone.utc)
    freshness = FreshnessPolicy.evaluate_freshness(
        obs_old,
        asset_type=AssetType.EQUITY,
        as_of=as_of_wednesday
    )
    assert freshness == DataFreshness.STALE

    # 5. Weekend equity calendar awareness:
    # On Sunday 2026-09-27, Friday's close (2026-09-25) is the latest expected trading day
    as_of_sunday = datetime(2026, 9, 27, 12, 0, tzinfo=timezone.utc)
    obs_friday = datetime(2026, 9, 25, 20, 0, tzinfo=timezone.utc)
    freshness = FreshnessPolicy.evaluate_freshness(
        obs_friday,
        asset_type=AssetType.EQUITY,
        as_of=as_of_sunday
    )
    assert freshness == DataFreshness.CURRENT

    # 6. Unavailable when timestamp is None
    assert FreshnessPolicy.evaluate_freshness(None) == DataFreshness.UNAVAILABLE

@pytest.mark.asyncio
async def test_yahoo_provider_get_latest_ohlcv():
    provider = YahooFinanceProvider()
    mock_bar = {
        "timestamp": datetime(2026, 9, 25, 20, 0, tzinfo=timezone.utc),
        "open": 220.0,
        "high": 225.0,
        "low": 219.0,
        "close": 224.5,
        "adjusted_close": 224.5,
        "volume": 50000000.0,
        "provider_symbol": "AAPL"
    }
    with patch.object(provider, "get_historical_ohlcv", new_callable=AsyncMock, return_value=[mock_bar]):
        latest = await provider.get_latest_ohlcv("AAPL")
        assert latest is not None
        assert latest["close"] == 224.5
        assert latest["provider_symbol"] == "AAPL"

def test_api_provider_capabilities(client):
    response = client.get("/api/v1/market-data/providers/capabilities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    yahoo_cap = next((c for c in data if c["provider_name"] == "yahoo_finance"), None)
    assert yahoo_cap is not None
    assert yahoo_cap["historical"] is True
    assert yahoo_cap["latest"] is True
    assert yahoo_cap["delayed_data"] is True
    assert yahoo_cap["real_time_data"] is False

def test_api_get_latest_market_data_flow(client, sqlite_db):
    # Setup test instrument
    inst = sqlite_db.query(Instrument).filter(Instrument.symbol == "AAPL").first()

    if not inst:
        inst = Instrument(
            id="test-inst-aapl-uuid",
            symbol="AAPL",
            name="Apple Inc.",
            asset_type=AssetType.EQUITY,
            exchange="NASDAQ",
            currency="USD",
            provider_symbol="AAPL"
        )
        sqlite_db.add(inst)
        sqlite_db.commit()

    # Clear existing bars for clean test
    sqlite_db.query(OHLCV).filter(OHLCV.instrument_id == inst.id).delete()
    sqlite_db.commit()

    # 1. Fetch latest with mocked provider
    mock_provider_bar = {
        "timestamp": datetime(2026, 9, 25, 20, 0, tzinfo=timezone.utc),
        "open": 220.0,
        "high": 225.0,
        "low": 219.0,
        "close": 224.0,
        "adjusted_close": 224.0,
        "volume": 45000000.0,
        "provider_symbol": "AAPL"
    }

    with patch("app.providers.yahoo.YahooFinanceProvider.get_latest_ohlcv", new_callable=AsyncMock, return_value=mock_provider_bar):
        resp = client.get(f"/api/v1/market-data/latest?instrument_id={inst.id}&force_refresh=true")
        assert resp.status_code == 200
        result = resp.json()
        assert result["symbol"] == "AAPL"
        assert result["price"] == 224.0
        assert result["open"] == 220.0
        assert result["high"] == 225.0
        assert result["low"] == 219.0
        assert result["is_cached"] is False

    # 2. Query again without force_refresh -> Database-First cached return
    resp2 = client.get(f"/api/v1/market-data/latest?instrument_id={inst.id}&force_refresh=false")
    assert resp2.status_code == 200
    result2 = resp2.json()
    assert result2["price"] == 224.0
    assert result2["is_cached"] is True

    # 3. Add second bar and test price change calculation
    bar_prior = OHLCV(
        instrument_id=inst.id,
        timestamp=datetime(2026, 9, 24, 20, 0, tzinfo=timezone.utc),
        frequency=DataFrequency.DAILY,
        open=215.0,
        high=221.0,
        low=214.0,
        close=220.0,
        adjusted_close=220.0,
        volume=40000000.0,
        provider="yahoo_finance"
    )
    sqlite_db.add(bar_prior)
    sqlite_db.commit()

    with patch("app.providers.yahoo.YahooFinanceProvider.get_latest_ohlcv", new_callable=AsyncMock, return_value=mock_provider_bar):
        resp3 = client.get(f"/api/v1/market-data/latest?symbol=AAPL")
        assert resp3.status_code == 200
        result3 = resp3.json()
        assert result3["price"] == 224.0
        assert result3["previous_close"] == 220.0
        assert result3["change"] == pytest.approx(4.0, rel=1e-3)
        assert result3["change_pct"] == pytest.approx(4.0 / 220.0, rel=1e-3)


    # 4. Test provider failure fallback to cached observation
    with patch("app.providers.yahoo.YahooFinanceProvider.get_latest_ohlcv", side_effect=Exception("Provider timeout")):
        resp_fallback = client.get(f"/api/v1/market-data/latest?instrument_id={inst.id}&force_refresh=true")
        assert resp_fallback.status_code == 200
        fallback_data = resp_fallback.json()
        assert fallback_data["price"] == 224.0
        assert fallback_data["is_cached"] is True
        assert fallback_data["warning"] is not None
        assert "Provider temporarily unavailable" in fallback_data["warning"]

    # 5. Test batch latest endpoint
    with patch("app.providers.yahoo.YahooFinanceProvider.get_latest_ohlcv_batch", new_callable=AsyncMock, return_value={"AAPL": mock_provider_bar}):
        resp_batch = client.get(f"/api/v1/market-data/latest/batch?symbols=AAPL")
        assert resp_batch.status_code == 200
        batch_data = resp_batch.json()
        assert isinstance(batch_data, list)
        assert len(batch_data) == 1
        assert batch_data[0]["symbol"] == "AAPL"


