import pytest
from datetime import datetime, timedelta
import numpy as np

from app.analytics.backtesting.performance_engine import PerformanceEngine


def test_performance_engine_returns_and_equity():
    ts1 = datetime(2026, 1, 1)
    ts2 = datetime(2026, 1, 2)
    ts3 = datetime(2026, 1, 3)

    portfolio_states = [
        {
            "timestamp": ts1,
            "cash": 100000.0,
            "position_quantity": 0.0,
            "market_price": 100.0,
            "position_value": 0.0,
            "portfolio_value": 100000.0,
        },
        {
            "timestamp": ts2,
            "cash": 0.0,
            "position_quantity": 1000.0,
            "market_price": 110.0,
            "position_value": 110000.0,
            "portfolio_value": 110000.0,
        },
        {
            "timestamp": ts3,
            "cash": 120000.0,
            "position_quantity": 0.0,
            "market_price": 120.0,
            "position_value": 0.0,
            "portfolio_value": 120000.0,
        }
    ]

    metrics = PerformanceEngine.calculate_performance_metrics(
        initial_capital=100000.0,
        portfolio_states=portfolio_states,
        completed_trades=[]
    )

    ret = metrics["returns"]
    assert ret["total_return"] == pytest.approx(0.20)
    assert ret["observation_count"] == 3
    assert ret["elapsed_days"] == pytest.approx(2.0)
    assert ret["annualized_return"] is not None
    assert ret["annualized_return"] > 0.20  # CAGR over 2 days compound to a large annual number


def test_performance_engine_risk_metrics():
    # 5 observations
    timestamps = [datetime(2026, 1, 1) + timedelta(days=i) for i in range(5)]
    values = [100000.0, 102000.0, 101000.0, 105000.0, 104000.0]

    states = [
        {
            "timestamp": timestamps[i],
            "cash": values[i],
            "position_quantity": 0.0,
            "market_price": 100.0,
            "position_value": 0.0,
            "portfolio_value": values[i],
        }
        for i in range(5)
    ]

    metrics = PerformanceEngine.calculate_performance_metrics(
        initial_capital=100000.0,
        portfolio_states=states,
        completed_trades=[]
    )

    risk = metrics["risk"]
    assert risk["volatility"] is not None
    assert risk["volatility"] > 0
    assert risk["annualized_volatility"] == pytest.approx(risk["volatility"] * np.sqrt(252))
    assert risk["sharpe_ratio"] is not None
    assert risk["sortino_ratio"] is not None


def test_performance_engine_drawdown_calculation():
    timestamps = [datetime(2026, 1, 1) + timedelta(days=i) for i in range(5)]
    # Peak = 120,000, Trough = 90,000 (-25% DD)
    values = [100000.0, 120000.0, 90000.0, 105000.0, 120000.0]

    states = [
        {
            "timestamp": timestamps[i],
            "cash": values[i],
            "position_quantity": 0.0,
            "market_price": 100.0,
            "position_value": 0.0,
            "portfolio_value": values[i],
        }
        for i in range(5)
    ]

    metrics = PerformanceEngine.calculate_performance_metrics(
        initial_capital=100000.0,
        portfolio_states=states,
        completed_trades=[]
    )

    dd = metrics["drawdown"]
    assert dd["max_drawdown"] == pytest.approx(-0.25)
    assert dd["max_drawdown_duration_days"] >= 2.0  # Peak at t1, recovery at t4 (3 days)


def test_performance_engine_trade_metrics_and_costs():
    completed_trades = [
        {
            "id": "t1",
            "net_pnl": 2000.0,
            "trade_return": 0.02,
            "entry_notional": 100000.0,
            "entry_commission": 10.0,
            "exit_commission": 10.0,
            "entry_slippage": 5.0,
            "exit_slippage": 5.0,
            "entry_timestamp": datetime(2026, 1, 1),
            "exit_timestamp": datetime(2026, 1, 2),
        },
        {
            "id": "t2",
            "net_pnl": -1000.0,
            "trade_return": -0.01,
            "entry_notional": 100000.0,
            "entry_commission": 10.0,
            "exit_commission": 10.0,
            "entry_slippage": 5.0,
            "exit_slippage": 5.0,
            "entry_timestamp": datetime(2026, 1, 3),
            "exit_timestamp": datetime(2026, 1, 4),
        }
    ]

    states = [
        {
            "timestamp": datetime(2026, 1, i+1),
            "cash": 100000.0 + (i * 200.0),
            "position_quantity": 0.0,
            "market_price": 100.0,
            "position_value": 0.0,
            "portfolio_value": 100000.0 + (i * 200.0),
        }
        for i in range(5)
    ]

    metrics = PerformanceEngine.calculate_performance_metrics(
        initial_capital=100000.0,
        portfolio_states=states,
        completed_trades=completed_trades
    )

    tr = metrics["trading"]
    assert tr["trade_count"] == 2
    assert tr["win_rate"] == pytest.approx(0.5)
    assert tr["average_win"] == pytest.approx(2000.0)
    assert tr["average_loss"] == pytest.approx(-1000.0)
    assert tr["profit_factor"] == pytest.approx(2.0)
    assert tr["average_trade_return"] == pytest.approx(0.005)
    assert tr["best_trade"]["net_pnl"] == 2000.0
    assert tr["worst_trade"]["net_pnl"] == -1000.0

    costs = metrics["costs_and_exposure"]
    assert costs["total_commission"] == pytest.approx(40.0)
    assert costs["total_slippage_cost"] == pytest.approx(20.0)
    assert costs["total_transaction_costs"] == pytest.approx(60.0)


def test_performance_engine_undefined_edge_cases():
    # 1. Zero trades -> all trade metrics should be None
    states = [
        {
            "timestamp": datetime(2026, 1, 1),
            "cash": 100000.0,
            "position_quantity": 0.0,
            "market_price": 100.0,
            "position_value": 0.0,
            "portfolio_value": 100000.0,
        },
        {
            "timestamp": datetime(2026, 1, 2),
            "cash": 100000.0,
            "position_quantity": 0.0,
            "market_price": 100.0,
            "position_value": 0.0,
            "portfolio_value": 100000.0,
        },
        {
            "timestamp": datetime(2026, 1, 3),
            "cash": 100000.0,
            "position_quantity": 0.0,
            "market_price": 100.0,
            "position_value": 0.0,
            "portfolio_value": 100000.0,
        }
    ]

    metrics = PerformanceEngine.calculate_performance_metrics(
        initial_capital=100000.0,
        portfolio_states=states,
        completed_trades=[]
    )

    tr = metrics["trading"]
    assert tr["trade_count"] == 0
    assert tr["win_rate"] is None
    assert tr["average_win"] is None
    assert tr["average_loss"] is None
    assert tr["profit_factor"] is None

    # Zero volatility -> Sharpe should be None
    risk = metrics["risk"]
    assert risk["volatility"] == pytest.approx(0.0)
    assert risk["sharpe_ratio"] is None
    assert risk["sortino_ratio"] is None

    # Zero max drawdown -> Calmar should be None
    dd = metrics["drawdown"]
    assert dd["max_drawdown"] == pytest.approx(0.0)
    assert dd["calmar_ratio"] is None
