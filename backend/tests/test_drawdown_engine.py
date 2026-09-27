import pytest
from datetime import datetime, timedelta
from app.analytics.backtesting.drawdown_engine import DrawdownEngine


def test_drawdown_series_calculation():
    timestamps = [datetime(2026, 1, 1) + timedelta(days=i) for i in range(5)]
    # Peak = 120,000, Trough = 90,000 (-25% DD)
    values = [100000.0, 120000.0, 90000.0, 105000.0, 120000.0]

    states = [
        {
            "timestamp": timestamps[i],
            "portfolio_value": values[i]
        }
        for i in range(5)
    ]

    res = DrawdownEngine.calculate_drawdown_series(
        initial_capital=100000.0,
        portfolio_states=states
    )

    assert res["max_drawdown"] == pytest.approx(-0.25)
    assert res["max_drawdown_duration_days"] == pytest.approx(3.0)  # Peak at t1 (Jan 2), recovery at t4 (Jan 5)
    assert res["current_drawdown"] == pytest.approx(0.0)
    assert res["current_status"] == "AT_PEAK"
    assert len(res["drawdown_series"]) == 5

    # Check third observation (trough at 90,000)
    pt3 = res["drawdown_series"][2]
    assert pt3["running_peak"] == 120000.0
    assert pt3["drawdown_amount"] == -30000.0
    assert pt3["drawdown_percentage"] == pytest.approx(-0.25)


def test_drawdown_period_detection_recovered_and_active():
    timestamps = [datetime(2026, 1, 1) + timedelta(days=i) for i in range(7)]
    # Peak 1 = 100, Trough 1 = 80, Recovery = 110 at t3
    # Peak 2 = 110 at t3, Decline to 90 at t5 (active at t6)
    values = [100.0, 80.0, 90.0, 110.0, 100.0, 90.0, 95.0]

    states = [
        {
            "timestamp": timestamps[i],
            "portfolio_value": values[i]
        }
        for i in range(7)
    ]

    periods = DrawdownEngine.detect_drawdown_periods(
        initial_capital=100.0,
        portfolio_states=states
    )

    assert len(periods) == 2

    # Periods are sorted by depth: Period 1 (-20.0%), Period 2 (-18.18%)
    p1 = periods[0]
    assert p1["status"] == "RECOVERED"
    assert p1["peak_equity"] == 100.0
    assert p1["trough_equity"] == 80.0
    assert p1["drawdown_percentage"] == pytest.approx(-0.20)
    assert p1["duration_days"] == pytest.approx(3.0)  # Jan 1 to Jan 4

    p2 = periods[1]
    assert p2["status"] == "ACTIVE"
    assert p2["peak_equity"] == 110.0
    assert p2["trough_equity"] == 90.0
    assert p2["drawdown_percentage"] == pytest.approx(-0.181818, abs=1e-4)
    assert p2["recovery_timestamp"] is None


def test_drawdown_flat_equity_no_periods():
    timestamps = [datetime(2026, 1, 1) + timedelta(days=i) for i in range(3)]
    states = [
        {"timestamp": timestamps[i], "portfolio_value": 100000.0}
        for i in range(3)
    ]

    res = DrawdownEngine.calculate_drawdown_series(100000.0, states)
    assert res["max_drawdown"] == 0.0
    assert res["current_status"] == "AT_PEAK"

    periods = DrawdownEngine.detect_drawdown_periods(100000.0, states)
    assert len(periods) == 0
