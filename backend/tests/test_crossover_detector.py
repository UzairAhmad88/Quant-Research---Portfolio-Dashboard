from datetime import datetime, timedelta
import pandas as pd
import pytest

from app.analytics.strategies import (
    calculate_sma,
    detect_crossovers,
    run_moving_average_strategy,
)


def test_bullish_and_bearish_crossover_detection():
    # Fast MA: [10, 15, 25, 30, 20, 10]
    # Slow MA: [12, 18, 20, 25, 22, 15]
    # Day 0: Fast (10) < Slow (12) -> NaN / HOLD
    # Day 1: Fast (15) < Slow (18) -> HOLD
    # Day 2: Fast (25) > Slow (20) -> Bullish Crossover! (BUY)
    # Day 3: Fast (30) > Slow (25) -> MAs remain on same side -> HOLD
    # Day 4: Fast (20) < Slow (22) -> Bearish Crossover! (SELL)
    # Day 5: Fast (10) < Slow (15) -> MAs remain on same side -> HOLD

    fast_ma = pd.Series([10.0, 15.0, 25.0, 30.0, 20.0, 10.0])
    slow_ma = pd.Series([12.0, 18.0, 20.0, 25.0, 22.0, 15.0])
    prices = pd.Series([100.0, 105.0, 110.0, 115.0, 108.0, 102.0])
    base_date = datetime(2025, 1, 1)
    timestamps = [base_date + timedelta(days=i) for i in range(6)]

    (
        signals,
        crossovers,
        current_state,
        latest_event,
        last_ts,
        bullish_cnt,
        bearish_cnt,
    ) = detect_crossovers(fast_ma, slow_ma, prices, timestamps)

    assert signals == ["HOLD", "HOLD", "BUY", "HOLD", "SELL", "HOLD"]
    assert len(crossovers) == 2

    # First crossover: BULLISH (BUY)
    assert crossovers[0]["event_type"] == "BULLISH"
    assert crossovers[0]["signal"] == "BUY"
    assert crossovers[0]["timestamp"] == timestamps[2]

    # Second crossover: BEARISH (SELL)
    assert crossovers[1]["event_type"] == "BEARISH"
    assert crossovers[1]["signal"] == "SELL"
    assert crossovers[1]["timestamp"] == timestamps[4]

    assert bullish_cnt == 1
    assert bearish_cnt == 1
    assert current_state == "SELL"
    assert latest_event == "SELL"
    assert last_ts == timestamps[4]


def test_equal_moving_averages_no_false_signals():
    fast_ma = pd.Series([20.0, 20.0, 20.0, 20.0])
    slow_ma = pd.Series([20.0, 20.0, 20.0, 20.0])
    prices = pd.Series([100.0, 100.0, 100.0, 100.0])
    timestamps = [datetime(2025, 1, 1) + timedelta(days=i) for i in range(4)]

    signals, crossovers, current_state, _, _, bullish_cnt, bearish_cnt = detect_crossovers(
        fast_ma, slow_ma, prices, timestamps
    )

    assert signals == ["HOLD", "HOLD", "HOLD", "HOLD"]
    assert len(crossovers) == 0
    assert bullish_cnt == 0
    assert bearish_cnt == 0
    assert current_state == "HOLD"


def test_strict_look_ahead_bias_prevention():
    """
    Mandatory Test: Verifies that changing future price observations (t+k)
    CANNOT alter historical signals generated at observation t.
    """
    base_date = datetime(2025, 1, 1)

    # 1. Base price series (20 observations)
    prices_original = [100.0 + (i * 2.0) if i < 10 else 120.0 - ((i - 10) * 3.0) for i in range(20)]
    timestamps = [base_date + timedelta(days=i) for i in range(20)]

    res_original = run_moving_average_strategy(
        prices=pd.Series(prices_original),
        timestamps=timestamps,
        ma_type="sma",
        fast_window=3,
        slow_window=5,
    )

    # Record signal and crossover history up to index 7
    signal_at_t7_orig = res_original["observations"][7]["signal"]
    crossovers_up_to_t7_orig = [
        c for c in res_original["crossovers"] if c["timestamp"] <= timestamps[7]
    ]

    # 2. Construct modified price series with extreme future price spike at index 15 (future observation)
    prices_modified = list(prices_original)
    prices_modified[15] = 99999.0  # Massive future price shock

    res_modified = run_moving_average_strategy(
        prices=pd.Series(prices_modified),
        timestamps=timestamps,
        ma_type="sma",
        fast_window=3,
        slow_window=5,
    )

    signal_at_t7_mod = res_modified["observations"][7]["signal"]
    crossovers_up_to_t7_mod = [
        c for c in res_modified["crossovers"] if c["timestamp"] <= timestamps[7]
    ]

    # 3. Assert strict equality at time t=7
    assert signal_at_t7_orig == signal_at_t7_mod
    assert len(crossovers_up_to_t7_orig) == len(crossovers_up_to_t7_mod)
    for orig_c, mod_c in zip(crossovers_up_to_t7_orig, crossovers_up_to_t7_mod):
        assert orig_c["event_type"] == mod_c["event_type"]
        assert orig_c["price"] == mod_c["price"]
        assert orig_c["timestamp"] == mod_c["timestamp"]
