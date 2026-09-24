import math
import numpy as np
import pandas as pd
import pytest

from app.analytics.volatility import (
    calculate_daily_volatility,
    calculate_annualized_volatility,
    calculate_upside_volatility,
    calculate_downside_volatility,
    calculate_rolling_volatility,
    calculate_return_distribution,
    validate_volatility_inputs,
)


def test_calculate_daily_volatility_sample_std():
    # Array: [0.01, 0.02, 0.03] -> Mean = 0.02, Var(ddof=1) = 0.0001 -> StdDev = 0.01
    returns = pd.Series([0.01, 0.02, 0.03])
    vol = calculate_daily_volatility(returns)
    assert vol is not None
    assert pytest.approx(vol, abs=1e-6) == 0.01


def test_calculate_daily_volatility_insufficient_returns():
    returns_empty = pd.Series([], dtype=float)
    returns_one = pd.Series([0.05])
    assert calculate_daily_volatility(returns_empty) is None
    assert calculate_daily_volatility(returns_one) is None


def test_calculate_annualized_volatility_conventions():
    daily_vol = 0.01
    # Equity convention (252)
    annual_equity = calculate_annualized_volatility(daily_vol, annualization_factor=252)
    assert annual_equity is not None
    assert pytest.approx(annual_equity, abs=1e-5) == 0.01 * np.sqrt(252)

    # Crypto convention (365)
    annual_crypto = calculate_annualized_volatility(daily_vol, annualization_factor=365)
    assert annual_crypto is not None
    assert pytest.approx(annual_crypto, abs=1e-5) == 0.01 * np.sqrt(365)


def test_calculate_rolling_volatility_window_offsets():
    returns = pd.Series([0.01, -0.02, 0.03, 0.01, -0.01, 0.02])
    window = 3

    rolling = calculate_rolling_volatility(returns, window=window, annualization_factor=252, annualized=False)

    # First window-1 (2) observations must be NaN
    assert pd.isna(rolling.iloc[0])
    assert pd.isna(rolling.iloc[1])

    # 3rd observation index 2 (returns [0.01, -0.02, 0.03])
    sub_sample = pd.Series([0.01, -0.02, 0.03])
    expected_std = sub_sample.std(ddof=1)
    assert pytest.approx(rolling.iloc[2], abs=1e-6) == expected_std


def test_calculate_upside_and_downside_volatility():
    # Returns: positive [0.02, 0.04], negative [-0.01, -0.03], zero [0.0]
    returns = pd.Series([0.02, -0.01, 0.0, 0.04, -0.03])

    upside_vol = calculate_upside_volatility(returns)
    assert upside_vol is not None
    # Positive series: [0.02, 0.04] -> mean 0.03, std(ddof=1) = sqrt(2 * (0.01)^2 / 1) = 0.0141421...
    expected_upside = pd.Series([0.02, 0.04]).std(ddof=1)
    assert pytest.approx(upside_vol, abs=1e-6) == expected_upside

    downside_vol = calculate_downside_volatility(returns)
    assert downside_vol is not None
    expected_downside = pd.Series([-0.01, -0.03]).std(ddof=1)
    assert pytest.approx(downside_vol, abs=1e-6) == expected_downside


def test_calculate_return_distribution_stats():
    returns = pd.Series([0.01, 0.02, -0.01, 0.0, 0.03, -0.02])
    dist = calculate_return_distribution(returns, num_bins=10)

    summary = dist["summary"]
    assert summary["total_observations"] == 6
    assert summary["positive_observations"] == 3
    assert summary["negative_observations"] == 2
    assert summary["zero_observations"] == 1
    assert pytest.approx(summary["min"], abs=1e-6) == -0.02
    assert pytest.approx(summary["max"], abs=1e-6) == 0.03

    histogram = dist["histogram"]
    assert len(histogram) == 10
    total_count = sum(b["count"] for b in histogram)
    assert total_count == 6


def test_validate_volatility_inputs():
    short_returns = pd.Series(np.random.randn(25))
    is_valid_short, msg_short = validate_volatility_inputs(short_returns, min_obs=30)
    assert is_valid_short is False
    assert "At least 30 are required" in msg_short

    long_returns = pd.Series(np.random.randn(35))
    is_valid_long, msg_long = validate_volatility_inputs(long_returns, min_obs=30)
    assert is_valid_long is True
    assert msg_long == ""


def test_constant_return_series_zero_volatility():
    constant_returns = pd.Series([0.01] * 40)
    vol = calculate_daily_volatility(constant_returns)
    assert vol is not None
    assert pytest.approx(vol, abs=1e-9) == 0.0
