from datetime import datetime, timedelta
import pytest
from app.analytics.backtesting import run_backtest_simulation
from app.models.market_data import OHLCV
from app.services.strategy_service import StrategyService
from app.services.backtest_service import BacktestService
from app.services.signal_service import SignalService
from app.repositories.signal_repository import SignalRepository


def test_engine_lookahead_bias_and_next_open_execution():
    # Setup 4 daily bars
    ts1 = datetime(2026, 1, 1)
    ts2 = datetime(2026, 1, 2)
    ts3 = datetime(2026, 1, 3)
    ts4 = datetime(2026, 1, 4)

    bars = [
        {"timestamp": ts1, "open": 100.0, "high": 105.0, "low": 99.0, "close": 104.0, "volume": 1000},
        {"timestamp": ts2, "open": 105.0, "high": 110.0, "low": 104.0, "close": 108.0, "volume": 1000},
        {"timestamp": ts3, "open": 107.0, "high": 112.0, "low": 106.0, "close": 111.0, "volume": 1000},
        {"timestamp": ts4, "open": 110.0, "high": 115.0, "low": 109.0, "close": 114.0, "volume": 1000},
    ]

    # Signal generated at ts1 (BUY)
    signals = {
        ts1: {"id": "sig-1", "signal_type": "BUY", "timestamp": ts1, "price": 104.0}
    }

    # Run simulation
    res = run_backtest_simulation(
        bars=bars,
        signals=signals,
        initial_capital=100000.0,
        execution_timing="NEXT_OPEN",
        position_sizing="FULL_CAPITAL",
        force_close_at_end=False
    )

    trades = res["trade_events"]
    assert len(trades) == 1
    t = trades[0]

    # Verify Look-Ahead protection:
    # Signal was generated at ts1, but execution MUST occur at ts2 Open price (105.0)
    assert t["signal_timestamp"] == ts1
    assert t["execution_timestamp"] == ts2
    assert t["execution_price"] == 105.0
    assert t["side"] == "BUY"
    assert t["quantity"] == pytest.approx(100000.0 / 105.0)


def test_engine_redundant_signals_and_state_machine():
    ts1 = datetime(2026, 1, 1)
    ts2 = datetime(2026, 1, 2)
    ts3 = datetime(2026, 1, 3)
    ts4 = datetime(2026, 1, 4)

    bars = [
        {"timestamp": ts1, "open": 100.0, "close": 100.0},
        {"timestamp": ts2, "open": 102.0, "close": 102.0},
        {"timestamp": ts3, "open": 105.0, "close": 105.0},
        {"timestamp": ts4, "open": 104.0, "close": 104.0},
    ]

    # Multiple signals: ts1 (BUY), ts2 (BUY again - redundant), ts3 (SELL)
    signals = {
        ts1: {"id": "sig-1", "signal_type": "BUY", "timestamp": ts1},
        ts2: {"id": "sig-2", "signal_type": "BUY", "timestamp": ts2},
        ts3: {"id": "sig-3", "signal_type": "SELL", "timestamp": ts3},
    }

    res = run_backtest_simulation(
        bars=bars,
        signals=signals,
        initial_capital=10000.0,
        force_close_at_end=False
    )

    trades = res["trade_events"]
    # Expect only 2 trades: 1 BUY entry (executed at ts2 Open) and 1 SELL exit (executed at ts4 Open)
    assert len(trades) == 2
    assert trades[0]["side"] == "BUY"
    assert trades[0]["execution_timestamp"] == ts2
    assert trades[1]["side"] == "SELL"
    assert trades[1]["execution_timestamp"] == ts4


def test_engine_determinism():
    ts1 = datetime(2026, 1, 1)
    ts2 = datetime(2026, 1, 2)
    ts3 = datetime(2026, 1, 3)
    bars = [
        {"timestamp": ts1, "open": 50.0, "close": 52.0},
        {"timestamp": ts2, "open": 53.0, "close": 55.0},
        {"timestamp": ts3, "open": 54.0, "close": 51.0},
    ]
    signals = {ts1: {"id": "sig-1", "signal_type": "BUY", "timestamp": ts1}}

    run1 = run_backtest_simulation(bars, signals, initial_capital=50000.0)
    run2 = run_backtest_simulation(bars, signals, initial_capital=50000.0)

    assert run1["final_cash"] == run2["final_cash"]
    assert run1["final_portfolio_value"] == run2["final_portfolio_value"]
    assert len(run1["trade_events"]) == len(run2["trade_events"])
    assert len(run1["portfolio_states"]) == len(run2["portfolio_states"])


def test_backtest_service_and_api_integration(client, sqlite_db):
    # 1. Create Instrument
    inst = client.post(
        "/api/v1/instruments",
        json={
            "symbol": "NVDA",
            "name": "Nvidia Corp",
            "asset_type": "EQUITY",
            "exchange": "NASDAQ",
            "currency": "USD"
        }
    ).json()

    # 2. Add market data (80 days with multiple price trend reversals via sine wave)
    import math
    base_date = datetime(2025, 1, 1)
    bars = []
    for i in range(80):
        ts = base_date + timedelta(days=i)
        price = 100.0 + 25.0 * math.sin(i / 4.0)
        bars.append(OHLCV(
            instrument_id=inst["id"],
            timestamp=ts,
            frequency="DAILY",
            open=price,
            high=price + 1.0,
            low=price - 1.0,
            close=price,
            adjusted_close=price,
            volume=5000000.0,
            provider="yahoo_finance"
        ))

    sqlite_db.add_all(bars)
    sqlite_db.commit()

    # 3. Generate and persist Signals
    strat_resp = client.get(
        "/api/v1/strategies/moving-average",
        params={
            "instrument_id": inst["id"],
            "fast_window": 10,
            "slow_window": 20
        }
    ).json()

    sig_service = SignalService(sqlite_db)
    config_id, created, skipped = sig_service.persist_moving_average_signals(
        instrument_id=inst["id"],
        crossovers=strat_resp["crossovers"],
        ma_type="SMA",
        fast_window=10,
        slow_window=20,
        price_source="adjusted"
    )

    # 4. POST /api/v1/backtests
    backtest_payload = {
        "instrument_id": inst["id"],
        "strategy_configuration_id": config_id,
        "initial_capital": 100000.0,
        "execution_timing": "NEXT_OPEN",
        "position_sizing": "FULL_CAPITAL",
        "commission": 0.001,
        "slippage": 0.0005,
        "direction": "LONG_ONLY"
    }

    resp = client.post("/api/v1/backtests", json=backtest_payload)
    assert resp.status_code == 201
    bt_data = resp.json()

    assert bt_data["id"] is not None
    assert bt_data["instrument_id"] == inst["id"]
    assert bt_data["status"] == "COMPLETED"
    assert bt_data["initial_capital"] == 100000.0
    assert bt_data["trade_count"] > 0
    assert bt_data["portfolio_state_count"] > 0

    # 5. GET /api/v1/backtests/{id}
    detail_resp = client.get(f"/api/v1/backtests/{bt_data['id']}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == bt_data["id"]

    # 6. GET /api/v1/backtests/{id}/trades
    trades_resp = client.get(f"/api/v1/backtests/{bt_data['id']}/trades")
    assert trades_resp.status_code == 200
    trades_list = trades_resp.json()
    assert len(trades_list) == bt_data["trade_count"]
    assert trades_list[0]["side"] in ("BUY", "SELL")

    # 7. GET /api/v1/backtests/{id}/completed-trades
    ct_resp = client.get(f"/api/v1/backtests/{bt_data['id']}/completed-trades")
    assert ct_resp.status_code == 200
    ct_list = ct_resp.json()
    assert len(ct_list) > 0
    first_trade = ct_list[0]
    assert "gross_pnl" in first_trade
    assert "net_pnl" in first_trade
    assert "trade_return" in first_trade
    assert "duration_days" in first_trade

    # 8. GET /api/v1/backtests/{id}/states
    states_resp = client.get(f"/api/v1/backtests/{bt_data['id']}/states")
    assert states_resp.status_code == 200
    states_list = states_resp.json()
    assert len(states_list) == bt_data["portfolio_state_count"]
    assert "unrealized_pnl" in states_list[0]


def test_completed_trade_lifecycle_and_accounting():
    ts1 = datetime(2026, 1, 1)
    ts2 = datetime(2026, 1, 2)
    ts3 = datetime(2026, 1, 3)
    ts4 = datetime(2026, 1, 4)

    bars = [
        {"timestamp": ts1, "open": 100.0, "close": 100.0},
        {"timestamp": ts2, "open": 100.0, "close": 105.0}, # BUY executes at 100.0
        {"timestamp": ts3, "open": 120.0, "close": 120.0}, # SELL signal at ts3
        {"timestamp": ts4, "open": 120.0, "close": 120.0}, # SELL executes at 120.0
    ]

    signals = {
        ts1: {"id": "sig-buy", "signal_type": "BUY", "timestamp": ts1},
        ts3: {"id": "sig-sell", "signal_type": "SELL", "timestamp": ts3},
    }

    res = run_backtest_simulation(
        bars=bars,
        signals=signals,
        initial_capital=100000.0,
        commission=0.001,
        slippage=0.0005,
        force_close_at_end=False
    )

    completed = res["completed_trades"]
    assert len(completed) == 1
    trade = completed[0]

    assert trade["entry_price"] > 100.0  # Slippage increases BUY price
    assert trade["exit_price"] < 120.0   # Slippage decreases SELL price
    assert trade["gross_pnl"] > 0
    assert trade["net_pnl"] < trade["gross_pnl"]  # Costs deducted
    assert trade["total_cost"] > 0
    assert trade["duration_days"] >= 2.0


def test_rejection_logs_for_redundant_signals():
    ts1 = datetime(2026, 1, 1)
    ts2 = datetime(2026, 1, 2)
    bars = [
        {"timestamp": ts1, "open": 100.0, "close": 100.0},
        {"timestamp": ts2, "open": 100.0, "close": 100.0},
    ]

    # SELL signal while FLAT
    signals = {
        ts1: {"id": "sig-sell", "signal_type": "SELL", "timestamp": ts1}
    }

    res = run_backtest_simulation(bars=bars, signals=signals, initial_capital=10000.0)
    rejections = res["rejection_logs"]
    assert len(rejections) == 1
    assert rejections[0]["rejection_reason"] == "NO_OPEN_POSITION"
