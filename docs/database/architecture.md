# Database Architecture — Quant Research Dashboard

This document details the PostgreSQL database architecture, schema isolation, and persistence pattern used across the Quant Research Dashboard platform.

---

## 1. Multi-Schema Architecture

To maintain strict domain boundaries, tables are segregated into PostgreSQL logical schemas:

```text
PostgreSQL Database: quant_dashboard
├── core
│   └── instruments (Reference master data for Equities, ETFs, Indices, Crypto)
│
└── market_data
    └── ohlcv (Time-series historical price bars)
```

### Future Schema Expansion Roadmap
- `portfolio`: Portfolios, holdings, transactions, and rebalancing logs.
- `strategy`: Technical rules, signal matrices, and parameter grids.
- `backtesting`: Simulation runs, trade logs, and equity curves.

---

## 2. Layered Persistence Pattern

```text
[ API Endpoint / FastAPI Route ]
               │
               ▼
[ Service Layer (app/services/) ]
  - Enforces OHLC bounds validation (high >= open, high >= close, low <= open, low <= close)
  - Manages transaction boundaries
               │
               ▼
[ Repository Layer (app/repositories/) ]
  - Encapsulates database queries (CRUD, time-range filters, latest bar, bulk insert)
               │
               ▼
[ SQLAlchemy ORM Models (app/models/) ]
  - Represents core.instruments and market_data.ohlcv tables
               │
               ▼
[ PostgreSQL Engine (psycopg / SQLAlchemy Pool) ]
```

---

## 3. Data Integrity & Provenance Principles

1. **UUID Identification**: Major application entities (`Instrument`, `OHLCV`) use UUID primary keys (`String(36)`).
2. **High-Precision Numerics**: Price fields use `NUMERIC(18, 8)` and volume uses `NUMERIC(24, 8)` to prevent floating-point rounding errors in crypto and equities.
3. **Data Provenance**: Every `OHLCV` record tracks `provider` and `provider_symbol` alongside `retrieved_at` timestamps to ensure quantitative research reproducibility.
4. **Timezone Policy**: All stored timestamps are strictly UTC (`DateTime(timezone=True)`).
