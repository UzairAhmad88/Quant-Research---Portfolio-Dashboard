import numpy as np
import pandas as pd

def volatility(returns: pd.Series, periods_per_year: int = 252) -> dict:
    daily = returns.dropna().std()
    return {
        "daily": float(daily),
        "annualized": float(daily * np.sqrt(periods_per_year)),
    }

def rolling_volatility(returns: pd.Series, window: int = 20, periods_per_year: int = 252):
    return returns.rolling(window).std() * np.sqrt(periods_per_year)
