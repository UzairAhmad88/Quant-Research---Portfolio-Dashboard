from datetime import datetime
from typing import List, Dict, Any, Optional


class TradeLifecycleService:
    """
    Manages opening, closing, and tracking completed round-trip trades during simulation runs.
    """
    def __init__(self):
        self.completed_trades: List[Dict[str, Any]] = []

    def record_completed_trade(self, trade_data: Dict[str, Any]) -> None:
        self.completed_trades.append(trade_data)

    def get_completed_trades(self) -> List[Dict[str, Any]]:
        return self.completed_trades
