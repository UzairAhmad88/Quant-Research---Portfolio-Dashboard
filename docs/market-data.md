# Market Data & Provider Architecture

## Overview

The platform uses a modular provider abstraction designed to ingest, validate, and store real-world market observations without mock data.

---

## 1. Provider Abstraction

```text
MarketDataProvider (Abstract Base Class)
 ├── YahooFinanceProvider (REST Daily/Intraday Ingestion via yfinance)
 ├── WebSocketStreamManager (Real-Time Live Quote Broadcasting)
 └── Future Microstructure Provider (L2 Order Book, Bid/Ask Imbalance)
```

---

## 2. Ingestion & Quality Validation Rules

Every raw bar ingested must satisfy strict validation rules before storage:
1. **High-Low Bound**: `Low <= Open <= High` and `Low <= Close <= High`.
2. **Volume Non-Negative**: `Volume >= 0`.
3. **Strict Monotonicity**: Timestamps strictly ascending with duplicate avoidance.
4. **Corporate Actions**: Splits and cash dividends proportionately adjusted.
