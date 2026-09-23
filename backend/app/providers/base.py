from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class MarketDataProvider(ABC):
    """
    Abstract Base Class for Market Data Providers.
    Decouples financial research engine from specific third-party market data APIs.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name identifier of the data provider."""
        pass

    @abstractmethod
    async def get_instrument(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Fetch instrument metadata (ticker, asset class, exchange, currency).
        """
        pass

    @abstractmethod
    async def get_historical_bars(
        self,
        symbol: str,
        start_date: str,
        end_date: str,
        timeframe: str = "1d"
    ) -> List[Dict[str, Any]]:
        """
        Fetch historical OHLCV bar series for a given symbol and date range.
        """
        pass

    @abstractmethod
    async def check_health(self) -> bool:
        """
        Verify connectivity and status of provider API.
        """
        pass
