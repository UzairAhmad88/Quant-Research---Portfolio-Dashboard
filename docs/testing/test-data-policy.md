# Test Data Policy & Provider Isolation

## 1. Absolute Separation from Production Data

The Quant Research Dashboard maintains a strict boundary between testing environments and production market data:

> [!CRITICAL]
> **Zero Production Pollution Rule**
> Under no circumstances may synthetic, randomized, or test fixtures be written to development or production databases. Production databases must exclusively reflect authentic data retrieved from genuine providers (e.g., Yahoo Finance).

---

## 2. Test Fixture Catalog (`backend/tests/fixtures/`)

All unit, property, and integration tests utilize centralized, deterministic synthetic fixtures located in `backend/tests/fixtures/`:

### 2.1 Valid Equity Dataset (`market_data.py`)
- **Symbol**: `AAPL` (Synthetic)
- **Observations**: 20 daily bars (2024-01-01 to 2024-01-20)
- **Characteristics**: Deterministic, positive prices ($150 - $160$), positive volume, valid OHLC relationships ($\text{High} \ge \text{Open}, \text{Close} \ge \text{Low}$).
- **Annualization Factor**: 252 trading days.

### 2.2 Valid Crypto Dataset (`market_data.py`)
- **Symbol**: `BTC-USD` (Synthetic)
- **Observations**: 15 daily bars (2024-01-01 to 2024-01-15)
- **Characteristics**: Deterministic crypto trajectory ($42,000 - $44,000$).
- **Annualization Factor**: 365 calendar days.

### 2.3 Invalid OHLCV Dataset (`market_data.py`)
Used to rigorously test `OHLCVValidator`:
- Case 1: `High < Open` ($150 > 155$)
- Case 2: `High < Close` ($155 > 158$)
- Case 3: `Low > Open` ($152 < 150$)
- Case 4: `Low > Close` ($154 < 152$)
- Case 5: `High < Low` (Inverted spread: High 140, Low 160)
- Case 6: `Negative Price` (Close = -10.0)
- Case 7: `Negative Volume` (Volume = -500)

### 2.4 Constant Price Dataset (`market_data.py`)
- Constant close price = $100.00$ across 20 observations.
- Used to verify: zero returns, zero volatility, and `null` Sharpe ratio.

### 2.5 Known Return Dataset (`market_data.py`)
- Sequence: $[100.00, 110.00, 121.00, 108.90]$.
- Analytical Returns: $[+10.0\%, +10.0\%, -10.0\%]$.
- Used for analytical unit test assertions without numerical rounding ambiguity.

---

## 3. Provider Abstraction & CI Isolation

To ensure that automated CI and test runs are fast, reliable, and immune to network outages, **live external calls to Yahoo Finance (`yfinance`) are completely prohibited in tests**.

### Mock Provider Implementation (`MockMarketDataProvider`)
Located in `backend/tests/unit/test_mock_provider_abstraction.py`, the mock provider conforms to `MarketDataProvider`:

```python
class MockMarketDataProvider(MarketDataProvider):
    """Deterministic mock provider returning synthetic OHLCV bars without network calls."""
    
    def fetch_daily_bars(self, symbol, start_date, end_date):
        ...
    
    def fetch_latest_quote(self, symbol):
        ...
        
    def check_health(self) -> bool:
        return True
```

### Simulated Failure Modes
The test suite verifies how the application reacts to provider outages:
- **Empty Response**: Provider returns zero bars $\to$ handled gracefully, logged as `NO_DATA`.
- **Malformed / Corrupt Data**: Inverted high/low $\to$ rejected by `OHLCVValidator` before reaching the database.
- **Provider 500 / 429 Rate Limit / Timeout**: Raised exceptions are caught and wrapped into structured quantitative error responses.
- **Stale Data Evaluation**: Evaluated using `FreshnessPolicy`, flagging delayed or weekend data with appropriate freshness badges (`FRESH`, `DELAYED`, `STALE`).
