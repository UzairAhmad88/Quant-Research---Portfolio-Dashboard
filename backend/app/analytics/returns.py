import numpy as np
import pandas as pd

def simple_returns(close: pd.Series) -> pd.Series:
    return close.pct_change()

def log_returns(close: pd.Series) -> pd.Series:
    return np.log(close / close.shift(1))

def cumulative_return(returns: pd.Series) -> pd.Series:
    return (1 + returns.fillna(0)).cumprod() - 1
