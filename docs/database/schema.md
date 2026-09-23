# Database Schema & Entity Relationship Model

Detailed schema specification for `core` and `market_data` PostgreSQL tables.

---

## 1. Entity Relationship Model

```text
┌────────────────────────────────────────────────────────┐
│                   core.instruments                     │
├────────────────────────────────────────────────────────┤
│ id (PK)             : VARCHAR(36) [UUID]               │
│ symbol              : VARCHAR(32) [INDEX]              │
│ name                : VARCHAR(255)                     │
│ asset_type          : ENUM('EQUITY','ETF','INDEX',     │
│                            'CRYPTO') [INDEX]           │
│ exchange            : VARCHAR(64)                      │
│ currency            : VARCHAR(16)                      │
│ country             : VARCHAR(64) NULL                 │
│ provider_symbol     : VARCHAR(64) NULL                 │
│ active              : BOOLEAN                          │
│ metadata            : JSONB / JSON NULL                │
│ created_at          : TIMESTAMPTZ                      │
│ updated_at          : TIMESTAMPTZ                      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           │ 1 : N (CASCADE DELETE)
                           ▼
┌────────────────────────────────────────────────────────┐
│                   market_data.ohlcv                    │
├────────────────────────────────────────────────────────┤
│ id (PK)             : VARCHAR(36) [UUID]               │
│ instrument_id (FK)  : VARCHAR(36) [INDEX]              │
│ timestamp           : TIMESTAMPTZ [INDEX]              │
│ frequency           : ENUM('DAILY','HOURLY',           │
│                            'MINUTE') [INDEX]           │
│ open                : NUMERIC(18,8) [> 0]              │
│ high                : NUMERIC(18,8) [> 0]              │
│ low                 : NUMERIC(18,8) [> 0]              │
│ close               : NUMERIC(18,8) [> 0]              │
│ adjusted_close      : NUMERIC(18,8) NULL               │
│ volume              : NUMERIC(24,8) [>= 0]             │
│ provider            : VARCHAR(64)                      │
│ provider_symbol     : VARCHAR(64) NULL                 │
│ retrieved_at        : TIMESTAMPTZ                      │
└────────────────────────────────────────────────────────┘
```

---

## 2. Table Constraints & Rationale

### `core.instruments` Constraints
- **Unique Constraint**: `uq_instrument_symbol_exchange_asset` on `(symbol, exchange, asset_type)`. Prevents duplicate ticker registrations while allowing identical symbols on separate exchanges (e.g. dual-listed equities).

### `market_data.ohlcv` Constraints
- **Unique Constraint**: `uq_ohlcv_inst_ts_freq_prov` on `(instrument_id, timestamp, frequency, provider)`. Guarantees strict duplicate prevention for time-series bars.
- **Check Constraints**:
  - `ck_ohlcv_open_positive`: `open > 0`
  - `ck_ohlcv_high_positive`: `high > 0`
  - `ck_ohlcv_low_positive`: `low > 0`
  - `ck_ohlcv_close_positive`: `close > 0`
  - `ck_ohlcv_volume_nonnegative`: `volume >= 0`
  - `ck_ohlcv_high_gte_low`: `high >= low`

---

## 3. Index Rationale

1. **`ix_core_instruments_symbol`**: Fast symbol lookup in command palette and API search.
2. **`ix_core_instruments_asset_type`**: Fast filtering by asset class (e.g., list all ETFs).
3. **`idx_ohlcv_inst_freq_ts_desc`**: Composite index on `(instrument_id, frequency, timestamp DESC)`. Optimized for high-speed time-series window extraction and latest price queries (`order_by timestamp DESC limit 1`).
