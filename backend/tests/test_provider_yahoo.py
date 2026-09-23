import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, patch
import pandas as pd
from app.providers.yahoo import YahooFinanceProvider

@pytest.mark.asyncio
async def test_yahoo_provider_get_instrument_info():
    provider = YahooFinanceProvider()
    
    mock_ticker = MagicMock()
    mock_ticker.info = {
        "symbol": "AAPL",
        "longName": "Apple Inc.",
        "quoteType": "EQUITY",
        "exchange": "NASDAQ",
        "currency": "USD"
    }

    with patch("yfinance.Ticker", return_value=mock_ticker):
        info = await provider.get_instrument_info("AAPL")
        assert info is not None
        assert info["symbol"] == "AAPL"
        assert info["name"] == "Apple Inc."
        assert info["asset_type"] == "EQUITY"
        assert info["currency"] == "USD"

@pytest.mark.asyncio
async def test_yahoo_provider_get_historical_ohlcv():
    provider = YahooFinanceProvider()

    # Mock pandas DataFrame output from yfinance.download
    dates = pd.date_range(start="2026-01-01", periods=3, freq="D", tz="UTC")
    data = {
        "Open": [150.0, 152.0, 154.0],
        "High": [155.0, 156.0, 158.0],
        "Low": [149.0, 151.0, 153.0],
        "Close": [153.0, 155.0, 157.0],
        "Adj Close": [153.0, 155.0, 157.0],
        "Volume": [1000000, 1200000, 1100000]
    }
    mock_df = pd.DataFrame(data, index=dates)

    with patch("yfinance.download", return_value=mock_df):
        start = datetime(2026, 1, 1, tzinfo=timezone.utc)
        end = datetime(2026, 1, 3, tzinfo=timezone.utc)
        bars = await provider.get_historical_ohlcv("AAPL", start, end)

        assert len(bars) == 3
        assert bars[0]["open"] == 150.0
        assert bars[0]["high"] == 155.0
        assert bars[0]["low"] == 149.0
        assert bars[0]["close"] == 153.0
        assert bars[0]["volume"] == 1000000.0

@pytest.mark.asyncio
async def test_yahoo_provider_empty_response():
    provider = YahooFinanceProvider()
    mock_empty_df = pd.DataFrame()

    with patch("yfinance.download", return_value=mock_empty_df):
        start = datetime(2026, 1, 1, tzinfo=timezone.utc)
        end = datetime(2026, 1, 3, tzinfo=timezone.utc)
        bars = await provider.get_historical_ohlcv("INVALID_TICKER", start, end)
        assert bars == []
