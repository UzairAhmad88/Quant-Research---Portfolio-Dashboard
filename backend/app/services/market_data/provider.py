from abc import ABC, abstractmethod
import pandas as pd

class MarketDataProvider(ABC):
    @abstractmethod
    def get_history(self, symbol: str, start, end, interval: str = "1d") -> pd.DataFrame:
        raise NotImplementedError
