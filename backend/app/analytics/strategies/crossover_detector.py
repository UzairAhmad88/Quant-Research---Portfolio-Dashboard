from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
import pandas as pd


def detect_crossovers(
    fast_ma: pd.Series,
    slow_ma: pd.Series,
    prices: pd.Series,
    timestamps: List[datetime]
) -> Tuple[List[str], List[Dict[str, Any]], Optional[str], Optional[str], Optional[datetime], int, int]:
    """
    Detects bullish and bearish crossover events between Fast MA and Slow MA.
    Strictly avoids look-ahead bias by evaluating signals at observation t using only (t-1) and t.
    
    Args:
        fast_ma: Series of Fast Moving Average values.
        slow_ma: Series of Slow Moving Average values.
        prices: Series of asset price values.
        timestamps: List of UTC observation timestamps.
        
    Returns:
        Tuple containing:
        - signals: List[str] ('BUY', 'SELL', 'HOLD' per observation)
        - crossover_events: List[Dict] (metadata for actual BUY/SELL crossover events)
        - current_state: Optional[str] ('BUY', 'SELL', or 'HOLD')
        - latest_signal_event: Optional[str] ('BUY' or 'SELL')
        - last_crossover_ts: Optional[datetime]
        - bullish_count: int
        - bearish_count: int
    """
    n = len(prices)
    signals: List[str] = ["HOLD"] * n
    crossover_events: List[Dict[str, Any]] = []

    bullish_count = 0
    bearish_count = 0
    latest_signal_event: Optional[str] = None
    last_crossover_ts: Optional[datetime] = None

    if n < 2:
        return (signals, crossover_events, "HOLD", None, None, 0, 0)

    for i in range(1, n):
        prev_f = fast_ma.iloc[i - 1]
        prev_s = slow_ma.iloc[i - 1]
        curr_f = fast_ma.iloc[i]
        curr_s = slow_ma.iloc[i]

        # Ignore warm-up periods where MAs are NaN
        if pd.isna(prev_f) or pd.isna(prev_s) or pd.isna(curr_f) or pd.isna(curr_s):
            signals[i] = "HOLD"
            continue

        ts = timestamps[i]
        p = float(prices.iloc[i])

        # 1. Bullish Crossover: Fast crosses above Slow
        if prev_f <= prev_s and curr_f > curr_s:
            signals[i] = "BUY"
            latest_signal_event = "BUY"
            last_crossover_ts = ts
            bullish_count += 1
            crossover_events.append({
                "timestamp": ts,
                "event_type": "BULLISH",
                "signal": "BUY",
                "price": p,
                "fast_ma": float(curr_f),
                "slow_ma": float(curr_s)
            })

        # 2. Bearish Crossover: Fast crosses below Slow
        elif prev_f >= prev_s and curr_f < curr_s:
            signals[i] = "SELL"
            latest_signal_event = "SELL"
            last_crossover_ts = ts
            bearish_count += 1
            crossover_events.append({
                "timestamp": ts,
                "event_type": "BEARISH",
                "signal": "SELL",
                "price": p,
                "fast_ma": float(curr_f),
                "slow_ma": float(curr_s)
            })

        # 3. No Crossover
        else:
            signals[i] = "HOLD"

    current_state = latest_signal_event if latest_signal_event is not None else "HOLD"

    return (
        signals,
        crossover_events,
        current_state,
        latest_signal_event,
        last_crossover_ts,
        bullish_count,
        bearish_count
    )
