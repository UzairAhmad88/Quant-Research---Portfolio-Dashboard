import numpy as np
import pandas as pd

def max_drawdown(equity: pd.Series) -> float:
    peak = equity.cummax()
    drawdown = equity / peak - 1
    return float(drawdown.min())

def total_return(equity: pd.Series) -> float:
    if equity.empty:
        return 0.0
    return float(equity.iloc[-1] / equity.iloc[0] - 1)

def sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.0, periods_per_year: int = 252) -> float:
    r = returns.dropna()
    if r.std() == 0 or r.empty:
        return 0.0
    rf_period = (1 + risk_free_rate) ** (1 / periods_per_year) - 1
    return float((r.mean() - rf_period) / r.std() * np.sqrt(periods_per_year))
