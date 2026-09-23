import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch

def test_api_instruments_search(client):
    mock_search_results = [
        {
            "symbol": "BTC-USD",
            "name": "Bitcoin USD",
            "asset_type": "CRYPTO",
            "exchange": "CCC",
            "currency": "USD",
            "provider_symbol": "BTC-USD"
        }
    ]

    with patch("app.providers.yahoo.YahooFinanceProvider.search_instruments", new_callable=AsyncMock) as mock_search:
        mock_search.return_value = mock_search_results

        res = client.get("/api/v1/instruments/search?q=BTC")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["symbol"] == "BTC-USD"

def test_api_market_data_fetch_and_latest(client):
    # 1. Create Instrument first
    inst_res = client.post("/api/v1/instruments", json={
        "symbol": "NVDA",
        "name": "NVIDIA Corporation",
        "asset_type": "EQUITY",
        "exchange": "NASDAQ"
    })
    assert inst_res.status_code == 201
    inst_id = inst_res.json()["id"]

    # 2. Mock provider data return
    now = datetime.now(timezone.utc)
    mock_bars = [
        {
            "timestamp": now - timedelta(days=1),
            "open": 120.0,
            "high": 125.0,
            "low": 118.0,
            "close": 124.0,
            "adjusted_close": 124.0,
            "volume": 800000.0,
            "provider_symbol": "NVDA"
        }
    ]

    with patch("app.providers.yahoo.YahooFinanceProvider.get_historical_ohlcv", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = mock_bars

        # 3. Post Market Data Fetch request
        fetch_res = client.post("/api/v1/market-data/fetch", json={
            "instrument_id": inst_id,
            "provider": "yahoo_finance"
        })
        assert fetch_res.status_code == 200
        summary = fetch_res.json()["summary"]
        assert summary["rows_inserted"] == 1
        assert summary["symbol"] == "NVDA"

        # 4. Query Latest observation
        latest_res = client.get(f"/api/v1/market-data/{inst_id}/latest")
        assert latest_res.status_code == 200
        latest_bar = latest_res.json()
        assert latest_bar["close"] == 124.0
