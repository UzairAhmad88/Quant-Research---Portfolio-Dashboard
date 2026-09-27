# Database Integrity & Integration Testing

## 1. Overview & Isolation Principles

Database integration testing verifies that entity constraints, foreign keys, unique indexes, idempotency, and transactional rollbacks function as expected under concurrent and repeated operations.

> [!IMPORTANT]
> **Environment Isolation**
> Test database connections are defined in `.env.test` or configured via `backend/tests/conftest.py`. Integration tests execute against an isolated test schema or in-memory SQLite database and never interact with development or production databases.

---

## 2. Tested Database Invariants (`test_database_integrity.py`)

### 2.1 Unique Constraint Enforcement
The database enforces unique constraints on time-series records:
- Constraint: `uq_ohlcv_inst_tf_ts` on `(instrument_id, timeframe, timestamp)`.
- Verification: Attempting to insert a duplicate bar with the same instrument, timeframe, and timestamp immediately raises `IntegrityError`.

### 2.2 Idempotent Market Data Ingestion
Real-world market data pipelines frequently re-fetch recent days to adjust for corporate actions or late ticks.
- Verification: `insert_bar_idempotent` checks for record existence and skips or updates existing rows without raising duplicate constraint violations or leaving corrupt duplicate bars.

### 2.3 Transaction Rollback Guarantee
If an error occurs midway through a multi-table or multi-bar ingestion pipeline:
- Verification: The session rolls back completely (`session.rollback()`), guaranteeing that zero partial or orphaned records persist.

### 2.4 Relational & Foreign Key Integrity
- Portfolios and Holdings: Deleting a portfolio cascades or properly removes child holding records according to relational design rules.
- Instruments: Deletion or modification of instruments maintains foreign key consistency across historical market data and backtest runs.

---

## 3. Running Database Integration Tests

```bash
cd backend
pytest tests/integration/test_database_integrity.py -v
```
