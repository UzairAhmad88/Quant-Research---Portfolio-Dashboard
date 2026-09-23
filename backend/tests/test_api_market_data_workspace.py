import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch

def test_api_coverage_ingestions_export(client):
    # 1. Create Instrument
    inst_res = client.post("/api/v1/instruments", json={
        "symbol": "GOOGL",
        "name": "Alphabet Inc.",
        "asset_type": "EQUITY",
        "exchange": "NASDAQ"
    })
    assert inst_res.status_code == 201
    inst_id = inst_res.json()["id"]

    # 2. Fetch Coverage before data
    cov_res = client.get(f"/api/v1/market-data/{inst_id}/coverage")
    assert cov_res.status_code == 200
    cov_data = cov_res.json()
    assert cov_data["total_bars"] == 0
    assert cov_data["min_timestamp"] is None

    # 3. Perform Market Data Fetch
    now = datetime.now(timezone.utc)
    mock_bars = [
        {
            "timestamp": now - timedelta(days=2),
            "open": 140.0,
            "high": 142.0,
            "low": 139.0,
            "close": 141.5,
            "adjusted_close": 141.5,
            "volume": 1200000.0,
            "provider_symbol": "GOOGL"
        },
        {
            "timestamp": now - timedelta(days=1),
            "open": 141.5,
            "high": 145.0,
            "low": 141.0,
            "close": 144.0,
            "adjusted_close": 144.0,
            "volume": 1500000.0,
            "provider_symbol": "GOOGL"
        }
    ]

    with patch("app.providers.yahoo.YahooFinanceProvider.get_historical_ohlcv", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = mock_bars
        fetch_res = client.post("/api/v1/market-data/fetch", json={
            "instrument_id": inst_id,
            "provider": "yahoo_finance"
        })
        assert fetch_res.status_code == 200

    # 4. Fetch Coverage after data
    cov_res2 = client.get(f"/api/v1/market-data/{inst_id}/coverage")
    assert cov_res2.status_code == 200
    assert cov_res2.json()["total_bars"] == 2

    # 5. Fetch Ingestion History
    ing_res = client.get(f"/api/v1/market-data/{inst_id}/ingestions")
    assert ing_res.status_code == 200
    logs = ing_res.json()
    assert len(logs) >= 1
    assert logs[0]["rows_inserted"] == 2

    # 6. Export CSV
    exp_res = client.get(f"/api/v1/market-data/{inst_id}/export")
    assert exp_res.status_code == 200
    assert "text/csv" in exp_res.headers["content-type"]
    csv_content = exp_res.text
    assert "date,open,high,low,close" in csv_content
    assert "GOOGL" in csv_content
