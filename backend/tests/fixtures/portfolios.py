"""Portfolio fixtures for testing."""
import uuid
import datetime
from decimal import Decimal
from typing import Dict, Any

def get_portfolio_fixture(name: str = "Test Institutional Portfolio", initial_cash: float = 100_000.0) -> Dict[str, Any]:
    return {
        "id": uuid.uuid4(),
        "name": name,
        "description": "Deterministic quantitative benchmark portfolio",
        "currency": "USD",
        "initial_cash": Decimal(str(initial_cash)),
        "current_cash": Decimal(str(initial_cash)),
    }
