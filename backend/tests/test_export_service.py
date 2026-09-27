import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.export.base import ExportFormat, ExportMetadata, sanitize_filename
from app.export.csv_exporter import CSVExporter
from app.export.json_exporter import JSONExporter
from app.export.pdf_exporter import PDFExporter
from app.export.service import ExportService
from app.core.exceptions import ValidationError


def test_sanitize_filename():
    assert sanitize_filename("AAPL / Returns? (1Y)") == "AAPL_Returns_1Y"
    assert sanitize_filename("..//etc/passwd") == "etc_passwd"
    assert sanitize_filename("valid_name-123.csv") == "valid_name-123.csv"
    assert sanitize_filename("   ") == "export"


def test_csv_exporter_formatting():
    exporter = CSVExporter()
    metadata = ExportMetadata(export_type="TEST", symbol="AAPL")

    now = datetime(2026, 9, 25, 15, 30, 0, tzinfo=timezone.utc)
    data = {
        "headers": ["date", "price", "sharpe", "active"],
        "rows": [
            [now, 150.50, None, True],
            [now, 152.00, 1.85, False],
        ]
    }

    csv_bytes = exporter.export(data, metadata)
    csv_str = csv_bytes.decode("utf-8")

    lines = csv_str.strip().split("\n")
    assert lines[0] == "date,price,sharpe,active"
    # Row 1: Sharpe is None -> empty string, not zero!
    assert "2026-09-25T15:30:00Z,150.5,,true" in lines[1]
    # Row 2: Sharpe is 1.85
    assert "2026-09-25T15:30:00Z,152,1.85,false" in lines[2] or "152.0" in lines[2]


def test_json_exporter_structure():
    exporter = JSONExporter()
    metadata = ExportMetadata(export_type="TEST", symbol="MSFT")

    data = {"symbols": ["MSFT", "AAPL"], "value": 100.0, "missing": None}
    json_bytes = exporter.export(data, metadata)
    import json
    parsed = json.loads(json_bytes.decode("utf-8"))

    assert parsed["metadata"]["export_type"] == "TEST"
    assert parsed["metadata"]["symbol"] == "MSFT"
    assert parsed["data"]["symbols"] == ["MSFT", "AAPL"]
    assert parsed["data"]["missing"] is None


def test_export_service_validation():
    service = ExportService()
    metadata = ExportMetadata(export_type="RETURNS", symbol="SPY")

    # Unsupported format
    with pytest.raises(ValidationError) as exc_info:
        service.get_exporter("xml")
    assert "Unsupported export format" in str(exc_info.value)

    # PDF requested for non-backtest report
    with pytest.raises(ValidationError) as exc_info:
        service.create_export_response(
            data={"headers": [], "rows": []},
            metadata=metadata,
            format_str="pdf",
            filename_prefix="test"
        )
    assert "PDF format is only available for Backtest Research Reports" in str(exc_info.value)


def test_market_data_and_returns_export_api(client: TestClient):
    # 1. Create instrument
    inst_res = client.post("/api/v1/instruments", json={
        "symbol": "EXPT1",
        "name": "Export Test 1",
        "asset_type": "EQUITY",
        "exchange": "NASDAQ"
    })
    assert inst_res.status_code == 201
    inst_id = inst_res.json()["id"]

    # 2. Ingest mock bars
    from unittest.mock import patch, AsyncMock
    now = datetime(2026, 9, 20, tzinfo=timezone.utc)
    mock_bars = [
        {"timestamp": now, "open": 100.0, "high": 105.0, "low": 99.0, "close": 102.0, "adjusted_close": 102.0, "volume": 1000.0, "provider_symbol": "EXPT1"},
        {"timestamp": datetime(2026, 9, 21, tzinfo=timezone.utc), "open": 102.0, "high": 106.0, "low": 101.0, "close": 104.0, "adjusted_close": 104.0, "volume": 1200.0, "provider_symbol": "EXPT1"},
    ]
    with patch("app.providers.yahoo.YahooFinanceProvider.get_historical_ohlcv", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = mock_bars
        client.post("/api/v1/market-data/fetch", json={"instrument_id": inst_id, "provider": "yahoo_finance"})

    # 3. Market data CSV export
    md_csv = client.get(f"/api/v1/market-data/export?instrument_id={inst_id}&format=csv")
    assert md_csv.status_code == 200
    assert "text/csv" in md_csv.headers["content-type"]
    assert "timestamp,open,high,low,close" in md_csv.text
    assert "EXPT1" in md_csv.text

    # 4. Market data JSON export
    md_json = client.get(f"/api/v1/market-data/export?instrument_id={inst_id}&format=json")
    assert md_json.status_code == 200
    assert "application/json" in md_json.headers["content-type"]
    json_body = md_json.json()
    assert json_body["metadata"]["symbol"] == "EXPT1"
    assert len(json_body["data"]) == 2

    # 5. Returns CSV export
    ret_csv = client.get(f"/api/v1/returns/export?instrument_id={inst_id}&format=csv")
    assert ret_csv.status_code == 200
    assert "text/csv" in ret_csv.headers["content-type"]
    assert "date,price,simple_return,log_return,cumulative_return" in ret_csv.text

    # 6. Returns JSON export
    ret_json = client.get(f"/api/v1/returns/export?instrument_id={inst_id}&format=json")
    assert ret_json.status_code == 200
    assert ret_json.json()["metadata"]["symbol"] == "EXPT1"


def test_volatility_and_strategy_export_api(client: TestClient):
    inst_res = client.post("/api/v1/instruments", json={
        "symbol": "EXPT2",
        "name": "Export Test 2",
        "asset_type": "EQUITY",
        "exchange": "NASDAQ"
    })
    inst_id = inst_res.json()["id"]

    # Ingest enough bars for volatility & strategy
    from unittest.mock import patch, AsyncMock
    mock_bars = [
        {
            "timestamp": datetime(2026, 1, 1 + i, tzinfo=timezone.utc),
            "open": 100.0 + i,
            "high": 102.0 + i,
            "low": 99.0 + i,
            "close": 101.0 + i,
            "adjusted_close": 101.0 + i,
            "volume": 50000.0,
            "provider_symbol": "EXPT2"
        }
        for i in range(25)
    ]
    with patch("app.providers.yahoo.YahooFinanceProvider.get_historical_ohlcv", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = mock_bars
        client.post("/api/v1/market-data/fetch", json={"instrument_id": inst_id, "provider": "yahoo_finance"})

    # Volatility export
    vol_csv = client.get(f"/api/v1/volatility/export?instrument_id={inst_id}&rolling_window=5&format=csv")
    assert vol_csv.status_code == 200
    assert "date,rolling_volatility" in vol_csv.text

    # Strategy moving average export
    strat_csv = client.get(f"/api/v1/strategies/moving-average/export?instrument_id={inst_id}&fast_window=5&slow_window=10&format=csv")
    assert strat_csv.status_code == 200
    assert "timestamp,price,fast_ma,slow_ma,signal" in strat_csv.text

    # Signals export
    sig_csv = client.get("/api/v1/signals/export?format=csv")
    assert sig_csv.status_code == 200
    assert "signal_id,timestamp,instrument_id" in sig_csv.text
