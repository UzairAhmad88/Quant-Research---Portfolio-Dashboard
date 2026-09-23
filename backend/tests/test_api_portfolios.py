def test_portfolio_api_endpoints(client):
    # 1. Create instrument for holding
    inst_resp = client.post(
        "/api/v1/instruments",
        json={
            "symbol": "NVDA",
            "name": "NVIDIA Corp",
            "asset_type": "EQUITY",
            "exchange": "NASDAQ",
            "currency": "USD"
        }
    )
    assert inst_resp.status_code == 201
    inst_id = inst_resp.json()["id"]

    # 2. Create portfolio
    port_resp = client.post(
        "/api/v1/portfolios",
        json={
            "name": "AI Benchmark Fund",
            "description": "NVIDIA Heavy Portfolio",
            "base_currency": "USD",
            "initial_capital": 200000.0,
            "holdings": [
                {
                    "instrument_id": inst_id,
                    "quantity": 100.0,
                    "entry_price": 500.0,
                    "target_weight": 25.0
                }
            ]
        }
    )
    assert port_resp.status_code == 201
    port_data = port_resp.json()
    port_id = port_data["id"]
    assert port_data["name"] == "AI Benchmark Fund"
    assert port_data["invested_value"] == 50000.0
    assert port_data["cash"] == 150000.0

    # 3. Get portfolio
    get_resp = client.get(f"/api/v1/portfolios/{port_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == port_id

    # 4. List portfolios
    list_resp = client.get("/api/v1/portfolios")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1

    # 5. Get portfolio analytics
    analytics_resp = client.get(f"/api/v1/portfolios/{port_id}/analytics")
    assert analytics_resp.status_code == 200
    analytics_data = analytics_resp.json()
    assert analytics_data["portfolio_id"] == port_id
    assert analytics_data["summary"]["initial_capital"] == 200000.0
    assert analytics_data["summary"]["cash"] == 150000.0
    assert len(analytics_data["holdings"]) == 1

    # 6. Delete portfolio
    del_resp = client.delete(f"/api/v1/portfolios/{port_id}")
    assert del_resp.status_code == 204
