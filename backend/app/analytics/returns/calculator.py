import numpy as np
import math
from typing import List, Optional

class ReturnCalculator:
    """
    Pure numerical return calculation engine using NumPy and SciPy math routines.
    """
    @staticmethod
    def calculate_simple_returns(prices: List[float]) -> List[Optional[float]]:
        n = len(prices)
        if n == 0:
            return []
        if n == 1:
            return [None]

        # Fast vectorized path when all values are valid positive numbers
        try:
            arr = np.asarray(prices, dtype=np.float64)
            if np.all(arr > 0):
                rets = (arr[1:] / arr[:-1]) - 1.0
                return [None] + rets.tolist()
        except (TypeError, ValueError):
            pass

        # Fallback element-wise loop for series containing None or non-positive values
        returns: List[Optional[float]] = [None]
        for i in range(1, n):
            prev_p = prices[i - 1]
            curr_p = prices[i]
            if prev_p is None or curr_p is None or prev_p <= 0:
                returns.append(None)
            else:
                returns.append(float((curr_p / prev_p) - 1.0))
        return returns

    @staticmethod
    def calculate_log_returns(prices: List[float]) -> List[Optional[float]]:
        n = len(prices)
        if n == 0:
            return []
        if n == 1:
            return [None]

        try:
            arr = np.asarray(prices, dtype=np.float64)
            if np.all(arr > 0):
                log_rets = np.log(arr[1:] / arr[:-1])
                return [None] + log_rets.tolist()
        except (TypeError, ValueError):
            pass

        returns: List[Optional[float]] = [None]
        for i in range(1, n):
            prev_p = prices[i - 1]
            curr_p = prices[i]
            if prev_p is None or curr_p is None or prev_p <= 0 or curr_p <= 0:
                returns.append(None)
            else:
                returns.append(float(math.log(curr_p / prev_p)))
        return returns

    @staticmethod
    def calculate_cumulative_returns(prices: List[float]) -> List[float]:
        n = len(prices)
        if n == 0:
            return []

        base_p = prices[0]
        if base_p is None or base_p <= 0:
            return [0.0] * n

        try:
            arr = np.asarray(prices, dtype=np.float64)
            if np.all(arr > 0):
                cum_rets = (arr / float(base_p)) - 1.0
                return cum_rets.tolist()
        except (TypeError, ValueError):
            pass

        cum_returns: List[float] = []
        for p in prices:
            if p is None or p <= 0:
                cum_returns.append(0.0)
            else:
                cum_returns.append(float((p / base_p) - 1.0))
        return cum_returns

    @staticmethod
    def calculate_period_return(start_price: float, end_price: float) -> float:
        if start_price is None or start_price <= 0 or end_price is None:
            return 0.0
        return (end_price / start_price) - 1.0

    @staticmethod
    def calculate_annualized_return(
        period_return: float,
        num_bars: int,
        annualization_factor: int = 252
    ) -> float:
        if num_bars <= 1:
            return 0.0

        # Number of periods elapsed (bars - 1)
        periods_elapsed = num_bars - 1
        years_elapsed = periods_elapsed / float(annualization_factor)

        if years_elapsed <= 0:
            return 0.0

        # Compounded Annual Growth Rate (CAGR) formula: (1 + R)^(1 / years) - 1
        total_growth = 1.0 + period_return
        if total_growth <= 0:
            return -1.0 # Total loss

        cagr = (total_growth ** (1.0 / years_elapsed)) - 1.0
        return float(cagr)
