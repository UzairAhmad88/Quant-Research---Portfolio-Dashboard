from typing import Optional
import numpy as np
import pandas as pd


def calculate_rolling_volatility(
    returns: pd.Series,
    window: int = 20,
    annualization_factor: int = 252,
    annualized: bool = True
) -> pd.Series:
    """
    Computes rolling sample standard deviation (ddof=1) over an observation window N.
    The first (window - 1) observations return NaN (null in API response).
    
    Args:
        returns: pandas Series of return values (indexed by timestamp or integer).
        window: Number of return observations in rolling window (e.g. 10, 20, 30, 60, 90, 120, 252).
        annualization_factor: 252 for equities/ETFs/indices, 365 for crypto.
        annualized: If True, scales rolling std dev by sqrt(annualization_factor).
        
    Returns:
        pd.Series of rolling volatility values, preserving the input index.
    """
    if returns.empty or window <= 1:
        return pd.Series(index=returns.index, dtype=float)
        
    rolling_std = returns.rolling(window=window, min_periods=window).std(ddof=1)
    
    if annualized:
        scaling_factor = np.sqrt(annualization_factor)
        rolling_std = rolling_std * scaling_factor
        
    return rolling_std
