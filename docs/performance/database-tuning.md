# Database Tuning & Query Architecture

## 1. Index Strategy & Time-Series Access Patterns

The Quant Research Dashboard database architecture utilizes PostgreSQL composite indexing tailored directly to time-series and relationship query patterns:

```
[OHLCV Table]
Primary Key: id (UUID string)
Foreign Key: instrument_id -> core.instruments.id
Composite Index: idx_ohlcv_inst_freq_ts_desc (instrument_id, frequency, timestamp)
Unique Constraint: uq_ohlcv_inst_ts_freq_prov (instrument_id, timestamp, frequency, provider)
```

### Query Alignment

1. **Date-Range Lookup**:
   ```sql
   SELECT timestamp, close, adjusted_close
   FROM market_data.ohlcv
   WHERE instrument_id = :inst_id
     AND frequency = :freq
     AND timestamp BETWEEN :start AND :end
   ORDER BY timestamp ASC;
   ```
   *Plan*: Index Scan using `idx_ohlcv_inst_freq_ts_desc`.

2. **Latest Observation per Instrument (Batched)**:
   ```sql
   SELECT o.*
   FROM market_data.ohlcv o
   JOIN (
       SELECT instrument_id, MAX(timestamp) AS max_ts
       FROM market_data.ohlcv
       WHERE instrument_id IN (:inst_ids) AND frequency = :freq
       GROUP BY instrument_id
   ) sub ON o.instrument_id = sub.instrument_id AND o.timestamp = sub.max_ts
   WHERE o.frequency = :freq;
   ```
   *Execution*: Single aggregated scan replacing $N$ sequential round trips.

---

## 2. N+1 Query Elimination

| Service Endpoint | Prior Sequential Pattern | Optimized Batched Pattern | Query Reduction |
| :--- | :--- | :--- | :--- |
| `GET /api/v1/dashboard/overview` | $2N$ queries (`count_bars` + `get_latest_bar`) | `get_observation_counts_batch` + `get_latest_bars_batch` | From $11$ queries to $3$ |
| `GET /api/v1/correlation/matrix` | $N$ instrument ID lookups | `InstrumentRepository.get_by_ids` (`WHERE id IN (...)`) | From $N$ queries to $1$ |
| `POST /api/v1/backtest/run` | Commit per bar / event | `bulk_save_objects` within single atomic transaction | Single commit |

---

## 3. Connection Pooling Configuration

Configured in `app.db.session`:

```python
engine_kwargs = {
    "pool_pre_ping": True,
    "future": True,
}

if not settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs.update({
        "pool_size": 20,         # Persistent connections maintained
        "max_overflow": 30,      # Surge connections during heavy multi-instrument requests
        "pool_recycle": 1800,    # 30m connection recycle to prevent idle TCP drops
        "pool_timeout": 30,      # Max checkout wait time before raising TimeoutError
    })
```
