"""Instrument fixtures for tests."""
import uuid
from typing import Dict, Any
from app.models.enums import AssetType

def get_equity_instrument_fixture(symbol: str = "AAPL") -> Dict[str, Any]:
    return {
        "id": uuid.uuid4(),
        "symbol": symbol,
        "name": f"{symbol} Test Corp.",
        "asset_type": AssetType.EQUITY,
        "currency": "USD",
        "exchange": "NASDAQ",
        "is_active": True,
    }

def get_crypto_instrument_fixture(symbol: str = "BTC-USD") -> Dict[str, Any]:
    return {
        "id": uuid.uuid4(),
        "symbol": symbol,
        "name": "Bitcoin USD",
        "asset_type": AssetType.CRYPTO,
        "currency": "USD",
        "exchange": "COINBASE",
        "is_active": True,
    }
