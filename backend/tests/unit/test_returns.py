import pandas as pd
from app.analytics.returns import simple_returns

def test_simple_returns():
    prices = pd.Series([100, 110, 121])
    result = simple_returns(prices)
    assert result.iloc[1] == 0.10
    assert round(result.iloc[2], 6) == 0.10
