from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional, Dict, Any


class ExecutionDetails:
    def __init__(
        self,
        execution_timestamp: datetime,
        execution_price: float,
        execution_reason: str = "SIGNAL"
    ):
        self.execution_timestamp = execution_timestamp
        self.execution_price = execution_price
        self.execution_reason = execution_reason


class ExecutionModel(ABC):
    @abstractmethod
    def determine_execution(
        self,
        signal_timestamp: datetime,
        next_bar: Optional[Dict[str, Any]],
        reason: str = "SIGNAL"
    ) -> Optional[ExecutionDetails]:
        """
        Determines execution timestamp and execution price based on execution timing rules.
        """
        pass


class NextOpenExecutionModel(ExecutionModel):
    """
    Executes signals at the Open price of the next available chronological market observation.
    Strictly prevents look-ahead bias by prohibiting same-bar execution.
    """
    def determine_execution(
        self,
        signal_timestamp: datetime,
        next_bar: Optional[Dict[str, Any]],
        reason: str = "SIGNAL"
    ) -> Optional[ExecutionDetails]:
        if not next_bar:
            return None

        open_price = float(next_bar.get("open", next_bar.get("close", 0.0)))
        if open_price <= 0:
            return None

        return ExecutionDetails(
            execution_timestamp=next_bar["timestamp"],
            execution_price=open_price,
            execution_reason=reason
        )
