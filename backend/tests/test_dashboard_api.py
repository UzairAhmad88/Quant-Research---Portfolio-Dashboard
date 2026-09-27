import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone
from app.main import app
from app.models.enums import AssetType, DataFrequency
from app.repositories.instrument_repository import InstrumentRepository
from app.repositories.market_data_repository import MarketDataRepository
from app.repositories.portfolio_repository import PortfolioRepository
from app.repositories.signal_repository import SignalRepository
from app.repositories.backtest_repository import BacktestRepository
from app.schemas.instrument import InstrumentCreate
from app.schemas.market_data import OHLCVCreate
from app.schemas.portfolio import PortfolioCreate


def test_get_dashboard_overview_empty(client, sqlite_db):
    """Test dashboard overview endpoint on an empty database."""
    response = client.get("/api/v1/dashboard/overview")
    assert response.status_code == 200
    data = response.json()

    assert "summary" in data
    assert "system_status" in data
    assert "market_data_snapshot" in data
    assert "portfolio_snapshot" in data
    assert "strategy_snapshot" in data
    assert "recent_backtests" in data
    assert "recent_activity" in data

    assert data["summary"]["tracked_instruments_count"] == 0
    assert data["summary"]["portfolios_count"] == 0
    assert data["summary"]["strategy_configurations_count"] == 0
    assert data["summary"]["completed_backtests_count"] == 0

    assert data["system_status"]["data_status"] == "No Data"
    assert data["system_status"]["backend_status"] == "ONLINE"
    assert data["system_status"]["database_connected"] is True


def test_get_dashboard_overview_populated(client, sqlite_db):
    """Test dashboard overview endpoint with populated data entities."""
    # 1. Create instrument
    inst_repo = InstrumentRepository(sqlite_db)
    inst = inst_repo.create(
        InstrumentCreate(
            symbol="AAPL",
            name="Apple Inc.",
            asset_type=AssetType.EQUITY,
            exchange="NASDAQ",
            currency="USD"
        )
    )

    # 2. Insert market data bars
    md_repo = MarketDataRepository(sqlite_db)
    now = datetime.now(timezone.utc)
    md_repo.insert_bar(
        OHLCVCreate(
            instrument_id=inst.id,
            timestamp=now,
            frequency=DataFrequency.DAILY,
            open=150.0,
            high=155.0,
            low=149.0,
            close=154.0,
            adjusted_close=154.0,
            volume=1000000.0,
            provider="YAHOO",
            provider_symbol="AAPL"
        )
    )

    # 3. Create portfolio
    p_repo = PortfolioRepository(sqlite_db)
    p_repo.create_portfolio(
        PortfolioCreate(
            name="Tech Growth Fund",
            description="Core holdings",
            base_currency="USD",
            initial_capital=100000.0
        )
    )

    # 4. Create strategy configuration and signals
    sig_repo = SignalRepository(sqlite_db)
    config = sig_repo.get_or_create_configuration(
        instrument_id=inst.id,
        strategy_type="MOVING_AVERAGE",
        ma_type="SMA",
        fast_window=10,
        slow_window=20
    )
    sig_repo.bulk_create_signals(
        strategy_configuration_id=config.id,
        instrument_id=inst.id,
        signals_data=[
            {
                "timestamp": now,
                "signal_type": "BUY",
                "signal_state": "BULLISH",
                "price": 154.0
            }
        ]
    )

    # 5. Create backtest
    bt_repo = BacktestRepository(sqlite_db)
    bt = bt_repo.create_backtest(
        strategy_configuration_id=config.id,
        instrument_id=inst.id,
        initial_capital=100000.0
    )
    bt_repo.save_simulation_results(
        backtest_id=bt.id,
        status="COMPLETED",
        final_cash=105000.0,
        final_position=0.0,
        final_portfolio_value=105000.0,
        trade_events=[],
        portfolio_states=[]
    )

    # Call API
    response = client.get("/api/v1/dashboard/overview")
    assert response.status_code == 200
    data = response.json()

    assert data["summary"]["tracked_instruments_count"] == 1
    assert data["summary"]["portfolios_count"] == 1
    assert data["summary"]["strategy_configurations_count"] == 1
    assert data["summary"]["completed_backtests_count"] == 1

    assert data["system_status"]["data_status"] == "Good with Warnings"  # 1 bar < 100 bars
    assert len(data["market_data_snapshot"]) == 1
    assert data["market_data_snapshot"][0]["symbol"] == "AAPL"
    assert data["market_data_snapshot"][0]["observation_count"] == 1

    assert data["portfolio_snapshot"]["active_portfolios_count"] == 1
    assert len(data["strategy_snapshot"]["recent_signals"]) == 1
    assert data["strategy_snapshot"]["recent_signals"][0]["symbol"] == "AAPL"

    assert len(data["recent_backtests"]) == 1
    assert data["recent_backtests"][0]["instrument_symbol"] == "AAPL"
    assert data["recent_backtests"][0]["status"] == "COMPLETED"
    assert data["recent_backtests"][0]["total_return_pct"] == 5.0
