# Database Failures, Transactions & Rollback Guarantees

## 1. Transaction Boundaries

Quantitative databases must never store partially committed, corrupted, or unvalidated financial records. All multi-table and multi-row write operations are executed within explicit database transactions.

---

## 2. Rollback Guarantees

In `MarketDataService`, `PortfolioService`, and `BacktestService`:
```python
try:
    # 1. Begin transaction
    # 2. Perform bulk insertion or multi-table updates
    self.db.commit()
except Exception as db_err:
    self.db.rollback()  # Guaranteed rollback
    logger.error(f"Persistence failure: {db_err}")
    raise DatabaseException(f"Database operation failed: {db_err}")
```

### Critical Operations with Rollback Protection
1. **Historical Bar Ingestion**: If bar validation fails or unique constraint violations occur, the entire chunk is rolled back; partial batches are never committed.
2. **Backtesting Simulation Persistence**: Saving trade events, portfolio states, and completed trades is atomic. A failure during metric calculation rolls back simulation records, preventing orphaned trade logs.
3. **Portfolio Holdings Updates**: Reallocations and target-weight updates execute in a single transaction.

---

## 3. Database Error Mapping & Sanitization

Database driver errors (e.g. `psycopg.OperationalError`, `SQLAlchemyError`) are intercepted by global exception handlers:
- **Sanitization**: Raw SQL queries and connection strings (which may contain database credentials or internal hostnames) are sanitized from user-facing responses.
- **Client Error**: Returns standard HTTP 500 with `code: "DATABASE_ERROR"` and correlation `request_id`.
- **Server Log**: The full driver error and query details are logged to secure backend logs at `CRITICAL` severity with the associated `request_id`.
