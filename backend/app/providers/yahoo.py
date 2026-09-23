from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import asyncio
import logging
from decimal import Decimal
import pandas as pd
from app.providers.base import MarketDataProvider
from app.core.exceptions import AppException

logger = logging.getLogger("quant_api.providers.yahoo")

class YahooFinanceProvider(MarketDataProvider):
    """
    Yahoo Finance Market Data Provider Adapter.
    Encapsulates all yfinance interaction and normalizes responses into core domain schemas.
    """

    @property
    def provider_name(self) -> str:
        return "yahoo_finance"

    async def search_instruments(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search Yahoo Finance for matching symbols.
        Uses yfinance Ticker / Search API where available, fallback to direct symbol lookup.
        """
        clean_query = query.strip().upper()
        if not clean_query:
            return []

        results = []
        try:
            import yfinance as yf
            # Try direct lookup first
            ticker = yf.Ticker(clean_query)
            info = ticker.info or {}
            if info.get("symbol") or info.get("shortName") or info.get("longName"):
                name = info.get("longName") or info.get("shortName") or clean_query
                quote_type = info.get("quoteType", "").upper()
                
                asset_type = "EQUITY"
                if "ETF" in quote_type:
                    asset_type = "ETF"
                elif "INDEX" in quote_type or clean_query.startswith("^"):
                    asset_type = "INDEX"
                elif "CRYPTOCURRENCY" in quote_type or "-USD" in clean_query:
                    asset_type = "CRYPTO"

                results.append({
                    "symbol": clean_query,
                    "name": name,
                    "asset_type": asset_type,
                    "exchange": info.get("exchange", "UNKNOWN"),
                    "currency": info.get("currency", "USD"),
                    "provider_symbol": clean_query,
                })
        except Exception as e:
            logger.warning(f"YahooFinance search lookup error for query '{query}': {e}")

        return results[:limit]

    async def get_instrument_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve instrument metadata from Yahoo Finance.
        """
        clean_symbol = symbol.strip().upper()
        try:
            import yfinance as yf
            ticker = yf.Ticker(clean_symbol)
            info = ticker.info or {}
            
            name = info.get("longName") or info.get("shortName") or clean_symbol
            quote_type = str(info.get("quoteType", "")).upper()
            
            asset_type = "EQUITY"
            if "ETF" in quote_type:
                asset_type = "ETF"
            elif "INDEX" in quote_type or clean_symbol.startswith("^"):
                asset_type = "INDEX"
            elif "CRYPTOCURRENCY" in quote_type or "-USD" in clean_symbol:
                asset_type = "CRYPTO"

            return {
                "symbol": clean_symbol,
                "name": name,
                "asset_type": asset_type,
                "exchange": info.get("exchange", "UNKNOWN"),
                "currency": info.get("currency", "USD"),
                "provider_symbol": clean_symbol,
            }
        except Exception as e:
            logger.error(f"Failed to fetch instrument info for symbol {symbol}: {e}")
            return None

    async def get_historical_ohlcv(
        self,
        symbol: str,
        start_date: datetime,
        end_date: datetime,
        frequency: str = "DAILY"
    ) -> List[Dict[str, Any]]:
        """
        Download historical daily OHLCV bars from Yahoo Finance.
        Includes 3-attempt exponential backoff retry handling.
        """
        clean_symbol = symbol.strip().upper()
        
        # Format dates as YYYY-MM-DD
        start_str = start_date.strftime("%Y-%m-%d")
        # yfinance end_date is exclusive, add 1 day to include end_date
        end_adj = end_date + timedelta(days=1)
        end_str = end_adj.strftime("%Y-%m-%d")

        interval = "1d"
        if frequency == "HOURLY":
            interval = "1h"
        elif frequency == "MINUTE":
            interval = "1m"

        df = None
        last_error = None
        max_retries = 3

        for attempt in range(1, max_retries + 1):
            try:
                import yfinance as yf
                # Run sync yfinance download in thread pool
                df = await asyncio.to_thread(
                    yf.download,
                    tickers=clean_symbol,
                    start=start_str,
                    end=end_str,
                    interval=interval,
                    auto_adjust=False,
                    progress=False
                )
                if df is not None:
                    break
            except Exception as e:
                last_error = e
                logger.warning(f"yfinance download attempt {attempt}/{max_retries} failed for {clean_symbol}: {e}")
                if attempt < max_retries:
                    await asyncio.sleep(2 ** (attempt - 1))  # 1s, 2s

        if df is None or df.empty:
            if last_error:
                logger.error(f"YahooFinance provider error for {clean_symbol}: {last_error}")
            return []

        # Handle multi-index columns if present in yfinance output
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        bars = []
        for idx, row in df.iterrows():
            try:
                # Convert timestamp index to datetime aware UTC
                if isinstance(idx, pd.Timestamp):
                    ts = idx.to_pydatetime()
                else:
                    ts = pd.to_datetime(idx).to_pydatetime()

                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=timezone.utc)
                else:
                    ts = ts.astimezone(timezone.utc)

                open_val = float(row["Open"]) if "Open" in row and not pd.isna(row["Open"]) else None
                high_val = float(row["High"]) if "High" in row and not pd.isna(row["High"]) else None
                low_val = float(row["Low"]) if "Low" in row and not pd.isna(row["Low"]) else None
                close_val = float(row["Close"]) if "Close" in row and not pd.isna(row["Close"]) else None
                adj_close_val = float(row["Adj Close"]) if "Adj Close" in row and not pd.isna(row["Adj Close"]) else close_val
                volume_val = float(row["Volume"]) if "Volume" in row and not pd.isna(row["Volume"]) else 0.0

                if None in (open_val, high_val, low_val, close_val):
                    continue

                bars.append({
                    "timestamp": ts,
                    "open": open_val,
                    "high": high_val,
                    "low": low_val,
                    "close": close_val,
                    "adjusted_close": adj_close_val,
                    "volume": volume_val,
                    "provider_symbol": clean_symbol
                })
            except Exception as row_err:
                logger.debug(f"Skipping malformed row in yfinance output for {clean_symbol}: {row_err}")
                continue

        return bars

    async def check_health(self) -> bool:
        """
        Verify Yahoo Finance connectivity.
        """
        try:
            import yfinance as yf
            ticker = yf.Ticker("AAPL")
            info = ticker.fast_info
            return info is not None
        except Exception:
            return False
