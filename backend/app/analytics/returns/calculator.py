import numpy as np
import math
from typing import List, Optional

class ReturnCalculator:
    """
    Pure numerical return calculation engine using NumPy and SciPy math routines.
    """
    @staticmethod
    def calculate_simple_returns(prices: List[float]) -> List[Optional[float]]:
        if len(prices) == 0:
            return []
        
        returns: List[Optional[float]] = [None] # First observation has no prior bar
        for i in range(1, len(prices)):
            prev_p = prices[i - 1]
            curr_p = prices[i]
            if prev_p is None or curr_p is None or prev_p <= 0:
                returns.append(None)
            else:
                ret = (curr_p / prev_p) - 1.0
                returns.append(float(ret))
        return returns

    @staticmethod
    def calculate_log_returns(prices: List[float]) -> List[Optional[float]]:
        if len(prices) == 0:
            return []

        returns: List[Optional[float]] = [None]
        for i in range(1, len(prices)):
            prev_p = prices[i - 1]
            curr_p = prices[i]
            if prev_p is None or curr_p is None or prev_p <= 0 or curr_p <= 0:
                returns.append(None)
            else:
                log_ret = math.log(curr_p / prev_p)
                returns.append(float(log_ret))
        return returns

    @staticmethod
    def calculate_cumulative_returns(prices: List[float]) -> List[float]:
        if len(prices) == 0:
            return []

        base_p = prices[0]
        if base_p is None or base_p <= 0:
            return [0.0] * len(prices)

        cum_returns: List[float] = []
        for p in prices:
            if p is None or p <= 0:
                cum_returns.append(0.0)
            else:
                cum_ret = (p / base_p) - 1.0
                cum_returns.append(float(cum_ret))
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
