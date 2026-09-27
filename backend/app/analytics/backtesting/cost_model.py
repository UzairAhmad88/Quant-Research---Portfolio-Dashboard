from abc import ABC, abstractmethod
from typing import Tuple


class CostModel(ABC):
    @abstractmethod
    def calculate_costs(
        self,
        notional_value: float,
        commission_rate: float = 0.0,
        slippage_rate: float = 0.0
    ) -> Tuple[float, float]:
        """
        Calculates commission cost and slippage cost for a trade.
        Returns: Tuple[commission_cost, slippage_cost]
        """
        pass


class FixedCostModel(CostModel):
    def calculate_costs(
        self,
        notional_value: float,
        commission_rate: float = 0.0,
        slippage_rate: float = 0.0
    ) -> Tuple[float, float]:
        if notional_value <= 0:
            return 0.0, 0.0

        comm_cost = notional_value * max(0.0, commission_rate)
        slip_cost = notional_value * max(0.0, slippage_rate)
        return comm_cost, slip_cost
