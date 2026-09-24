from datetime import datetime, timedelta
from app.models.market_data import OHLCV


def test_api_single_instrument_volatility(client, sqlite_db):
    # 1. Create equity instrument
    inst = client.post(
        "/api/v1/instruments",
        json={
            "symbol": "AAPL",
            "name": "Apple Inc",
            "asset_type": "EQUITY",
            "exchange": "NASDAQ",
            "currency": "USD"
        }
    ).json()

    # 2. Add 35 market data bars with oscillating prices -> yields both positive and negative returns
    base_date = datetime(2025, 1, 1)
    bars = []
    price = 150.0
    for i in range(35):
        ts = base_date + timedelta(days=i)
        # Oscillate price up and down
        price += 3.0 if (i % 2 == 0) else -2.0
        bars.append(OHLCV(
            instrument_id=inst["id"],
            timestamp=ts,
            frequency="DAILY",
            open=price,
            high=price + 1.0,
            low=price - 1.0,
            close=price,
            adjusted_close=price,
            volume=1000000.0,
            provider="yahoo_finance"
        ))

    sqlite_db.add_all(bars)
    sqlite_db.commit()

    # 3. Call Single Instrument Volatility Endpoint
    resp = client.get(
        "/api/v1/volatility",
        params={"instrument_id": inst["id"], "rolling_window": 10}
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["instrument_id"] == inst["id"]
    assert data["symbol"] == "AAPL"
    assert data["asset_type"] == "EQUITY"
    assert data["is_sufficient"] is True
    assert data["summary"]["observation_count"] == 34
    assert data["summary"]["annualization_factor"] == 252
    assert data["summary"]["daily_volatility"] is not None
    assert data["summary"]["annualized_volatility"] is not None
    assert data["summary"]["upside_volatility"] is not None
    assert data["summary"]["downside_volatility"] is not None

    # Rolling series has 34 points, first window-1 (9) should have null rolling_volatility
    assert len(data["rolling_series"]) == 34
    assert data["rolling_series"][0]["rolling_volatility"] is None
    assert data["rolling_series"][8]["rolling_volatility"] is None
    assert data["rolling_series"][9]["rolling_volatility"] is not None

    # Distribution histogram
    assert data["distribution"]["summary"]["total_observations"] == 34
    assert len(data["distribution"]["histogram"]) == 20


def test_api_volatility_insufficient_data(client, sqlite_db):
    inst = client.post(
        "/api/v1/instruments",
        json={
            "symbol": "MSFT",
            "name": "Microsoft Corp",
            "asset_type": "EQUITY",
            "exchange": "NASDAQ",
            "currency": "USD"
        }
    ).json()

    # Add only 15 bars -> 14 returns (< 30)
    base_date = datetime(2025, 1, 1)
    bars = [
        OHLCV(
            instrument_id=inst["id"],
            timestamp=base_date + timedelta(days=i),
            frequency="DAILY",
            open=300.0 + i,
            high=302.0 + i,
            low=299.0 + i,
            close=300.0 + i,
            adjusted_close=300.0 + i,
            volume=500000.0,
            provider="yahoo_finance"
        )
        for i in range(15)
    ]
    sqlite_db.add_all(bars)
    sqlite_db.commit()

    resp = client.get("/api/v1/volatility", params={"instrument_id": inst["id"]})
    assert resp.status_code == 200
    data = resp.json()

    assert data["is_sufficient"] is False
    assert "At least 30 are required" in data["message"]


def test_api_multi_instrument_volatility(client, sqlite_db):
    inst_equity = client.post(
        "/api/v1/instruments",
        json={"symbol": "NVDA", "name": "Nvidia", "asset_type": "EQUITY", "exchange": "NASDAQ", "currency": "USD"}
    ).json()

    inst_crypto = client.post(
        "/api/v1/instruments",
        json={"symbol": "BTC-USD", "name": "Bitcoin", "asset_type": "CRYPTO", "exchange": "CCC", "currency": "USD"}
    ).json()

    base_date = datetime(2025, 1, 1)
    bars = []
    for i in range(35):
        ts = base_date + timedelta(days=i)
        pe = 100.0 + (i * 2.0)
        pc = 40000.0 + (i * 500.0)
        bars.append(OHLCV(
            instrument_id=inst_equity["id"], timestamp=ts, frequency="DAILY",
            open=pe, high=pe+1, low=pe-1, close=pe, adjusted_close=pe, volume=1e6, provider="yahoo_finance"
        ))
        bars.append(OHLCV(
            instrument_id=inst_crypto["id"], timestamp=ts, frequency="DAILY",
            open=pc, high=pc+10, low=pc-10, close=pc, adjusted_close=pc, volume=1e8, provider="yahoo_finance"
        ))

    sqlite_db.add_all(bars)
    sqlite_db.commit()

    resp = client.get(
        "/api/v1/volatility",
        params={"instrument_ids": [inst_equity["id"], inst_crypto["id"]]}
    )
    assert resp.status_code == 200
    data = resp.json()

    assert "instruments" in data
    assert len(data["instruments"]) == 2

    eq_item = next(item for item in data["instruments"] if item["symbol"] == "NVDA")
    cr_item = next(item for item in data["instruments"] if item["symbol"] == "BTC-USD")

    assert eq_item["annualization_factor"] == 252
    assert cr_item["annualization_factor"] == 365
