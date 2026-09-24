import numpy as np
import pandas as pd


def calculate_sma(prices: pd.Series, window: int) -> pd.Series:
    """
    Calculates Simple Moving Average (SMA) over a rolling window.
    
    Formula:
        SMA_t = (P_t + P_(t-1) + ... + P_(t-n+1)) / n
        
    Initial (window - 1) entries return NaN.
    """
    if prices.empty or window <= 0:
        return pd.Series(index=prices.index, dtype=float)
        
    return prices.rolling(window=window, min_periods=window).mean()


def calculate_ema(prices: pd.Series, window: int) -> pd.Series:
    """
    Calculates Exponential Moving Average (EMA) over a window n.
    
    Formula:
        EMA_t = alpha * P_t + (1 - alpha) * EMA_(t-1)
        alpha = 2 / (n + 1)
        
    Initial (window - 1) entries return NaN.
    """
    if prices.empty or window <= 0:
        return pd.Series(index=prices.index, dtype=float)
        
    # min_periods=window ensures warm-up observations before window entries return NaN
    return prices.ewm(span=window, min_periods=window, adjust=False).mean()
