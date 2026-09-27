"""Backtest test fixtures."""
import uuid
import datetime
from decimal import Decimal
from typing import Dict, Any

def get_backtest_create_payload_fixture(instrument_id: str, strategy_config_id: str) -> Dict[str, Any]:
    return {
        "instrument_id": instrument_id,
        "strategy_configuration_id": strategy_config_id,
        "initial_capital": 100_000.0,
        "start_date": "2023-01-01T00:00:00Z",
        "end_date": "2024-01-01T00:00:00Z",
        "price_source": "adjusted",
        "commission_rate": 0.001,
        "slippage_rate": 0.0005,
    }
