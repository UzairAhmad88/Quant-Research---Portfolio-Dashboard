import numpy as np
import pandas as pd
import pytest

from app.analytics.strategies.moving_average_calculator import calculate_sma, calculate_ema


def test_calculate_sma_values_and_offsets():
    prices = pd.Series([10.0, 20.0, 30.0, 40.0, 50.0])
    window = 3

    sma = calculate_sma(prices, window=window)

    # First window - 1 (2) values must be NaN
    assert pd.isna(sma.iloc[0])
    assert pd.isna(sma.iloc[1])

    # Index 2: (10 + 20 + 30) / 3 = 20.0
    assert pytest.approx(sma.iloc[2], abs=1e-5) == 20.0
    # Index 3: (20 + 30 + 40) / 3 = 30.0
    assert pytest.approx(sma.iloc[3], abs=1e-5) == 30.0
    # Index 4: (30 + 40 + 50) / 3 = 40.0
    assert pytest.approx(sma.iloc[4], abs=1e-5) == 40.0


def test_calculate_ema_values_and_offsets():
    prices = pd.Series([10.0, 20.0, 30.0, 40.0, 50.0])
    window = 3

    ema = calculate_ema(prices, window=window)

    # First window - 1 (2) values must be NaN
    assert pd.isna(ema.iloc[0])
    assert pd.isna(ema.iloc[1])
    assert not pd.isna(ema.iloc[2])


def test_constant_prices_sma_ema_equality():
    prices = pd.Series([100.0] * 10)
    sma = calculate_sma(prices, window=5)
    ema = calculate_ema(prices, window=5)

    # After warm-up period, SMA and EMA must both equal 100.0
    for i in range(4, 10):
        assert pytest.approx(sma.iloc[i], abs=1e-6) == 100.0
        assert pytest.approx(ema.iloc[i], abs=1e-6) == 100.0


def test_empty_series_handling():
    empty_prices = pd.Series([], dtype=float)
    assert calculate_sma(empty_prices, 5).empty
    assert calculate_ema(empty_prices, 5).empty
