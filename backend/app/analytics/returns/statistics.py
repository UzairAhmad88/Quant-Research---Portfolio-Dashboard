from typing import List, Optional, Dict, Any
from app.analytics.returns.calculator import ReturnCalculator

class ReturnStatistics:
    """
    Compiles descriptive summary metrics for return series.
    Does NOT calculate volatility, Sharpe, Sortino, or risk metrics.
    """
    @staticmethod
    def calculate_summary(
        prices: List[float],
        simple_returns: List[Optional[float]],
        annualization_factor: int = 252
    ) -> Dict[str, Any]:
        num_bars = len(prices)
        if num_bars == 0:
            return {
                "period_return": 0.0,
                "annualized_return": 0.0,
                "cumulative_return": 0.0,
                "positive_periods": 0,
                "negative_periods": 0,
                "best_period": None,
                "worst_period": None,
                "annualization_factor": annualization_factor
            }

        start_p = prices[0]
        end_p = prices[-1]
        period_ret = ReturnCalculator.calculate_period_return(start_p, end_p)
        annualized_ret = ReturnCalculator.calculate_annualized_return(
            period_return=period_ret,
            num_bars=num_bars,
            annualization_factor=annualization_factor
        )

        valid_returns = [r for r in simple_returns if r is not None]
        pos_periods = sum(1 for r in valid_returns if r > 0)
        neg_periods = sum(1 for r in valid_returns if r < 0)

        best_p = max(valid_returns) if valid_returns else None
        worst_p = min(valid_returns) if valid_returns else None

        return {
            "period_return": float(period_ret),
            "annualized_return": float(annualized_ret),
            "cumulative_return": float(period_ret),
            "positive_periods": pos_periods,
            "negative_periods": neg_periods,
            "best_period": float(best_p) if best_p is not None else None,
            "worst_period": float(worst_p) if worst_p is not None else None,
            "annualization_factor": annualization_factor
        }
