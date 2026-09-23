import pytest
from app.analytics.returns import ReturnCalculator

def test_simple_returns():
    prices = [100.0, 110.0, 121.0]
    result = ReturnCalculator.calculate_simple_returns(prices)
    assert result[0] is None
    assert result[1] == pytest.approx(0.10)
    assert result[2] == pytest.approx(0.10)
