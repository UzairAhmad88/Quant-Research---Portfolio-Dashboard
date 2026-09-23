from typing import List, Dict, Any, Tuple, Optional

class PortfolioCalculator:
    """
    Pure numerical portfolio analytics engine.
    Computes position valuation, weights, P&L, cumulative returns, and contributions.
    """
    @staticmethod
    def calculate_position_value(quantity: float, price: float) -> float:
        if quantity is None or price is None or quantity <= 0 or price <= 0:
            return 0.0
        return float(quantity * price)

    @staticmethod
    def calculate_portfolio_totals(
        holdings_current_values: List[float],
        cash: float
    ) -> Tuple[float, float, float]:
        invested_val = sum(v for v in holdings_current_values if v > 0)
        cash_val = max(cash, 0.0)
        total_val = invested_val + cash_val
        return float(invested_val), float(cash_val), float(total_val)

    @staticmethod
    def calculate_weights(
        holding_values: List[float],
        total_invested: float,
        total_portfolio: float
    ) -> Tuple[List[float], List[float]]:
        invested_weights: List[float] = []
        total_weights: List[float] = []

        for v in holding_values:
            w_inv = (v / total_invested) if total_invested > 0 else 0.0
            w_tot = (v / total_portfolio) if total_portfolio > 0 else 0.0
            invested_weights.append(float(w_inv))
            total_weights.append(float(w_tot))

        return invested_weights, total_weights

    @staticmethod
    def calculate_position_metrics(
        quantity: float,
        entry_price: float,
        current_price: float,
        initial_portfolio_invested: float
    ) -> Tuple[float, float, float, float, float]:
        """
        Returns (initial_value, current_value, pnl_amount, pnl_percent, contribution)
        """
        init_val = quantity * entry_price
        curr_val = quantity * current_price
        pnl_amount = curr_val - init_val
        pnl_percent = (current_price / entry_price - 1.0) if entry_price > 0 else 0.0

        initial_weight = (init_val / initial_portfolio_invested) if initial_portfolio_invested > 0 else 0.0
        contribution = initial_weight * pnl_percent

        return float(init_val), float(curr_val), float(pnl_amount), float(pnl_percent), float(contribution)

    @staticmethod
    def calculate_portfolio_return(
        current_portfolio_value: float,
        initial_invested_value: float
    ) -> float:
        if initial_invested_value <= 0:
            return 0.0
        return float((current_portfolio_value / initial_invested_value) - 1.0)
