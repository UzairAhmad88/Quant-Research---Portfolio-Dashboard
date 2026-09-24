from datetime import datetime, timedelta
from app.models.market_data import OHLCV


def test_api_moving_average_strategy_success(client, sqlite_db):
    # 1. Create instrument
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

    # 2. Add 60 daily market data bars (> slow window 50)
    base_date = datetime(2025, 1, 1)
    bars = []
    price = 150.0
    for i in range(60):
        ts = base_date + timedelta(days=i)
        # Price trend up for 30 days then down
        price += 2.0 if i < 30 else -1.5
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

    # 3. Call Moving Average Strategy Endpoint
    resp = client.get(
        "/api/v1/strategies/moving-average",
        params={
            "instrument_id": inst["id"],
            "ma_type": "sma",
            "fast_window": 10,
            "slow_window": 20
        }
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["is_sufficient"] is True
    assert data["summary"]["instrument_id"] == inst["id"]
    assert data["summary"]["symbol"] == "AAPL"
    assert data["summary"]["fast_window"] == 10
    assert data["summary"]["slow_window"] == 20
    assert data["summary"]["observation_count"] == 60
    assert data["summary"]["ma_type"] == "SMA"
    assert "current_signal" in data["summary"]
    assert len(data["series"]) == 60

    # Warm-up check: first slow_window-1 (19) observations must have slow_ma = None
    assert data["series"][0]["slow_ma"] is None
    assert data["series"][18]["slow_ma"] is None
    assert data["series"][19]["slow_ma"] is not None


def test_api_moving_average_strategy_insufficient_data(client, sqlite_db):
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

    # Add only 15 bars (slow window requires 50)
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

    resp = client.get(
        "/api/v1/strategies/moving-average",
        params={
            "instrument_id": inst["id"],
            "fast_window": 10,
            "slow_window": 50
        }
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["is_sufficient"] is False
    assert "Insufficient observations" in data["message"]


def test_api_moving_average_strategy_window_validation(client, sqlite_db):
    inst = client.post(
        "/api/v1/instruments",
        json={
            "symbol": "NVDA",
            "name": "Nvidia",
            "asset_type": "EQUITY",
            "exchange": "NASDAQ",
            "currency": "USD"
        }
    ).json()

    # Fast window (50) >= Slow window (20) -> should fail with 400 Bad Request
    resp = client.get(
        "/api/v1/strategies/moving-average",
        params={
            "instrument_id": inst["id"],
            "fast_window": 50,
            "slow_window": 20
        }
    )
    assert resp.status_code == 400
    err_data = resp.json()
    assert "strictly less than slow window" in err_data["error"]["message"]
