import pytest
from datetime import datetime, timezone
from app.analytics.backtesting.report_service import ReportService, compute_configuration_fingerprint
from app.analytics.backtesting.report_pdf_generator import generate_backtest_pdf_report
from app.services.backtest_service import BacktestService
from app.schemas.backtest import BacktestCreate
from app.models.market_data import OHLCV
from app.repositories.market_data_repository import MarketDataRepository
from app.repositories.signal_repository import SignalRepository


def setup_test_backtest(client, sqlite_db):
    # 1. Create Instrument
    inst_resp = client.post(
        "/api/v1/instruments",
        json={
            "symbol": "AAPL",
            "name": "Apple Inc",
            "asset_type": "EQUITY",
            "exchange": "NASDAQ",
            "currency": "USD"
        }
    )
    inst_data = inst_resp.json()
    inst_id = inst_data["id"]

    # 2. Populate OHLCV Bars directly in DB
    ts1 = datetime(2025, 1, 2, tzinfo=timezone.utc)
    ts2 = datetime(2025, 1, 3, tzinfo=timezone.utc)
    ts3 = datetime(2025, 1, 6, tzinfo=timezone.utc)

    market_repo = MarketDataRepository(sqlite_db)
    bars = [
        OHLCV(instrument_id=inst_id, timestamp=ts1, frequency="DAILY", open=150.0, high=155.0, low=149.0, close=154.0, adjusted_close=154.0, volume=1000000.0, provider="yahoo_finance"),
        OHLCV(instrument_id=inst_id, timestamp=ts2, frequency="DAILY", open=154.0, high=160.0, low=153.0, close=158.0, adjusted_close=158.0, volume=1000000.0, provider="yahoo_finance"),
        OHLCV(instrument_id=inst_id, timestamp=ts3, frequency="DAILY", open=157.0, high=162.0, low=156.0, close=161.0, adjusted_close=161.0, volume=1000000.0, provider="yahoo_finance"),
    ]
    market_repo.bulk_insert_bars(bars)

    # 3. Create Strategy Configuration
    sig_repo = SignalRepository(sqlite_db)
    config = sig_repo.get_or_create_configuration(
        instrument_id=inst_id,
        fast_window=2,
        slow_window=3,
        ma_type="SMA",
        price_source="adjusted"
    )

    # 4. Run Backtest
    service = BacktestService(sqlite_db)
    payload = BacktestCreate(
        instrument_id=inst_id,
        strategy_configuration_id=config.id,
        start_date=ts1,
        end_date=ts3,
        initial_capital=100000.0,
        commission=0.001,
        slippage=0.0005,
    )

    backtest_res = service.run_backtest(payload)
    return backtest_res, inst_id, config.id


def test_configuration_fingerprint_deterministic(sqlite_db, client):
    backtest_res, inst_id, config_id = setup_test_backtest(client, sqlite_db)
    service = BacktestService(sqlite_db)
    backtest_model = service.backtest_repo.get_backtest_by_id(backtest_res.id)
    config = service.signal_repo.get_configuration_by_id(config_id)

    hash1 = compute_configuration_fingerprint(
        backtest=backtest_model,
        strategy_type="MOVING_AVERAGE",
        fast_window=config.fast_window,
        slow_window=config.slow_window,
        ma_type=config.ma_type
    )

    hash2 = compute_configuration_fingerprint(
        backtest=backtest_model,
        strategy_type="MOVING_AVERAGE",
        fast_window=config.fast_window,
        slow_window=config.slow_window,
        ma_type=config.ma_type
    )

    assert hash1 == hash2
    assert len(hash1) == 64


def test_report_service_generation(sqlite_db, client):
    backtest_res, inst_id, config_id = setup_test_backtest(client, sqlite_db)
    report_service = ReportService(sqlite_db)
    report = report_service.generate_report(backtest_res.id)

    assert report.report_version == "1.0"
    assert report.backtest_id == backtest_res.id
    assert report.executive_summary.symbol == "AAPL"
    assert report.executive_summary.initial_capital == 100000.0
    assert report.reproducibility.configuration_hash == report.configuration_hash
    assert len(report.methodology) > 0
    assert len(report.limitations) > 0


def test_report_pdf_generation(sqlite_db, client):
    backtest_res, inst_id, config_id = setup_test_backtest(client, sqlite_db)
    report_service = ReportService(sqlite_db)
    report = report_service.generate_report(backtest_res.id)

    pdf_bytes = generate_backtest_pdf_report(report)
    assert pdf_bytes is not None
    assert pdf_bytes.startswith(b'%PDF')


def test_report_api_endpoints(sqlite_db, client):
    backtest_res, inst_id, config_id = setup_test_backtest(client, sqlite_db)

    # 1. GET /api/v1/backtests/{id}/report
    resp = client.get(f"/api/v1/backtests/{backtest_res.id}/report")
    assert resp.status_code == 200
    data = resp.json()
    assert data["report_version"] == "1.0"
    assert data["backtest_id"] == backtest_res.id
    assert "executive_summary" in data

    # 2. GET /api/v1/backtests/{id}/report/export?format=json
    resp_json = client.get(f"/api/v1/backtests/{backtest_res.id}/report/export?format=json")
    assert resp_json.status_code == 200
    assert "application/json" in resp_json.headers["content-type"]

    # 3. GET /api/v1/backtests/{id}/report/export?format=csv
    resp_csv = client.get(f"/api/v1/backtests/{backtest_res.id}/report/export?format=csv")
    assert resp_csv.status_code == 200
    assert "text/csv" in resp_csv.headers["content-type"]
    assert "QUANT RESEARCH DASHBOARD" in resp_csv.text

    # 4. GET /api/v1/backtests/{id}/report/export?format=pdf
    resp_pdf = client.get(f"/api/v1/backtests/{backtest_res.id}/report/export?format=pdf")
    assert resp_pdf.status_code == 200
    assert "application/pdf" in resp_pdf.headers["content-type"]
    assert resp_pdf.content.startswith(b'%PDF')
