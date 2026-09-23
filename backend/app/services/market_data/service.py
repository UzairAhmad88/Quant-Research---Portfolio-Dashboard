import pandas as pd
from .provider import MarketDataProvider

class MarketDataService:
    def __init__(self, provider: MarketDataProvider):
        self.provider = provider

    def get_history(self, symbol: str, start, end, interval: str = "1d") -> pd.DataFrame:
        df = self.provider.get_history(symbol, start, end, interval)
        return self.validate_and_normalize(df)

    @staticmethod
    def validate_and_normalize(df: pd.DataFrame) -> pd.DataFrame:
        required = {"open", "high", "low", "close", "volume"}
        missing = required - set(c.lower() for c in df.columns)
        if missing:
            raise ValueError(f"Missing columns: {sorted(missing)}")
        out = df.copy()
        out.columns = [c.lower() for c in out.columns]
        if out.index.has_duplicates:
            out = out[~out.index.duplicated(keep="last")]
        return out.sort_index()
