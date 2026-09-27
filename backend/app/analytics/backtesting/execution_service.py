from typing import Tuple, Dict, Any
from app.analytics.backtesting.cost_model import FixedCostModel


class ExecutionPriceCalculator:
    """
    Calculates effective execution price with slippage.
    For BUY: effective_price = market_price * (1 + slippage_rate)
    For SELL: effective_price = market_price * (1 - slippage_rate)
    """
    @staticmethod
    def calculate_effective_price(side: str, market_price: float, slippage_rate: float = 0.0) -> Tuple[float, float]:
        if market_price <= 0:
            return 0.0, 0.0
        
        rate = max(0.0, slippage_rate)
        if side.upper() == "BUY":
            effective_price = market_price * (1.0 + rate)
            slippage_amount = (effective_price - market_price)
        else:
            effective_price = market_price * (1.0 - rate)
            slippage_amount = (market_price - effective_price)
            
        return effective_price, slippage_amount


class ExecutionService:
    """
    Orchestrates execution price calculation, cost calculation, and transaction accounting.
    """
    def __init__(self):
        self.price_calculator = ExecutionPriceCalculator()
        self.cost_model = FixedCostModel()

    def calculate_execution(
        self,
        side: str,
        market_price: float,
        quantity: float,
        commission_rate: float = 0.0,
        slippage_rate: float = 0.0
    ) -> Dict[str, float]:
        effective_price, slip_amount_per_unit = self.price_calculator.calculate_effective_price(
            side=side,
            market_price=market_price,
            slippage_rate=slippage_rate
        )
        notional_value = quantity * effective_price
        comm_cost, slip_cost = self.cost_model.calculate_costs(
            notional_value=notional_value,
            commission_rate=commission_rate,
            slippage_rate=slippage_rate
        )
        
        return {
            "market_price": market_price,
            "execution_price": effective_price,
            "quantity": quantity,
            "notional_value": notional_value,
            "commission": comm_cost,
            "slippage": slip_cost,
            "total_cost": comm_cost + slip_cost
        }
