def test_instrument_api_lifecycle(client):
    # 1. Create Instrument
    create_payload = {
        "symbol": "AMD",
        "name": "Advanced Micro Devices Inc.",
        "asset_type": "EQUITY",
        "exchange": "NASDAQ",
        "currency": "USD"
    }
    create_res = client.post("/api/v1/instruments", json=create_payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    inst_id = created_data["id"]
    assert created_data["symbol"] == "AMD"

    # 2. Get by ID
    get_res = client.get(f"/api/v1/instruments/{inst_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Advanced Micro Devices Inc."

    # 3. List Instruments
    list_res = client.get("/api/v1/instruments?asset_type=EQUITY")
    assert list_res.status_code == 200
    list_data = list_res.json()
    assert list_data["total"] >= 1
    assert "items" in list_data

    # 4. Patch Instrument
    patch_res = client.patch(f"/api/v1/instruments/{inst_id}", json={"provider_symbol": "AMD.US"})
    assert patch_res.status_code == 200
    assert patch_res.json()["provider_symbol"] == "AMD.US"

    # 5. Duplicate Creation Conflict (409)
    dup_res = client.post("/api/v1/instruments", json=create_payload)
    assert dup_res.status_code == 409
    assert dup_res.json()["error"]["code"] == "CONFLICT"

    # 6. Not Found (404)
    nf_res = client.get("/api/v1/instruments/non_existent_uuid")
    assert nf_res.status_code == 404
    assert nf_res.json()["error"]["code"] == "NOT_FOUND"
