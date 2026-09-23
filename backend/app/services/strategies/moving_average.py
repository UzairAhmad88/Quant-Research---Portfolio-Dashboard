import pandas as pd

class MovingAverageStrategy:
    def __init__(self, short_window: int, long_window: int, ma_type: str = "SMA"):
        if short_window >= long_window:
            raise ValueError("Short window must be smaller than long window.")
        self.short_window = short_window
        self.long_window = long_window
        self.ma_type = ma_type.upper()

    def indicators(self, close: pd.Series) -> pd.DataFrame:
        if self.ma_type == "EMA":
            short = close.ewm(span=self.short_window, adjust=False).mean()
            long = close.ewm(span=self.long_window, adjust=False).mean()
        else:
            short = close.rolling(self.short_window).mean()
            long = close.rolling(self.long_window).mean()
        return pd.DataFrame({"close": close, "short_ma": short, "long_ma": long})

    def signals(self, close: pd.Series) -> pd.DataFrame:
        df = self.indicators(close)
        df["signal"] = 0
        df.loc[df["short_ma"] > df["long_ma"], "signal"] = 1
        df.loc[df["short_ma"] < df["long_ma"], "signal"] = -1
        return df
