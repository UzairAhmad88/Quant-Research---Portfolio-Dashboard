from datetime import datetime, timezone, timedelta

def test_market_data_api_query(client):
    # 1. Create Instrument
    inst_res = client.post("/api/v1/instruments", json={
        "symbol": "QQQ",
        "name": "Invesco QQQ Trust",
        "asset_type": "ETF",
        "exchange": "NASDAQ"
    })
    inst_id = inst_res.json()["id"]

    # 2. Query empty market data
    query_res = client.get(f"/api/v1/market-data?instrument_id={inst_id}")
    assert query_res.status_code == 200
    assert query_res.json()["total"] == 0

    # 3. Invalid date range (start > end -> 400 Bad Request)
    now = datetime.now(timezone.utc)
    invalid_start = (now + timedelta(days=10)).isoformat()
    invalid_end = now.isoformat()

    err_res = client.get(
        f"/api/v1/market-data?instrument_id={inst_id}&start_date={invalid_start}&end_date={invalid_end}"
    )
    assert err_res.status_code == 422
    assert err_res.json()["error"]["code"] == "VALIDATION_ERROR"

