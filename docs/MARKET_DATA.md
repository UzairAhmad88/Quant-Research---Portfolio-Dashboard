# Market Data Provider & Data Acquisition Architecture

## 1. Overview
The Market Data Acquisition Engine provides a research-grade, provider-independent pipeline for fetching, validating, deduplicating, and persisting historical OHLCV financial price series into PostgreSQL.

## 2. Provider Abstraction Architecture
The platform strictly decouples all quantitative modules and HTTP endpoints from specific third-party market data libraries:

```text
                     MarketDataProvider (Abstract Base Interface)
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           │                            │                            │
  YahooFinanceProvider          FutureProviderB              FutureProviderC
           │
        yfinance
```

### Core Interface Methods (`app/providers/base.py`)
- `provider_name` $\rightarrow$ string identifier (`yahoo_finance`).
- `search_instruments(query, limit)` $\rightarrow$ search provider ticker universe.
- `get_instrument_info(symbol)` $\rightarrow$ metadata lookup (ticker, asset type, exchange, currency).
- `get_historical_ohlcv(symbol, start_date, end_date, frequency)` $\rightarrow$ fetch OHLCV bars normalized to UTC.
- `check_health()` $\rightarrow$ verify provider API connectivity.

## 3. Yahoo Finance Adapter (`app/providers/yahoo.py`)
- **Isolation**: `yfinance` is imported strictly inside `YahooFinanceProvider`. No routers, services, or UI components import `yfinance`.
- **Supported Assets**: Equity, ETF, Index (e.g. `^GSPC`), Crypto (e.g. `BTC-USD`).
- **Retries**: 3-attempt exponential backoff handling (`1s`, `2s`).
- **Timezone Handling**: All timestamp bar indices are converted and normalized to UTC timezone-aware datetimes.

## 4. Database-First Caching Strategy
Before issuing requests to third-party data providers:
1. Inspect existing stored timestamps in PostgreSQL for `(instrument_id, frequency, start_date, end_date)`.
2. Filter out already cached observations to minimize external API consumption unless `force_refresh=True`.
3. Safely merge new missing bars without corrupting existing records.

## 5. Data Quality Validation Rules
Before persistence, every incoming OHLCV bar is subjected to strict financial validation:
- `open > 0`, `high > 0`, `low > 0`, `close > 0`
- `volume >= 0`
- `high >= max(open, close, low)`
- `low <= min(open, close)`

Invalid bars are discarded, and counts are recorded in the ingestion activity summary (`rows_invalid`). Missing trading days (weekends, holidays) are preserved naturally without fabricating synthetic data.

## 6. Ingestion Activity Logging (`market_data.ingestion_logs`)
Every acquisition run persists a structured log tracking:
- `instrument_id`, `provider`, `frequency`
- `requested_start`, `requested_end`, `actual_start`, `actual_end`
- `rows_received`, `rows_inserted`, `rows_skipped`, `rows_invalid`
- `duration_ms`, `status` (`COMPLETED`, `COMPLETED_WITH_WARNINGS`, `FAILED`)
- `error_message`
