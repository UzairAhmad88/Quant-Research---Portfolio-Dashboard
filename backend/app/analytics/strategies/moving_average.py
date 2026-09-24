from datetime import datetime
from typing import List, Dict, Any, Optional
import pandas as pd

from app.analytics.strategies.moving_average_calculator import calculate_sma, calculate_ema
from app.analytics.strategies.crossover_detector import detect_crossovers


def run_moving_average_strategy(
    prices: pd.Series,
    timestamps: List[datetime],
    ma_type: str = "sma",
    fast_window: int = 20,
    slow_window: int = 50
) -> Dict[str, Any]:
    """
    Executes Moving Average Crossover Strategy on a validated price series.
    
    Args:
        prices: pandas Series of prices.
        timestamps: List of UTC observation timestamps.
        ma_type: 'sma' or 'ema'.
        fast_window: Fast MA window observation count.
        slow_window: Slow MA window observation count.
        
    Returns:
        Dict containing summary, crossover events list, and full observations series.
    """
    clean_ma_type = ma_type.lower().strip()
    if clean_ma_type not in ("sma", "ema"):
        clean_ma_type = "sma"

    # 1. Calculate Moving Averages
    if clean_ma_type == "ema":
        fast_series = calculate_ema(prices, fast_window)
        slow_series = calculate_ema(prices, slow_window)
    else:
        fast_series = calculate_sma(prices, fast_window)
        slow_series = calculate_sma(prices, slow_window)

    # 2. Detect Crossovers & Signals
    (
        signals,
        crossover_events,
        current_state,
        latest_signal_event,
        last_crossover_ts,
        bullish_count,
        bearish_count
    ) = detect_crossovers(
        fast_ma=fast_series,
        slow_ma=slow_series,
        prices=prices,
        timestamps=timestamps
    )

    # 3. Build Observations List
    observations: List[Dict[str, Any]] = []
    for i in range(len(prices)):
        p = float(prices.iloc[i])
        f_val = float(fast_series.iloc[i]) if not pd.isna(fast_series.iloc[i]) else None
        s_val = float(slow_series.iloc[i]) if not pd.isna(slow_series.iloc[i]) else None

        observations.append({
            "timestamp": timestamps[i],
            "price": p,
            "fast_ma": f_val,
            "slow_ma": s_val,
            "signal": signals[i]
        })

    return {
        "summary": {
            "ma_type": clean_ma_type.upper(),
            "fast_window": fast_window,
            "slow_window": slow_window,
            "observation_count": len(prices),
            "current_signal": current_state,
            "latest_signal_event": latest_signal_event,
            "last_crossover": last_crossover_ts,
            "bullish_crossover_count": bullish_count,
            "bearish_crossover_count": bearish_count,
        },
        "crossovers": crossover_events,
        "observations": observations
    }
