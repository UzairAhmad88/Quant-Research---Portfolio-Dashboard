"""Deterministic test fixtures for market data testing."""
import datetime
from typing import List, Dict, Any

def get_valid_equity_data(symbol: str = "AAPL", count: int = 30, base_price: float = 150.0) -> List[Dict[str, Any]]:
    """Generates a deterministic, strictly positive series of equity OHLCV daily observations.
    
    Uses 252-day annualization convention.
    """
    bars = []
    current_close = base_price
    start_date = datetime.date(2023, 1, 2)
    
    # Deterministic price steps
    deltas = [
        1.5, -0.8, 2.1, 0.4, -1.2, 1.8, -0.5, 0.9, 1.2, -1.5,
        0.8, 1.1, -0.4, -0.9, 2.0, 1.3, -1.1, 0.5, 1.7, -0.6,
        1.0, -1.4, 0.7, 1.5, -0.3, 0.8, 1.2, -0.9, 1.6, 0.4
    ]
    
    curr_date = start_date
    for i in range(count):
        # Skip weekends to preserve realistic business calendar
        while curr_date.weekday() >= 5:
            curr_date += datetime.timedelta(days=1)
            
        step = deltas[i % len(deltas)]
        open_price = round(current_close, 2)
        close_price = round(max(1.0, open_price + step), 2)
        high_price = round(max(open_price, close_price) + 0.75, 2)
        low_price = round(min(open_price, close_price) - 0.75, 2)
        volume = 1_000_000 + (i * 25_000)
        
        bars.append({
            "timestamp": datetime.datetime.combine(curr_date, datetime.time(0, 0, 0), tzinfo=datetime.timezone.utc),
            "open": open_price,
            "high": high_price,
            "low": low_price,
            "close": close_price,
            "adjusted_close": close_price,
            "volume": volume,
            "dividend_amount": 0.0,
            "split_coefficient": 1.0,
        })
        current_close = close_price
        curr_date += datetime.timedelta(days=1)
        
    return bars

def get_valid_crypto_data(symbol: str = "BTC-USD", count: int = 30, base_price: float = 30000.0) -> List[Dict[str, Any]]:
    """Generates continuous 7-day crypto observations (365-day annualization)."""
    bars = []
    current_close = base_price
    start_date = datetime.date(2023, 1, 1)
    
    deltas = [250.0, -180.0, 420.0, -90.0, 150.0, -300.0, 500.0, -120.0, 210.0, -80.0]
    
    curr_date = start_date
    for i in range(count):
        step = deltas[i % len(deltas)]
        open_price = round(current_close, 2)
        close_price = round(max(100.0, open_price + step), 2)
        high_price = round(max(open_price, close_price) + 120.0, 2)
        low_price = round(min(open_price, close_price) - 120.0, 2)
        volume = 50_000_000 + (i * 500_000)
        
        bars.append({
            "timestamp": datetime.datetime.combine(curr_date, datetime.time(0, 0, 0), tzinfo=datetime.timezone.utc),
            "open": open_price,
            "high": high_price,
            "low": low_price,
            "close": close_price,
            "adjusted_close": close_price,
            "volume": volume,
            "dividend_amount": 0.0,
            "split_coefficient": 1.0,
        })
        current_close = close_price
        curr_date += datetime.timedelta(days=1)
        
    return bars

def get_invalid_ohlcv_records() -> List[Dict[str, Any]]:
    """Returns synthetic datasets with explicit OHLC relationship violations."""
    t0 = datetime.datetime(2023, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc)
    return [
        {"desc": "High < Open", "open": 105.0, "high": 100.0, "low": 95.0, "close": 98.0, "volume": 1000, "timestamp": t0},
        {"desc": "High < Close", "open": 98.0, "high": 100.0, "low": 95.0, "close": 105.0, "volume": 1000, "timestamp": t0},
        {"desc": "Low > Open", "open": 90.0, "high": 100.0, "low": 95.0, "close": 98.0, "volume": 1000, "timestamp": t0},
        {"desc": "Low > Close", "open": 98.0, "high": 100.0, "low": 95.0, "close": 92.0, "volume": 1000, "timestamp": t0},
        {"desc": "High < Low", "open": 100.0, "high": 90.0, "low": 105.0, "close": 95.0, "volume": 1000, "timestamp": t0},
        {"desc": "Negative price", "open": -10.0, "high": 10.0, "low": -15.0, "close": 5.0, "volume": 1000, "timestamp": t0},
        {"desc": "Negative volume", "open": 100.0, "high": 105.0, "low": 95.0, "close": 102.0, "volume": -500, "timestamp": t0},
    ]

def get_constant_price_data(count: int = 15, constant_price: float = 100.0) -> List[Dict[str, Any]]:
    """Flat/constant price series (returns=0, volatility=0, Sharpe undefined/null)."""
    bars = []
    start = datetime.date(2023, 1, 2)
    for i in range(count):
        d = start + datetime.timedelta(days=i)
        bars.append({
            "timestamp": datetime.datetime.combine(d, datetime.time(0, 0, 0), tzinfo=datetime.timezone.utc),
            "open": constant_price,
            "high": constant_price,
            "low": constant_price,
            "close": constant_price,
            "adjusted_close": constant_price,
            "volume": 100_000,
        })
    return bars

def get_known_return_dataset() -> Dict[str, Any]:
    """Small deterministic dataset with manually calculated mathematical ground truth."""
    # Prices: 100, 105, 99.75, 104.7375
    # R_1 = 105/100 - 1 = 0.05
    # R_2 = 99.75/105 - 1 = -0.05
    # R_3 = 104.7375/99.75 - 1 = 0.05
    # Cumulative return: 104.7375 / 100 - 1 = 0.047375
    # Log returns: ln(1.05) ≈ 0.048790, ln(0.95) ≈ -0.051293, ln(1.05) ≈ 0.048790
    prices = [100.0, 105.0, 99.75, 104.7375]
    expected_simple_returns = [None, 0.05, -0.05, 0.05]
    expected_cumulative = 0.047375
    return {
        "prices": prices,
        "expected_simple_returns": expected_simple_returns,
        "expected_cumulative_return": expected_cumulative,
    }
