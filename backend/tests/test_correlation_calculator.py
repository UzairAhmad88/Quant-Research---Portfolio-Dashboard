import pytest
import numpy as np
import pandas as pd
from app.analytics.correlation import CorrelationCalculator

def test_calculate_pearson_correlation_perfect_positive():
    a = [1.0, 2.0, 3.0, 4.0, 5.0]
    b = [2.0, 4.0, 6.0, 8.0, 10.0]
    res = CorrelationCalculator.calculate_pearson_correlation(a, b)
    assert res == pytest.approx(1.0)

def test_calculate_pearson_correlation_perfect_negative():
    a = [1.0, 2.0, 3.0, 4.0, 5.0]
    b = [5.0, 4.0, 3.0, 2.0, 1.0]
    res = CorrelationCalculator.calculate_pearson_correlation(a, b)
    assert res == pytest.approx(-1.0)

def test_calculate_pearson_correlation_constant_series():
    a = [1.0, 2.0, 3.0, 4.0, 5.0]
    b = [3.0, 3.0, 3.0, 3.0, 3.0]  # std = 0
    res = CorrelationCalculator.calculate_pearson_correlation(a, b)
    assert res is None

def test_calculate_correlation_matrix_properties():
    df = pd.DataFrame({
        "AAPL": [0.01, -0.02, 0.03, 0.01, -0.01],
        "MSFT": [0.02, -0.01, 0.02, 0.015, -0.005],
        "BTC":  [-0.05, 0.04, -0.01, 0.02, 0.03]
    })
    symbols, matrix = CorrelationCalculator.calculate_correlation_matrix(df)

    assert symbols == ["AAPL", "MSFT", "BTC"]
    assert len(matrix) == 3

    # Check diagonal == 1.0
    for i in range(3):
        assert matrix[i][i] == pytest.approx(1.0)

    # Check symmetry rho(i, j) == rho(j, i)
    for i in range(3):
        for j in range(3):
            assert matrix[i][j] == matrix[j][i]

def test_calculate_rolling_correlation():
    series_a = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]
    series_b = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]
    timestamps = list(range(10))

    window = 5
    rolling_res = CorrelationCalculator.calculate_rolling_correlation(series_a, series_b, timestamps, window)

    assert len(rolling_res) == 10
    # First window - 1 elements should be None
    for i in range(window - 1):
        assert rolling_res[i][1] is None

    # Remaining elements should be 1.0
    for i in range(window - 1, 10):
        assert rolling_res[i][1] == pytest.approx(1.0)

def test_correlation_interpretations():
    assert CorrelationCalculator.get_correlation_interpretation(0.95) == "Very Strong Positive"
    assert CorrelationCalculator.get_correlation_interpretation(0.65) == "Strong Positive"
    assert CorrelationCalculator.get_correlation_interpretation(0.0) == "Very Weak / Near Zero"
    assert CorrelationCalculator.get_correlation_interpretation(-0.85) == "Very Strong Negative"
    assert CorrelationCalculator.get_correlation_interpretation(None) == "Undefined / Insufficient Variance"
