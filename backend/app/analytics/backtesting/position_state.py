from datetime import datetime
from typing import Optional, Dict, Any


class PositionState:
    """
    Domain object tracking current open position state and unrealized P&L.
    """
    def __init__(self, instrument_id: str):
        self.instrument_id = instrument_id
        self.status: str = "FLAT"  # 'FLAT' | 'OPEN'
        self.quantity: float = 0.0
        self.entry_price: float = 0.0
        self.entry_timestamp: Optional[datetime] = None
        self.entry_signal_id: Optional[str] = None
        self.entry_trade_event_id: Optional[str] = None
        self.entry_notional: float = 0.0
        self.entry_commission: float = 0.0
        self.entry_slippage: float = 0.0

        self.current_price: float = 0.0
        self.current_value: float = 0.0
        self.unrealized_pnl: float = 0.0

    def open_position(
        self,
        quantity: float,
        entry_price: float,
        entry_timestamp: datetime,
        entry_signal_id: Optional[str] = None,
        entry_trade_event_id: Optional[str] = None,
        commission: float = 0.0,
        slippage: float = 0.0
    ) -> None:
        if quantity <= 0 or entry_price <= 0:
            raise ValueError("Position quantity and entry price must be positive.")
        
        self.status = "OPEN"
        self.quantity = quantity
        self.entry_price = entry_price
        self.entry_timestamp = entry_timestamp
        self.entry_signal_id = entry_signal_id
        self.entry_trade_event_id = entry_trade_event_id
        self.entry_notional = quantity * entry_price
        self.entry_commission = commission
        self.entry_slippage = slippage

        self.update_valuation(entry_price)

    def update_valuation(self, market_price: float) -> None:
        self.current_price = market_price
        if self.status == "OPEN" and self.quantity > 0:
            self.current_value = self.quantity * market_price
            self.unrealized_pnl = (market_price - self.entry_price) * self.quantity
        else:
            self.current_value = 0.0
            self.unrealized_pnl = 0.0

    def close_position(
        self,
        exit_price: float,
        exit_timestamp: datetime,
        exit_signal_id: Optional[str] = None,
        exit_trade_event_id: Optional[str] = None,
        exit_commission: float = 0.0,
        exit_slippage: float = 0.0,
        exit_reason: str = "SIGNAL"
    ) -> Dict[str, Any]:
        if self.status != "OPEN" or self.quantity <= 0:
            raise ValueError("Cannot close a position that is FLAT or has zero quantity.")

        exit_notional = self.quantity * exit_price
        gross_pnl = (exit_price - self.entry_price) * self.quantity
        total_costs = self.entry_commission + exit_commission + self.entry_slippage + exit_slippage
        net_pnl = gross_pnl - (self.entry_commission + exit_commission + self.entry_slippage + exit_slippage)
        
        trade_return = net_pnl / self.entry_notional if self.entry_notional > 0 else 0.0

        duration_days = 0.0
        if self.entry_timestamp and exit_timestamp:
            diff_sec = (exit_timestamp - self.entry_timestamp).total_seconds()
            duration_days = max(0.0, diff_sec / 86400.0)

        completed_trade = {
            "instrument_id": self.instrument_id,
            "entry_signal_id": self.entry_signal_id,
            "exit_signal_id": exit_signal_id,
            "entry_trade_event_id": self.entry_trade_event_id,
            "exit_trade_event_id": exit_trade_event_id,
            "entry_timestamp": self.entry_timestamp,
            "exit_timestamp": exit_timestamp,
            "entry_price": self.entry_price,
            "exit_price": exit_price,
            "quantity": self.quantity,
            "entry_notional": self.entry_notional,
            "exit_notional": exit_notional,
            "entry_commission": self.entry_commission,
            "exit_commission": exit_commission,
            "entry_slippage": self.entry_slippage,
            "exit_slippage": exit_slippage,
            "total_cost": total_costs,
            "gross_pnl": gross_pnl,
            "net_pnl": net_pnl,
            "trade_return": trade_return,
            "duration_days": duration_days,
            "exit_reason": exit_reason
        }

        # Reset position to FLAT
        self.status = "FLAT"
        self.quantity = 0.0
        self.entry_price = 0.0
        self.entry_timestamp = None
        self.entry_signal_id = None
        self.entry_trade_event_id = None
        self.entry_notional = 0.0
        self.entry_commission = 0.0
        self.entry_slippage = 0.0
        self.current_value = 0.0
        self.unrealized_pnl = 0.0

        return completed_trade
