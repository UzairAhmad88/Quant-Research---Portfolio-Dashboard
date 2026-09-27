from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ProviderCapabilities(BaseModel):

    """
    Metadata describing the supported market-data retrieval capabilities of a provider.
    """
    provider_name: str
    historical: bool = True
    latest: bool = True
    intraday: bool = False
    streaming: bool = False
    supported_frequencies: List[str] = Field(default_factory=lambda: ["DAILY"])
    delayed_data: bool = True
    real_time_data: bool = False

class MarketDataProvider(ABC):
    """
    Abstract Base Class for Market Data Providers.
    Decouples financial research engine from specific third-party market data APIs.
    """

    @property
    @abstractmethod
    def capabilities(self) -> ProviderCapabilities:
        """Supported capabilities of this market-data provider."""
        pass

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
    async def get_latest_ohlcv(
        self,
        symbol: str,
        frequency: str = "DAILY"
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve the latest available market observation for a single symbol.
        Returns normalized dict with keys: timestamp (UTC datetime), open, high, low, close, adjusted_close, volume, provider_symbol.
        """
        pass

    @abstractmethod
    async def get_latest_ohlcv_batch(
        self,
        symbols: List[str],
        frequency: str = "DAILY"
    ) -> Dict[str, Dict[str, Any]]:
        """
        Retrieve the latest available market observation in batch for multiple symbols.
        Returns mapping from symbol to normalized bar dict.
        """
        pass

    @abstractmethod
    async def check_health(self) -> bool:
        """
        Verify connectivity and status of provider API.
        """
        pass
