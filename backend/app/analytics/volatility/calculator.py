import math
from typing import Optional
import numpy as np
import pandas as pd


def calculate_daily_volatility(returns: pd.Series) -> Optional[float]:
    """
    Calculates sample standard deviation (ddof=1) of a return series.
    Returns None if fewer than 2 valid return observations exist.
    """
    clean_returns = returns.dropna()
    if len(clean_returns) < 2:
        return None
    val = float(clean_returns.std(ddof=1))
    return val if not math.isnan(val) else None


def calculate_annualized_volatility(
    daily_vol: Optional[float], annualization_factor: int = 252
) -> Optional[float]:
    """
    Annualizes daily volatility by scaling by sqrt(annualization_factor).
    Equity/ETF/Index default: 252 trading days.
    Crypto default: 365 calendar days.
    """
    if daily_vol is None or math.isnan(daily_vol):
        return None
    return float(daily_vol * np.sqrt(annualization_factor))


def calculate_upside_volatility(returns: pd.Series) -> Optional[float]:
    """
    Calculates sample standard deviation (ddof=1) of strictly positive returns (r > 0).
    Returns None if fewer than 2 positive observations exist.
    """
    clean_returns = returns.dropna()
    upside = clean_returns[clean_returns > 0.0]
    if len(upside) < 2:
        return None
    val = float(upside.std(ddof=1))
    return val if not math.isnan(val) else None


def calculate_downside_volatility(returns: pd.Series) -> Optional[float]:
    """
    Calculates sample standard deviation (ddof=1) of strictly negative returns (r < 0).
    Returns None if fewer than 2 negative observations exist.
    Note: Analyzes distribution of observed negative returns (r < 0), distinct from downside deviation relative to a MAR target.
    """
    clean_returns = returns.dropna()
    downside = clean_returns[clean_returns < 0.0]
    if len(downside) < 2:
        return None
    val = float(downside.std(ddof=1))
    return val if not math.isnan(val) else None
