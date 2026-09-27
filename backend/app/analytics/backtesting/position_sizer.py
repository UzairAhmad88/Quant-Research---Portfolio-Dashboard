from abc import ABC, abstractmethod


class PositionSizingModel(ABC):
    @abstractmethod
    def calculate_quantity(
        self,
        available_cash: float,
        execution_price: float,
        current_position: float = 0.0,
        commission_rate: float = 0.0,
        slippage_rate: float = 0.0
    ) -> float:
        """
        Calculates position quantity to execute based on available capital and price.
        """
        pass


class FullCapitalPositionSizing(PositionSizingModel):
    """
    Allocates 100% of available cash to establish a long position, accounting for transaction costs.
    Supports fractional units to avoid rounding distortion in research simulations.
    """
    def calculate_quantity(
        self,
        available_cash: float,
        execution_price: float,
        current_position: float = 0.0,
        commission_rate: float = 0.0,
        slippage_rate: float = 0.0
    ) -> float:
        if available_cash <= 0 or execution_price <= 0:
            return 0.0
        comm_factor = 1.0 + max(0.0, commission_rate)
        slip_factor = 1.0 + max(0.0, slippage_rate)
        effective_unit_cost = execution_price * slip_factor * comm_factor
        return available_cash / effective_unit_cost
