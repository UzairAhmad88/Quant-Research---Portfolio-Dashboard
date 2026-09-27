from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import asyncio
import logging
from decimal import Decimal
import pandas as pd
import yfinance as yf
from app.providers.base import MarketDataProvider, ProviderCapabilities
from app.core.exceptions import AppException

logger = logging.getLogger("quant_api.providers.yahoo")

class YahooFinanceProvider(MarketDataProvider):
    """
    Yahoo Finance Market Data Provider Adapter.
    Encapsulates all yfinance interaction and normalizes responses into core domain schemas.
    """

    @property
    def capabilities(self) -> ProviderCapabilities:
        return ProviderCapabilities(
            provider_name=self.provider_name,
            historical=True,
            latest=True,
            intraday=False,
            streaming=False,
            supported_frequencies=["DAILY"],
            delayed_data=True,
            real_time_data=False,
        )

    @property
    def provider_name(self) -> str:
        return "yahoo_finance"

    async def search_instruments(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search Yahoo Finance for matching symbols.
        Uses yfinance Ticker fast lookup in a background worker thread.
        """
        clean_query = query.strip().upper()
        if not clean_query:
            return []

        def _sync_search() -> List[Dict[str, Any]]:
            results = []
            try:
                ticker = yf.Ticker(clean_query)
                name = clean_query
                exchange = "UNKNOWN"
                currency = "USD"
                quote_type = "EQUITY"

                try:
                    fast = getattr(ticker, "fast_info", None)
                    if fast and hasattr(fast, "currency") and fast.currency:
                        currency = fast.currency or "USD"
                        exchange = getattr(fast, "exchange", "UNKNOWN") or "UNKNOWN"
                        quote_type = getattr(fast, "quote_type", "EQUITY") or "EQUITY"
                except Exception:
                    pass

                asset_type = "EQUITY"
                if "ETF" in str(quote_type).upper():
                    asset_type = "ETF"
                elif "INDEX" in str(quote_type).upper() or clean_query.startswith("^"):
                    asset_type = "INDEX"
                elif "CRYPTOCURRENCY" in str(quote_type).upper() or "-USD" in clean_query:
                    asset_type = "CRYPTO"

                results.append({
                    "symbol": clean_query,
                    "name": name,
                    "asset_type": asset_type,
                    "exchange": exchange,
                    "currency": currency,
                    "provider_symbol": clean_query,
                })
            except Exception as e:
                logger.warning(f"YahooFinance search lookup error for query '{clean_query}': {e}")
            return results[:limit]

        return await asyncio.to_thread(_sync_search)

    async def get_instrument_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve instrument metadata from Yahoo Finance.
        """
        clean_symbol = symbol.strip().upper()

        def _sync_info() -> Optional[Dict[str, Any]]:
            try:
                ticker = yf.Ticker(clean_symbol)
                name = clean_symbol
                quote_type = "EQUITY"
                exchange = "UNKNOWN"
                currency = "USD"

                try:
                    info_dict = getattr(ticker, "info", None)
                    if isinstance(info_dict, dict) and info_dict:
                        name = info_dict.get("longName") or info_dict.get("shortName") or name
                        currency = info_dict.get("currency") or currency
                        exchange = info_dict.get("exchange") or exchange
                        quote_type = info_dict.get("quoteType") or quote_type
                    else:
                        fast = getattr(ticker, "fast_info", None)
                        if fast and hasattr(fast, "currency") and fast.currency:
                            currency = fast.currency or "USD"
                            exchange = getattr(fast, "exchange", "UNKNOWN") or "UNKNOWN"
                            quote_type = getattr(fast, "quote_type", "EQUITY") or "EQUITY"
                except Exception:
                    pass

                asset_type = "EQUITY"
                if "ETF" in str(quote_type).upper():
                    asset_type = "ETF"
                elif "INDEX" in str(quote_type).upper() or clean_symbol.startswith("^"):
                    asset_type = "INDEX"
                elif "CRYPTOCURRENCY" in str(quote_type).upper() or "-USD" in clean_symbol:
                    asset_type = "CRYPTO"

                return {
                    "symbol": clean_symbol,
                    "name": name,
                    "asset_type": asset_type,
                    "exchange": exchange,
                    "currency": currency,
                    "provider_symbol": clean_symbol,
                }
            except Exception as e:
                logger.error(f"Failed to fetch instrument info for symbol {clean_symbol}: {e}")
                return None

        return await asyncio.to_thread(_sync_info)

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
                def _fetch():
                    res = yf.download(
                        tickers=clean_symbol,
                        start=start_str,
                        end=end_str,
                        interval=interval,
                        progress=False,
                        auto_adjust=False,
                    )
                    if res is None or res.empty:
                        t = yf.Ticker(clean_symbol)
                        res = t.history(
                            start=start_str,
                            end=end_str,
                            interval=interval,
                            auto_adjust=False,
                        )
                    return res

                df = await asyncio.to_thread(_fetch)
                if df is not None and not df.empty:
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

        def _safe_float(val, default=None):
            if val is None:
                return default
            try:
                if hasattr(val, "iloc"):
                    val = val.iloc[0]
                if pd.isna(val):
                    return default
                return float(val)
            except Exception:
                return default

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

                open_val = _safe_float(row.get("Open"))
                high_val = _safe_float(row.get("High"))
                low_val = _safe_float(row.get("Low"))
                close_val = _safe_float(row.get("Close"))
                adj_close_val = _safe_float(row.get("Adj Close"), default=close_val)
                volume_val = _safe_float(row.get("Volume"), default=0.0)

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

    async def get_latest_ohlcv(
        self,
        symbol: str,
        frequency: str = "DAILY"
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve the latest available daily market observation for a symbol.
        """
        clean_symbol = symbol.strip().upper()
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=7)
        bars = await self.get_historical_ohlcv(
            symbol=clean_symbol,
            start_date=start_date,
            end_date=end_date,
            frequency=frequency
        )
        if not bars:
            return None
        return bars[-1]

    async def get_latest_ohlcv_batch(
        self,
        symbols: List[str],
        frequency: str = "DAILY"
    ) -> Dict[str, Dict[str, Any]]:
        """
        Retrieve the latest available daily market observations in batch.
        """
        clean_symbols = [s.strip().upper() for s in symbols if s.strip()]
        if not clean_symbols:
            return {}

        if len(clean_symbols) == 1:
            bar = await self.get_latest_ohlcv(clean_symbols[0], frequency=frequency)
            return {clean_symbols[0]: bar} if bar else {}

        interval = "1d"
        max_retries = 3
        df = None
        start_str = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d")
        end_str = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")

        for attempt in range(1, max_retries + 1):
            try:
                import yfinance as yf
                df = await asyncio.to_thread(
                    yf.download,
                    tickers=clean_symbols,
                    start=start_str,
                    end=end_str,
                    interval=interval,
                    auto_adjust=False,
                    progress=False,
                    group_by="ticker"
                )
                if df is not None and not df.empty:
                    break
            except Exception as e:
                logger.warning(f"Batch download attempt {attempt}/{max_retries} failed: {e}")
                if attempt < max_retries:
                    await asyncio.sleep(2 ** (attempt - 1))

        if df is None or df.empty:
            results = {}
            for s in clean_symbols:
                b = await self.get_latest_ohlcv(s, frequency=frequency)
                if b:
                    results[s] = b
            return results

        results = {}
        for s in clean_symbols:
            try:
                sub_df = df[s] if s in df else None
                if sub_df is None or sub_df.empty:
                    continue
                sub_df = sub_df.dropna(subset=["Close"])
                if sub_df.empty:
                    continue
                last_idx = sub_df.index[-1]
                row = sub_df.iloc[-1]
                ts = last_idx.to_pydatetime() if isinstance(last_idx, pd.Timestamp) else pd.to_datetime(last_idx).to_pydatetime()
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

                results[s] = {
                    "timestamp": ts,
                    "open": open_val,
                    "high": high_val,
                    "low": low_val,
                    "close": close_val,
                    "adjusted_close": adj_close_val,
                    "volume": volume_val,
                    "provider_symbol": s
                }
            except Exception as err:
                logger.warning(f"Error parsing batch row for {s}: {err}")
                continue

        return results

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

