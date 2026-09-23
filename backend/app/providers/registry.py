from typing import Dict, Type
from app.providers.base import MarketDataProvider
from app.providers.yahoo import YahooFinanceProvider
from app.core.exceptions import ValidationError

class ProviderRegistry:
    """
    Registry for managing available market data provider adapters.
    Ensures centralized registration and strict validation of allowed providers.
    """
    _providers: Dict[str, Type[MarketDataProvider]] = {
        "yahoo_finance": YahooFinanceProvider,
        "yahoo": YahooFinanceProvider,
    }

    @classmethod
    def get_provider(cls, name: str) -> MarketDataProvider:
        key = name.lower().strip()
        if key not in cls._providers:
            allowed = list(cls._providers.keys())
            raise ValidationError(
                f"Unsupported market data provider '{name}'. Allowed providers: {allowed}"
            )
        return cls._providers[key]()

    @classmethod
    def list_providers(cls) -> list[str]:
        return list(set(cls._providers.keys()))
