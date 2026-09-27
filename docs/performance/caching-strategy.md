# Caching & Freshness Strategy

## 1. Multi-Tiered Freshness Architecture

The Quant Research Dashboard maintains a strict distinction between **immutable historical data** and **volatile latest market observations**:

```
+-----------------------------+-----------------------+--------------------+
| Data Tier                   | Freshness Stale Time  | Client GC Lifetime |
+-----------------------------+-----------------------+--------------------+
| Historical Market Data      | 10 minutes            | 30 minutes         |
| Calculated Returns          | 5 minutes             | 30 minutes         |
| Calculated Volatility       | 5 minutes             | 30 minutes         |
| Correlation Matrices        | 5 minutes             | 30 minutes         |
| Completed Backtests         | 10 minutes            | 60 minutes         |
| Latest Ticker Quotes        | 30 seconds            | 5 minutes          |
| Provider Capabilities       | 60 minutes            | 24 hours           |
+-----------------------------+-----------------------+--------------------+
```

---

## 2. Query Key Determinism

Every analytical cache entry incorporates all parameters influencing the output:

- **Returns**: `['returns', symbol, startDate, endDate, priceSource, returnType, frequency]`
- **Volatility**: `['volatility', symbol, startDate, endDate, priceSource, window, annualization]`
- **Correlation**: `['correlation', symbols.sort().join(','), startDate, endDate, mode, frequency]`
- **Backtests**: `['backtests', instrumentId]`

Analytical cache keys are never shared across differing calculation settings.

---

## 3. Targeted Cache Invalidation

Mutations trigger surgical invalidation without causing global UI refetch cascades:

1. **Market Data Acquisition (`POST /api/v1/market-data/fetch`)**:
   - Invalidates `['market-data', symbol]`
   - Invalidates `['latest-market-data', symbol]`
   - Invalidates `['dashboard-overview']`

2. **Portfolio Holding Mutation (`POST/PUT/DELETE /api/v1/portfolios/...`)**:
   - Invalidates `['portfolios']`
   - Invalidates `['portfolio-analytics', portfolioId]`
   - Invalidates `['dashboard-overview']`

3. **Backtest Execution (`POST /api/v1/backtest/run`)**:
   - Invalidates `['backtests']`
   - Invalidates `['dashboard-overview']`
