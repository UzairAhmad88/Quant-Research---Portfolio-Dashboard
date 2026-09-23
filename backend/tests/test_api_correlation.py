from datetime import datetime, timedelta
from app.models.enums import AssetType
from app.models.market_data import OHLCV

def test_api_correlation_matrix_and_pairwise(client, sqlite_db):
    # 1. Create 2 instruments
    inst_a = client.post(
        "/api/v1/instruments",
        json={
            "symbol": "AAPL",
            "name": "Apple Inc",
            "asset_type": "EQUITY",
            "exchange": "NASDAQ",
            "currency": "USD"
        }
    ).json()

    inst_b = client.post(
        "/api/v1/instruments",
        json={
            "symbol": "MSFT",
            "name": "Microsoft Corp",
            "asset_type": "EQUITY",
            "exchange": "NASDAQ",
            "currency": "USD"
        }
    ).json()

    # 2. Populate 35 daily market data bars for each
    base_date = datetime(2025, 1, 1)
    bars_to_add = []
    for i in range(35):
        ts = base_date + timedelta(days=i)
        p_a = 150.0 + (i * 1.5)
        p_b = 300.0 + (i * 2.0)

        bar_a = OHLCV(
            instrument_id=inst_a["id"],
            timestamp=ts,
            frequency="DAILY",
            open=p_a,
            high=p_a + 1.0,
            low=p_a - 1.0,
            close=p_a,
            adjusted_close=p_a,
            volume=1000000.0,
            provider="yahoo_finance"
        )
        bar_b = OHLCV(
            instrument_id=inst_b["id"],
            timestamp=ts,
            frequency="DAILY",
            open=p_b,
            high=p_b + 1.0,
            low=p_b - 1.0,
            close=p_b,
            adjusted_close=p_b,
            volume=2000000.0,
            provider="yahoo_finance"
        )
        bars_to_add.extend([bar_a, bar_b])

    sqlite_db.add_all(bars_to_add)
    sqlite_db.commit()

    # 3. Request Correlation Matrix
    matrix_resp = client.get(
        "/api/v1/correlation",
        params={"instrument_ids": [inst_a["id"], inst_b["id"]]}
    )
    assert matrix_resp.status_code == 200
    m_data = matrix_resp.json()
    assert m_data["instruments"] == ["AAPL", "MSFT"]
    assert len(m_data["matrix"]) == 2
    assert m_data["matrix"][0][0] == 1.0
    assert m_data["matrix"][1][1] == 1.0

    # 4. Request Pairwise Endpoint
    pair_resp = client.get(
        "/api/v1/correlation/pair",
        params={"instrument_a": inst_a["id"], "instrument_b": inst_b["id"]}
    )
    assert pair_resp.status_code == 200
    p_data = pair_resp.json()
    assert p_data["symbol_a"] == "AAPL"
    assert p_data["symbol_b"] == "MSFT"
    assert p_data["observations"] == 34  # 35 bars yield 34 returns
    assert p_data["min_observations_met"] is True
    assert len(p_data["scatter_points"]) == 34

    # 5. Request Rolling Correlation Endpoint
    rolling_resp = client.get(
        "/api/v1/correlation/rolling",
        params={"instrument_a": inst_a["id"], "instrument_b": inst_b["id"], "window": 10}
    )
    assert rolling_resp.status_code == 200
    r_data = rolling_resp.json()
    assert r_data["window"] == 10
    assert len(r_data["series"]) == 34
