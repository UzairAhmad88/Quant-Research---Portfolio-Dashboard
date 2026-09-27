# Production Database Deployment

Guidelines for deploying, tuning, and securing PostgreSQL for institutional time-series and quant research workloads.

---

## 1. Schema Partitioning & Structure

The database utilizes isolated schemas for operational domain segregation:
- `core`: Application entities (`instruments`, `portfolios`, `portfolio_holdings`).
- `market_data`: High-volume OHLCV price observations (`ohlcv_bars`).
- `strategy`: Strategy parameters and generated trading signals (`strategy_configs`, `signal_events`).
- `backtesting`: Simulation runs, trade logs, and metrics (`backtest_runs`, `backtest_trades`).

---

## 2. PostgreSQL Connection Pooling

Production connection pooling is configured in `app.db.session`:
- `pool_size`: 20 persistent connections.
- `max_overflow`: 30 burst connections.
- `pool_timeout`: 30 seconds.
- `pool_recycle`: 1800 seconds (prevents stale TCP connections behind load balancers).
- `pool_pre_ping`: True (verifies connection liveness before checking out from pool).
