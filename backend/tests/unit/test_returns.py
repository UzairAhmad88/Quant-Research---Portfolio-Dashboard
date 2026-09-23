import pandas as pd
import pytest
from app.analytics.returns import simple_returns

def test_simple_returns():
    prices = pd.Series([100, 110, 121])
    result = simple_returns(prices)
    assert result.iloc[1] == pytest.approx(0.10)
    assert result.iloc[2] == pytest.approx(0.10)
