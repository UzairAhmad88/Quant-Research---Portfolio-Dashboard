from datetime import datetime
from typing import Optional, Dict, Any, List


class ExecutionScheduler:
    """
    Manages signal scheduling for NEXT_OPEN execution and records execution attempts/rejections.
    """
    def __init__(self):
        self.pending_signal: Optional[Dict[str, Any]] = None
        self.rejection_logs: List[Dict[str, Any]] = []

    def schedule_signal(self, signal: Dict[str, Any]) -> None:
        self.pending_signal = signal

    def clear_pending(self) -> None:
        self.pending_signal = None

    def record_rejection(
        self,
        signal_id: Optional[str],
        timestamp: datetime,
        side: str,
        reason: str
    ) -> None:
        self.rejection_logs.append({
            "signal_id": signal_id,
            "timestamp": timestamp,
            "side": side,
            "status": "REJECTED",
            "rejection_reason": reason
        })
