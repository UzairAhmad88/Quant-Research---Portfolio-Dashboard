import pandas as pd
import pytest
from app.analytics.portfolio import portfolio_returns

def test_portfolio_weights():
    returns = pd.DataFrame({"A": [0.1], "B": [0.2]})
    result = portfolio_returns(returns, {"A": 0.5, "B": 0.5})
    assert result.iloc[0] == pytest.approx(0.15)
