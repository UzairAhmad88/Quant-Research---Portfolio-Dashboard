"""Strategy test fixtures."""
import uuid
from typing import Dict, Any

def get_ma_strategy_config_fixture(instrument_id: uuid.UUID, fast_window: int = 10, slow_window: int = 20) -> Dict[str, Any]:
    return {
        "id": uuid.uuid4(),
        "strategy_type": "MOVING_AVERAGE",
        "instrument_id": instrument_id,
        "fast_window": fast_window,
        "slow_window": slow_window,
        "ma_type": "SMA",
        "price_source": "adjusted",
        "is_active": True,
    }
