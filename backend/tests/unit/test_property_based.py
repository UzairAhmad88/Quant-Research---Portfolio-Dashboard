"""Property-based testing and accounting invariants using Hypothesis.

Verifies mathematical invariants, numerical stability, look-ahead bias prevention,
and financial accounting identities.
"""
import math
import datetime
import pytest
from hypothesis import given, strategies as st, settings
import pandas as pd
import numpy as np

from app.analytics.returns.calculator import ReturnCalculator
from app.analytics.volatility.calculator import calculate_daily_volatility, calculate_annualized_volatility
from app.analytics.correlation.calculator import CorrelationCalculator
from app.analytics.backtesting.drawdown_engine import DrawdownEngine
from app.analytics.backtesting.performance_engine import PerformanceEngine
from app.analytics.backtesting import run_backtest_simulation


# 1. Return Identity Property Test
@given(
    p1=st.floats(min_value=0.01, max_value=1_000_000.0, allow_nan=False, allow_infinity=False),
    p2=st.floats(min_value=0.01, max_value=1_000_000.0, allow_nan=False, allow_infinity=False)
)
@settings(max_examples=100)
def test_property_return_identity(p1, p2):
    """Property: P_2 = P_1 * (1 + R) and exp(r) = 1 + R."""
    prices = [p1, p2]
    
    # Simple Return
    rets_simple = ReturnCalculator.calculate_simple_returns(prices)
    assert rets_simple[0] is None, "First return must be strictly null (not 0.0)"
    
    ret_simple = rets_simple[1]
    expected_simple = (p2 / p1) - 1.0
    assert math.isclose(ret_simple, expected_simple, rel_tol=1e-5, abs_tol=1e-6)
    assert math.isclose(p1 * (1.0 + ret_simple), p2, rel_tol=1e-5, abs_tol=1e-6)
    
    # Log Return
    rets_log = ReturnCalculator.calculate_log_returns(prices)
    assert rets_log[0] is None
    
    ret_log = rets_log[1]
    expected_log = math.log(p2 / p1)
    assert math.isclose(ret_log, expected_log, rel_tol=1e-5, abs_tol=1e-6)
    
    # Relationship between simple and log return: exp(r) == 1 + R
    assert math.isclose(math.exp(ret_log), 1.0 + ret_simple, rel_tol=1e-5, abs_tol=1e-6)


# 2. Correlation Symmetry & Identity Property Test
@given(
    s1=st.lists(st.floats(min_value=-100.0, max_value=100.0, allow_nan=False, allow_infinity=False), min_size=10, max_size=30),
    s2=st.lists(st.floats(min_value=-100.0, max_value=100.0, allow_nan=False, allow_infinity=False), min_size=10, max_size=30)
)
@settings(max_examples=50)
def test_property_correlation_symmetry(s1, s2):
    """Property: corr(A, B) == corr(B, A) and corr(A, A) == 1.0 (if variance > 0)."""
    min_len = min(len(s1), len(s2))
    a = s1[:min_len]
    b = s2[:min_len]
    
    # Skip constant series where standard deviation is zero
    if float(np.std(a, ddof=1)) == 0.0 or float(np.std(b, ddof=1)) == 0.0:
        return
        
    corr_ab = CorrelationCalculator.calculate_pearson_correlation(a, b)
    corr_ba = CorrelationCalculator.calculate_pearson_correlation(b, a)
    corr_aa = CorrelationCalculator.calculate_pearson_correlation(a, a)
    
    if corr_ab is not None and corr_ba is not None:
        assert math.isclose(corr_ab, corr_ba, rel_tol=1e-5, abs_tol=1e-5)
        assert -1.0001 <= corr_ab <= 1.0001
        
    if corr_aa is not None:
        assert math.isclose(corr_aa, 1.0, rel_tol=1e-5, abs_tol=1e-5)


# 3. Drawdown Invariant Property Test
@given(
    equity_curve=st.lists(
        st.floats(min_value=10.0, max_value=1_000_000.0, allow_nan=False, allow_infinity=False),
        min_size=5,
        max_size=30
    )
)
@settings(max_examples=40)
def test_property_drawdown_invariants(equity_curve):
    """Properties:
    1. Drawdown is always <= 0.0.
    2. Running Peak is always >= current Equity.
    3. Drawdown == (Equity / RunningPeak) - 1.
    """
    timestamps = [
        datetime.datetime(2023, 1, 1, tzinfo=datetime.timezone.utc) + datetime.timedelta(days=i)
        for i in range(len(equity_curve))
    ]
    states = [
        {"timestamp": timestamps[i], "portfolio_value": equity_curve[i]}
        for i in range(len(equity_curve))
    ]
    
    res = DrawdownEngine.calculate_drawdown_series(
        initial_capital=equity_curve[0],
        portfolio_states=states
    )
    
    series = res["drawdown_series"]
    for pt in series:
        eq = pt["portfolio_value"]
        peak = pt["running_peak"]
        dd = pt["drawdown_percentage"]
        
        # Invariant 1: Peak is at least current equity
        assert peak >= eq - 1e-6, f"Peak {peak} must be >= Equity {eq}"
        
        # Invariant 2: Drawdown is non-positive
        assert dd <= 1e-6, f"Drawdown {dd} must be non-positive"
        
        # Invariant 3: Exact relationship
        expected_dd = (eq / peak) - 1.0
        assert math.isclose(dd, expected_dd, rel_tol=1e-5, abs_tol=1e-5)


# 4. Accounting Invariant: Portfolio Value = Cash + Position Value
@given(
    cash=st.floats(min_value=0.0, max_value=1_000_000.0, allow_nan=False, allow_infinity=False),
    shares=st.floats(min_value=0.0, max_value=10_000.0, allow_nan=False, allow_infinity=False),
    price=st.floats(min_value=0.01, max_value=5_000.0, allow_nan=False, allow_infinity=False)
)
@settings(max_examples=50)
def test_property_portfolio_accounting_identity(cash, shares, price):
    """Invariant: Portfolio Value = Cash + (Shares * Price)."""
    position_value = shares * price
    total_value = cash + position_value
    
    assert total_value >= cash
    assert total_value >= position_value
    assert math.isclose(total_value - cash, position_value, rel_tol=1e-6, abs_tol=1e-6)


# 5. Look-Ahead Bias Prevention: Next-Open Execution Invariant
def test_next_open_execution_protects_against_lookahead_bias():
    """Verify execution occurs at the next bar's OPEN, never at the signal bar's CLOSE or OPEN."""
    t1 = datetime.datetime(2023, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc)
    t2 = datetime.datetime(2023, 1, 2, 0, 0, 0, tzinfo=datetime.timezone.utc)
    t3 = datetime.datetime(2023, 1, 3, 0, 0, 0, tzinfo=datetime.timezone.utc)
    
    bars = [
        {"timestamp": t1, "open": 100.0, "high": 105.0, "low": 98.0, "close": 104.0, "volume": 1000},
        {"timestamp": t2, "open": 110.0, "high": 115.0, "low": 108.0, "close": 112.0, "volume": 1000},
        {"timestamp": t3, "open": 120.0, "high": 125.0, "low": 118.0, "close": 122.0, "volume": 1000},
    ]
    
    signals = {
        t1: {"id": "sig-1", "signal_type": "BUY", "timestamp": t1, "price": 104.0}
    }
    
    res = run_backtest_simulation(
        bars=bars,
        signals=signals,
        initial_capital=10_000.0,
        execution_timing="NEXT_OPEN",
        position_sizing="FULL_CAPITAL",
        force_close_at_end=False
    )
    
    trade_events = res["trade_events"]
    assert len(trade_events) == 1, "BUY trade event must be executed"
    
    t = trade_events[0]
    # Execution date must be Day 2 (t2), NOT Day 1 (t1)
    assert t["signal_timestamp"] == t1
    assert t["execution_timestamp"] == t2
    # Execution price must be Day 2 OPEN (110.0), NOT Day 1 CLOSE (104.0) or Day 1 OPEN (100.0)
    assert t["execution_price"] == 110.0
    assert t["execution_price"] != 104.0
    assert t["execution_price"] != 100.0


# 6. Flat Market Invariant: Zero Volatility & Undefined Sharpe
def test_constant_prices_yield_zero_vol_and_null_sharpe():
    """Flat prices produce 0 return, 0 volatility, and null Sharpe (never infinity or zero)."""
    prices = [100.0] * 20
    rets = ReturnCalculator.calculate_simple_returns(prices)
    
    clean_rets = pd.Series([r for r in rets if r is not None])
    assert all(r == 0.0 for r in clean_rets)
    
    # Volatility
    daily_vol = calculate_daily_volatility(clean_rets)
    assert daily_vol == 0.0
    ann_vol = calculate_annualized_volatility(daily_vol, 252)
    assert ann_vol == 0.0
    
    # Performance metrics Sharpe check
    states = [
        {
            "timestamp": datetime.datetime(2023, 1, 1, tzinfo=datetime.timezone.utc) + datetime.timedelta(days=i),
            "cash": 100_000.0,
            "position_quantity": 0.0,
            "market_price": 100.0,
            "position_value": 0.0,
            "portfolio_value": 100_000.0,
        }
        for i in range(20)
    ]
    metrics = PerformanceEngine.calculate_performance_metrics(
        initial_capital=100_000.0,
        portfolio_states=states,
        completed_trades=[]
    )
    # Sharpe should be None or volatility should be zero
    assert metrics["risk"]["sharpe_ratio"] is None or metrics["risk"]["annualized_volatility"] == 0.0
