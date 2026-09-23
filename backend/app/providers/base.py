from abc import ABC, abstractmethod
from datetime import datetime
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
    async def search_instruments(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search market provider for instruments matching a search string.
        Returns list of normalized dicts with keys: symbol, name, asset_type, exchange, currency, provider_symbol.
        """
        pass

    @abstractmethod
    async def get_instrument_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Fetch instrument metadata (ticker, name, asset_type, exchange, currency, provider_symbol).
        """
        pass

    @abstractmethod
    async def get_historical_ohlcv(
        self,
        symbol: str,
        start_date: datetime,
        end_date: datetime,
        frequency: str = "DAILY"
    ) -> List[Dict[str, Any]]:
        """
        Fetch historical OHLCV bar series for a given symbol and date range.
        Returns list of normalized dicts with keys: timestamp (UTC datetime), open, high, low, close, adjusted_close, volume.
        """
        pass

    @abstractmethod
    async def check_health(self) -> bool:
        """
        Verify connectivity and status of provider API.
        """
        pass
