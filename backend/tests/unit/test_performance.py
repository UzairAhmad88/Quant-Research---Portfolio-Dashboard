import pandas as pd
from app.analytics.performance import max_drawdown

def test_max_drawdown():
    equity = pd.Series([100, 120, 90, 110])
    assert round(max_drawdown(equity), 6) == -0.25
