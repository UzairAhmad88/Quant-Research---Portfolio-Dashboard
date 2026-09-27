# Quant Research Dashboard — REST API Documentation

Comprehensive REST API reference for the Quant Research Dashboard FastAPI backend (`/api/v1`).

---

## 1. OpenAPI & Interactive Documentation

When the FastAPI server is running (`uvicorn app.main:app --port 8000`), interactive documentation is available at:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI Schema**: [http://localhost:8000/api/v1/openapi.json](http://localhost:8000/api/v1/openapi.json)

---

## 2. Standard Error Response Convention

All application errors return a standardized JSON body with appropriate HTTP status codes:

```json
{
  "error": {
    "code": "INSTRUMENT_NOT_FOUND",
    "message": "The requested instrument was not found.",
    "details": null
  }
}
```

### Standard Error Categories & HTTP Statuses
- **`400 Bad Request`** (`VALIDATION_ERROR`): Invalid query parameters, cash constraint violation, or duplicate holding.
- **`404 Not Found`** (`NOT_FOUND`): Requested instrument or portfolio ID does not exist.
- **`409 Conflict`** (`CONFLICT`): Symbol already registered on exchange.
- **`422 Unprocessable Entity`** (`VALIDATION_ERROR`): Request payload failed Pydantic schema validation.
- **`500 Internal Server Error`** (`INTERNAL_ERROR` / `DATABASE_ERROR`): Unexpected server error.
- **`503 Service Unavailable`** (`UNAVAILABLE`): Database or service dependency unreachable.

---

## 3. Standard Pagination Convention

All list endpoints use a unified pagination wrapper:

```json
{
  "items": [],
  "total": 0,
  "limit": 50,
  "offset": 0
}
```

---

## 4. Endpoints Reference

### Health & System Status

#### `GET /health`
- **Purpose**: System liveness check for container orchestrators.
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "service": "quant-research-backend",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2026-09-23T22:00:00.000000+00:00"
}
```

#### `GET /health/ready` (or `GET /api/v1/health/ready`)
- **Purpose**: Infrastructure readiness check (verifies PostgreSQL DB connection ping).
- **Response `200 OK`**:
```json
{
  "status": "ready",
  "service": "quant-research-backend",
  "version": "0.1.0",
  "database": "connected",
  "timestamp": "2026-09-23T22:00:00.000000+00:00"
}
```

---

### Instruments API

#### `GET /api/v1/instruments`
- **Query Parameters**:
  - `asset_type`: `EQUITY` | `ETF` | `INDEX` | `CRYPTO` (Optional)
  - `symbol`: Ticker symbol prefix filter (Optional)
  - `exchange`: Listing venue filter (Optional)
  - `active`: boolean (Default: `true`)
  - `limit`: int (Default: `50`, Max: `500`)
  - `offset`: int (Default: `0`)
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "id": "7f8c49e2-3b1a-4f5a-9c8d-123456789abc",
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "asset_type": "EQUITY",
      "exchange": "NASDAQ",
      "currency": "USD",
      "country": "USA",
      "provider_symbol": "AAPL",
      "active": true,
      "metadata_json": { "sector": "Technology" },
      "created_at": "2026-09-23T22:00:00Z",
      "updated_at": "2026-09-23T22:00:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

#### `GET /api/v1/instruments/search`
- **Query Parameters**:
  - `q`: Search string (e.g. `AAPL`, `Bitcoin`, `SPY`)
  - `provider`: Provider name (Default: `yahoo_finance`)
- **Response `200 OK`**:
```json
[
  {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "asset_type": "EQUITY",
    "exchange": "NASDAQ",
    "currency": "USD",
    "provider_symbol": "AAPL",
    "existing_id": "7f8c49e2-3b1a-4f5a-9c8d-123456789abc"
  }
]
```

#### `GET /api/v1/instruments/{instrument_id}`
- **Response `200 OK`**: Returns single `InstrumentResponse`.
- **Response `404 Not Found`**: Returns `NOT_FOUND` error if UUID does not exist.

#### `POST /api/v1/instruments`
- **Request Body**:
```json
{
  "symbol": "NVDA",
  "name": "NVIDIA Corporation",
  "asset_type": "EQUITY",
  "exchange": "NASDAQ",
  "currency": "USD",
  "country": "USA",
  "provider_symbol": "NVDA"
}
```
- **Response `201 Created`**: Returns created `InstrumentResponse`.
- **Response `409 Conflict`**: If symbol exists on exchange with same asset class.

#### `PATCH /api/v1/instruments/{instrument_id}`
- **Request Body**: Partial update payload (`name`, `exchange`, `provider_symbol`, `active`, `metadata_json`).
- **Response `200 OK`**: Returns updated `InstrumentResponse`.

---

### Market Data API

#### `POST /api/v1/market-data/fetch`
- **Purpose**: Triggers data acquisition from provider adapter, inspects DB cache, validates OHLC bars, deduplicates, and bulk inserts valid bars into PostgreSQL.
- **Request Body**:
```json
{
  "symbol": "AAPL",
  "start_date": "2021-01-01T00:00:00Z",
  "end_date": "2026-09-23T00:00:00Z",
  "frequency": "DAILY",
  "provider": "yahoo_finance",
  "force_refresh": false
}
```
- **Response `200 OK`**:
```json
{
  "message": "Market data acquisition for symbol 'AAPL' completed with status 'COMPLETED'.",
  "summary": {
    "ingestion_id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "instrument_id": "7f8c49e2-3b1a-4f5a-9c8d-123456789abc",
    "symbol": "AAPL",
    "provider": "yahoo_finance",
    "frequency": "DAILY",
    "requested_start": "2021-01-01T00:00:00Z",
    "requested_end": "2026-09-23T00:00:00Z",
    "actual_start": "2021-01-04T00:00:00Z",
    "actual_end": "2026-09-23T00:00:00Z",
    "rows_received": 1442,
    "rows_inserted": 1442,
    "rows_skipped": 0,
    "rows_invalid": 0,
    "duration_ms": 820,
    "status": "COMPLETED",
    "warnings": []
  }
}
```

#### `GET /api/v1/market-data`
- **Query Parameters**:
  - `instrument_id`: UUID (Optional)
  - `frequency`: `DAILY` | `HOURLY` | `MINUTE` (Default: `DAILY`)
  - `start_date`: ISO 8601 UTC timestamp (Optional)
  - `end_date`: ISO 8601 UTC timestamp (Optional)
  - `provider`: Data source name (Optional)
  - `limit`: int (Default: `50`, Max: `5000`)
  - `offset`: int (Default: `0`)
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "id": "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
      "instrument_id": "7f8c49e2-3b1a-4f5a-9c8d-123456789abc",
      "timestamp": "2026-09-23T00:00:00Z",
      "frequency": "DAILY",
      "open": 225.50,
      "high": 228.10,
      "low": 224.20,
      "close": 227.80,
      "adjusted_close": 227.80,
      "volume": 45000000.0,
      "provider": "yahoo_finance",
      "provider_symbol": "AAPL",
      "retrieved_at": "2026-09-23T22:00:00Z"
    }
  ],
  "total": 1442,
  "limit": 50,
  "offset": 0
}
```

---

### Returns API

#### `GET /api/v1/returns`
- **Query Parameters**:
  - `instrument_id`: UUID (Required)
  - `start_date`: ISO 8601 UTC timestamp (Optional)
  - `end_date`: ISO 8601 UTC timestamp (Optional)
  - `price_source`: `adjusted` | `close` (Default: `adjusted`)
  - `return_type`: `simple` | `log` (Default: `simple`)
  - `frequency`: `DAILY` | `HOURLY` | `MINUTE` (Default: `DAILY`)
- **Response `200 OK`**: Returns `ReturnAnalysisResponse`.

---

### Portfolios API (Step 10)

#### `GET /api/v1/portfolios`
- **Query Parameters**: `active_only`: boolean (Default: `true`)
- **Response `200 OK`**: List of active `PortfolioResponse` objects.

#### `POST /api/v1/portfolios`
- **Request Body**:
```json
{
  "name": "Quantitative Benchmark Fund",
  "description": "Multi-asset quantitative research portfolio",
  "base_currency": "USD",
  "initial_capital": 100000.0,
  "holdings": [
    {
      "instrument_id": "7f8c49e2-3b1a-4f5a-9c8d-123456789abc",
      "quantity": 100.0,
      "entry_price": 150.0,
      "target_weight": 15.0
    }
  ]
}
```
- **Response `201 Created`**: Returns created `PortfolioResponse`.

#### `GET /api/v1/portfolios/{portfolio_id}`
- **Response `200 OK`**: Returns `PortfolioResponse`.

#### `PATCH /api/v1/portfolios/{portfolio_id}`
- **Request Body**: Partial update (`name`, `description`, `initial_capital`, `is_active`).
- **Response `200 OK`**: Returns updated `PortfolioResponse`.

#### `DELETE /api/v1/portfolios/{portfolio_id}`
- **Response `204 No Content`**: Soft-deactivates portfolio (`is_active = false`).

#### `POST /api/v1/portfolios/{portfolio_id}/holdings`
- **Request Body**:
```json
{
  "instrument_id": "8a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d",
  "quantity": 50.0,
  "entry_price": 200.0,
  "target_weight": 10.0
}
```
- **Response `201 Created`**: Returns created `PortfolioHoldingResponse`.

#### `PATCH /api/v1/portfolios/{portfolio_id}/holdings/{holding_id}`
- **Request Body**: Partial update (`quantity`, `entry_price`, `target_weight`).
- **Response `200 OK`**: Returns updated `PortfolioHoldingResponse`.

#### `DELETE /api/v1/portfolios/{portfolio_id}/holdings/{holding_id}`
- **Response `204 No Content`**: Deactivates holding position.

#### `GET /api/v1/portfolios/{portfolio_id}/analytics`
- **Query Parameters**:
  - `start_date`: ISO 8601 UTC timestamp (Optional)
  - `end_date`: ISO 8601 UTC timestamp (Optional)
  - `price_source`: `adjusted` | `close` (Default: `adjusted`)
- **Response `200 OK`**:
```json
{
  "portfolio_id": "...",
  "name": "Quantitative Benchmark Fund",
  "base_currency": "USD",
  "price_source": "adjusted",
  "quality_status": "GOOD",
  "quality_warnings": [],
  "summary": {
    "initial_capital": 100000.0,
    "initial_invested_value": 15000.0,
    "cash": 85000.0,
    "current_invested_value": 18000.0,
    "current_portfolio_value": 103000.0,
    "total_pnl": 3000.0,
    "total_return": 0.03
  },
  "holdings": [],
  "allocation": [],
  "performance_series": []
}
```

---

### Correlation API (Step 11)

#### `GET /api/v1/correlation`
- **Query Parameters**:
  - `instrument_ids`: List of UUID strings (Required, min 2, max 20)
  - `start_date`: ISO 8601 UTC timestamp (Optional)
  - `end_date`: ISO 8601 UTC timestamp (Optional)
  - `return_type`: `simple` | `log` (Default: `simple`)
  - `price_source`: `adjusted` | `close` (Default: `adjusted`)
  - `alignment_mode`: `pairwise_complete` | `common_intersection` (Default: `pairwise_complete`)
- **Response `200 OK`**: Returns `CorrelationMatrixResponse` ($N \times N$ matrix and flat pairwise items).

#### `GET /api/v1/correlation/pair`
- **Query Parameters**:
  - `instrument_a`: UUID string (Required)
  - `instrument_b`: UUID string (Required)
  - `start_date`: ISO 8601 UTC timestamp (Optional)
  - `end_date`: ISO 8601 UTC timestamp (Optional)
  - `return_type`: `simple` | `log` (Default: `simple`)
  - `price_source`: `adjusted` | `close` (Default: `adjusted`)
- **Response `200 OK`**: Returns `CorrelationPairwiseResponse` (Pearson coefficient, observation count, qualitative interpretation, and aligned scatter points).

#### `GET /api/v1/correlation/rolling`
- **Query Parameters**:
  - `instrument_a`: UUID string (Required)
  - `instrument_b`: UUID string (Required)
  - `window`: int observation window size (Default: `60`, min 5, max 500)
  - `start_date`: ISO 8601 UTC timestamp (Optional)
  - `end_date`: ISO 8601 UTC timestamp (Optional)
  - `return_type`: `simple` | `log` (Default: `simple`)
  - `price_source`: `adjusted` | `close` (Default: `adjusted`)
- **Response `200 OK`**: Returns `RollingCorrelationResponse` (time-varying rolling correlation points).

---

### Volatility API (Step 12)

#### `GET /api/v1/volatility`
- **Query Parameters**:
  - `instrument_id`: UUID string for single instrument detailed analysis (Optional)
  - `instrument_ids`: List of UUID strings for multi-instrument comparison (Optional)
  - `start_date`: ISO 8601 UTC timestamp (Optional)
  - `end_date`: ISO 8601 UTC timestamp (Optional)
  - `price_source`: `adjusted` | `close` (Default: `adjusted`)
  - `return_type`: `simple` | `log` (Default: `simple`)
  - `rolling_window`: int observation size (Default: `20`, e.g. 10, 20, 30, 60, 90, 120, 252)
  - `annualized`: boolean (Default: `true`)
- **Response `200 OK` (Single Instrument Mode)**:
```json
{
  "instrument_id": "7f8c49e2-3b1a-4f5a-9c8d-123456789abc",
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "asset_type": "EQUITY",
  "price_source": "adjusted",
  "return_type": "simple",
  "rolling_window": 20,
  "annualized": true,
  "quality_status": "GOOD",
  "quality_warning": null,
  "is_sufficient": true,
  "message": null,
  "summary": {
    "daily_volatility": 0.0142,
    "annualized_volatility": 0.2254,
    "upside_volatility": 0.0118,
    "downside_volatility": 0.0162,
    "observation_count": 252,
    "annualization_factor": 252
  },
  "rolling_series": [
    { "timestamp": "2025-01-02T00:00:00Z", "rolling_volatility": null },
    { "timestamp": "2025-01-30T00:00:00Z", "rolling_volatility": 0.2185 }
  ],
  "distribution": {
    "summary": {
      "mean": 0.0008,
      "median": 0.0005,
      "min": -0.045,
      "max": 0.052,
      "std_dev": 0.0142,
      "positive_observations": 135,
      "negative_observations": 115,
      "zero_observations": 2,
      "total_observations": 252
    },
    "histogram": [
      {
        "bin_start": -0.045,
        "bin_end": -0.040,
        "bin_center": -0.0425,
        "count": 3,
        "frequency_pct": 1.19
      }
    ]
  }
}
```
```
- **Response `200 OK` (Multi-Instrument Comparison Mode)**:
```json
{
  "return_type": "simple",
  "price_source": "adjusted",
  "instruments": [
    {
      "instrument_id": "...",
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "asset_type": "EQUITY",
      "observation_count": 252,
      "daily_volatility": 0.0142,
      "annualized_volatility": 0.2254,
      "upside_volatility": 0.0118,
      "downside_volatility": 0.0162,
      "annualization_factor": 252,
      "is_sufficient": true,
      "message": null
    }
  ]
}
```

---

### Strategies API (Step 13)

#### `GET /api/v1/strategies/moving-average`
- **Query Parameters**:
  - `instrument_id`: UUID string (Required)
  - `start_date`: ISO 8601 UTC timestamp (Optional)
  - `end_date`: ISO 8601 UTC timestamp (Optional)
  - `price_source`: `adjusted` | `close` (Default: `adjusted`)
  - `ma_type`: `sma` | `ema` (Default: `sma`)
  - `fast_window`: int fast MA observation window size (Default: `20`)
  - `slow_window`: int slow MA observation window size (Default: `50`)
- **Response `200 OK`**:
```json
{
  "summary": {
    "instrument_id": "7f8c49e2-3b1a-4f5a-9c8d-123456789abc",
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "asset_type": "EQUITY",
    "price_source": "adjusted",
    "ma_type": "SMA",
    "fast_window": 20,
    "slow_window": 50,
    "start_date": "2025-01-01T00:00:00Z",
    "end_date": "2026-01-01T00:00:00Z",
    "observation_count": 252,
    "current_signal": "BUY",
    "latest_signal_event": "BUY",
    "last_crossover": "2025-11-14T00:00:00Z",
    "bullish_crossover_count": 3,
    "bearish_crossover_count": 2
  },
  "crossovers": [
    {
      "timestamp": "2025-11-14T00:00:00Z",
      "event_type": "BULLISH",
      "signal": "BUY",
      "price": 182.45,
      "fast_ma": 179.12,
      "slow_ma": 178.95
    }
  ],
  "series": [
    {
      "timestamp": "2025-01-02T00:00:00Z",
      "price": 150.0,
      "fast_ma": null,
      "slow_ma": null,
      "signal": "HOLD"
    },
    {
      "timestamp": "2025-11-14T00:00:00Z",
      "price": 182.45,
      "fast_ma": 179.12,
      "slow_ma": 178.95,
      "signal": "BUY"
    }
  ],
  "quality_status": "GOOD",
  "quality_warning": null,
  "is_sufficient": true,
  "message": null
}
```
- **Error Responses**:
  - `400 Bad Request`: `fast_window >= slow_window` or non-positive window inputs.
  - `404 Not Found`: Instrument ID does not exist.

---

## 11. Signal Management API (`/api/v1/signals`)

### `GET /api/v1/signals`
Queries standardized signal events across instruments, strategy configurations, and signal types with optional filtering and pagination.

- **Query Parameters**:
  - `instrument_id` (optional `string`): Filter by instrument UUID.
  - `strategy_type` (optional `string`): Filter by strategy type (e.g., `'MOVING_AVERAGE'`).
  - `strategy_configuration_id` (optional `string`): Filter by strategy configuration UUID.
  - `signal_type` (optional `string`): Filter by `'BUY'` or `'SELL'`.
  - `signal_state` (optional `string`): Filter by `'BULLISH'`, `'BEARISH'`, or `'NEUTRAL'`.
  - `start_date` (optional `ISO-8601 string`): Start timestamp filter.
  - `end_date` (optional `ISO-8601 string`): End timestamp filter.
  - `limit` (optional `integer`, default `100`, max `1000`): Max records returned.
  - `offset` (optional `integer`, default `0`): Pagination offset.

- **Example Response (`200 OK`)**:
```json
{
  "items": [
    {
      "id": "c1f7b49a-7a8e-4a6d-9b12-5f8e3c12a456",
      "strategy_configuration_id": "89a3f2b1-1122-3344-5566-778899aabbcc",
      "instrument_id": "3a12b456-789c-4def-[#]-123456789abc",
      "strategy_type": "MOVING_AVERAGE",
      "timestamp": "2026-04-17T00:00:00Z",
      "signal_type": "BUY",
      "signal_state": "BULLISH",
      "price": 184.32,
      "source": "STRATEGY_ENGINE",
      "metadata": {
        "fast_ma": 181.76,
        "slow_ma": 181.54,
        "fast_window": 20,
        "slow_window": 50,
        "ma_type": "SMA",
        "price_source": "adjusted"
      },
      "created_at": "2026-09-24T21:40:00Z",
      "configuration": {
        "id": "89a3f2b1-1122-3344-5566-778899aabbcc",
        "strategy_type": "MOVING_AVERAGE",
        "instrument_id": "3a12b456-789c-4def-[#]-123456789abc",
        "configuration_hash": "a1b2c3d4e5f6...",
        "ma_type": "SMA",
        "fast_window": 20,
        "slow_window": 50,
        "price_source": "adjusted",
        "active": true
      }
    }
  ],
  "total": 1,
  "limit": 100,
  "offset": 0
}
```

### `GET /api/v1/signals/{signal_id}`
Retrieves standardized detail for a specific signal event by UUID.

- **Example Response (`200 OK`)**: Standardized `SignalEventResponse` object.
- **Error Response**: `404 Not Found` if the signal ID does not exist.

---

### Backtesting API (Step 16)

#### `POST /api/v1/backtests`
Starts a historical simulation run for a single instrument and strategy configuration. Enforces look-ahead-free `NEXT_OPEN` execution timing and cost-aware position sizing.

- **Request Body**:
```json
{
  "instrument_id": "3a12b456-789c-4def-90ab-123456789abc",
  "strategy_configuration_id": "89a3f2b1-1122-3344-5566-778899aabbcc",
  "start_date": "2025-01-01T00:00:00Z",
  "end_date": "2026-01-01T00:00:00Z",
  "initial_capital": 100000.0,
  "execution_timing": "NEXT_OPEN",
  "position_sizing": "FULL_CAPITAL",
  "commission": 0.001,
  "slippage": 0.0005,
  "direction": "LONG_ONLY"
}
```

- **Response (`201 Created`)**:
```json
{
  "id": "5b73a32f-12b9-42d6-a04e-772a3e0e09d7",
  "strategy_configuration_id": "89a3f2b1-1122-3344-5566-778899aabbcc",
  "instrument_id": "3a12b456-789c-4def-90ab-123456789abc",
  "symbol": "NVDA",
  "start_date": "2025-01-01T00:00:00Z",
  "end_date": "2026-01-01T00:00:00Z",
  "initial_capital": 100000.0,
  "execution_timing": "NEXT_OPEN",
  "position_sizing": "FULL_CAPITAL",
  "commission": 0.001,
  "slippage": 0.0005,
  "direction": "LONG_ONLY",
  "status": "COMPLETED",
  "final_cash": 102450.12,
  "final_position": 0.0,
  "final_portfolio_value": 102450.12,
  "trade_count": 6,
  "portfolio_state_count": 252,
  "error_message": null,
  "created_at": "2026-09-24T22:30:00Z"
}
```

#### `GET /api/v1/backtests`
Queries list of executed historical backtest runs.

- **Query Parameters**:
  - `instrument_id` (optional `string`): Filter by target instrument UUID.
  - `limit` (optional `int`, default `50`): Maximum records to return.
  - `offset` (optional `int`, default `0`): Pagination offset.

- **Response (`200 OK`)**: Paginated list of backtest summary objects.

#### `GET /api/v1/backtests/{backtest_id}`
Fetches details of a specific backtest run by ID.

#### `GET /api/v1/backtests/{backtest_id}/trades`
Queries simulated trade execution events recorded during the backtest run (`side`, `execution_price`, `quantity`, `notional_value`, `commission`, `slippage`, `cash_after`).

#### `GET /api/v1/backtests/{backtest_id}/completed-trades`
Queries round-trip completed trade accounting records produced by matching entry and exit executions (`entry_timestamp`, `exit_timestamp`, `entry_price`, `exit_price`, `quantity`, `total_cost`, `gross_pnl`, `net_pnl`, `trade_return`, `duration_days`, `exit_reason`).

#### `GET /api/v1/backtests/{backtest_id}/states`
Queries portfolio state history records generated during the backtest run (`cash`, `position_quantity`, `market_price`, `position_value`, `portfolio_value`, `unrealized_pnl`).

#### `GET /api/v1/backtests/{backtest_id}/performance`
Queries server-side quantitative evaluation metrics for a completed backtest (`returns`, `risk`, `drawdown`, `trading`, `costs_and_exposure`). Optional query parameter `risk_free_rate` (default: `0.0`).

#### `GET /api/v1/backtests/{backtest_id}/equity`
Queries equity curve and drawdown time series (`timestamp`, `portfolio_value`, `cumulative_return`, `running_peak`, `drawdown_amount`, `drawdown_percentage`, `cash`, `position_value`, `position_quantity`).

#### `GET /api/v1/backtests/{backtest_id}/drawdown`
Queries dedicated drawdown percentage and drawdown amount time-series observations derived from authoritative portfolio states.

- **Response (`200 OK`)**:
```json
{
  "backtest_id": "5b73a32f-12b9-42d6-a04e-772a3e0e09d7",
  "symbol": "NVDA",
  "initial_capital": 100000.0,
  "drawdown_series": [
    {
      "timestamp": "2025-01-02T00:00:00Z",
      "portfolio_value": 100000.0,
      "running_peak": 100000.0,
      "drawdown_amount": 0.0,
      "drawdown_percentage": 0.0
    },
    {
      "timestamp": "2025-02-15T00:00:00Z",
      "portfolio_value": 91600.0,
      "running_peak": 100000.0,
      "drawdown_amount": -8400.0,
      "drawdown_percentage": -0.084
    }
  ]
}
```

#### `GET /api/v1/backtests/{backtest_id}/drawdown-periods`
Queries discrete peak-to-trough drawdown periods detected across the backtest simulation horizon.

- **Response (`200 OK`)**:
```json
{
  "backtest_id": "5b73a32f-12b9-42d6-a04e-772a3e0e09d7",
  "symbol": "NVDA",
  "total_periods": 2,
  "periods": [
    {
      "peak_timestamp": "2026-01-12T00:00:00Z",
      "trough_timestamp": "2026-02-03T00:00:00Z",
      "recovery_timestamp": "2026-02-21T00:00:00Z",
      "peak_equity": 110000.0,
      "trough_equity": 100760.0,
      "drawdown_amount": -9240.0,
      "drawdown_percentage": -0.084,
      "duration_days": 40,
      "recovery_duration_days": 18,
      "status": "RECOVERED"
    },
    {
      "peak_timestamp": "2026-04-10T00:00:00Z",
      "trough_timestamp": "2026-05-05T00:00:00Z",
      "recovery_timestamp": null,
      "peak_equity": 115000.0,
      "trough_equity": 107985.0,
      "drawdown_amount": -7015.0,
      "drawdown_percentage": -0.061,
      "duration_days": 25,
      "recovery_duration_days": null,
      "status": "ACTIVE"
    }
  ]
}
#### `GET /api/v1/backtests/{backtest_id}/report`
Queries structured 14-section quantitative backtest research report object (`report_version`, `generated_at`, `configuration_hash`, `executive_summary`, `configuration`, `strategy`, `signals_summary`, `market_data`, `execution_assumptions`, `cost_assumptions`, `performance`, `equity_summary`, `drawdown_summary`, `accounting`, `data_quality`, `methodology`, `limitations`, `reproducibility`).

#### `GET /api/v1/backtests/{backtest_id}/report/export`
Exports the backtest research report artifact.

- **Query Parameters**:
  - `format`: `json` | `csv` | `pdf` (Default: `json`)
- **Responses**:
  - `format=pdf`: Returns `application/pdf` binary stream (`Content-Disposition: attachment; filename="backtest_report_AAPL_5b73a32f.pdf"`).
  - `format=csv`: Returns `text/csv` formatted table file (`Content-Disposition: attachment; filename="backtest_report_AAPL_5b73a32f.csv"`).
---

## 12. Dashboard Overview API (`/api/v1/dashboard`)

### `GET /api/v1/dashboard/overview`
Retrieves aggregated overview metrics for the Unified Quant Research Dashboard including system data status, tracked instruments snapshot, active portfolio valuation, strategy signals, recent backtest runs, and system activity logs.

- **Response `200 OK`**:
```json
{
  "summary": {
    "tracked_instruments_count": 5,
    "portfolios_count": 2,
    "strategy_configurations_count": 4,
    "completed_backtests_count": 3
  },
  "system_status": {
    "data_status": "Good",
    "backend_status": "ONLINE",
    "database_connected": true,
    "last_updated": "2026-09-25T02:20:00Z"
  },
  "market_data_snapshot": [
    {
      "id": "7f8c49e2-3b1a-4f5a-9c8d-123456789abc",
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "asset_type": "EQUITY",
      "exchange": "NASDAQ",
      "provider": "YAHOO",
      "frequency": "DAILY",
      "latest_observation_date": "2026-09-24T00:00:00Z",
      "observation_count": 1442,
      "data_quality": "Good",
      "freshness_label": "Latest Observation: 2026-09-24"
    }
  ],
  "portfolio_snapshot": {
    "active_portfolios_count": 2,
    "total_portfolio_value": 250000.0,
    "total_portfolio_return_pct": 12.5,
    "total_cash": 180000.0,
    "total_positions_count": 6,
    "portfolios": []
  },
  "strategy_snapshot": {
    "strategy_configurations_count": 4,
    "recent_signals": []
  },
  "recent_backtests": [
    {
      "id": "5b73a32f-12b9-42d6-a04e-772a3e0e09d7",
      "instrument_symbol": "AAPL",
      "strategy_name": "MOVING_AVERAGE (SMA)",
      "period": "2023-01-01 → 2024-01-01",
      "status": "COMPLETED",
      "total_return_pct": 15.4,
      "max_drawdown_pct": null,
      "trade_count": 8,
      "completed_at": "2026-09-24T22:30:00Z"
    }
  ],
  "recent_activity": [
    {
      "id": "act-ingest-123",
      "timestamp": "2026-09-24T21:00:00Z",
      "activity_type": "MARKET_DATA_INGESTION",
      "entity_symbol_or_name": "AAPL",
      "status": "COMPLETED"
    }
  ]
}
```
---

## 13. Unified Export & Research Data Delivery API (`/api/v1/*/export`)

A comprehensive institutional export system allowing researchers to extract deterministic, reproducible research results in CSV, JSON, and PDF formats.

### Core Export Principles
- **No Recalculation**: The export layer is strictly a delivery adapter. It consumes existing domain and analytics results without duplicating financial formulas.
- **Strict UTC Standard**: All machine-readable timestamps are ISO 8601 UTC (`2026-09-25T15:30:00Z`).
- **Precision Preservation**: Raw numeric precision is preserved. CSV numbers never include currency symbols (e.g. `125000.50`, not `$125,000.50`).
- **Semantic Nulls**: Missing values are serialized as `null` in JSON and empty strings in CSV (never coerced to `0` or `0.00%`).
- **Sanitized Filenames**: Filenames are deterministic, human-readable, and sanitized against path traversal or unsafe characters.
- **HTTP Streaming Headers**: Responses include accurate `Content-Type` and `Content-Disposition: attachment; filename="..."` headers.

### Available Endpoints

#### 1. Market Data Export
`GET /api/v1/market-data/export`
- **Query Parameters**:
  - `instrument_id` (required `UUID`): Instrument identifier
  - `format` (optional `csv` | `json`, default `csv`)
  - `data_type` (optional `market_data` | `quality`, default `market_data`)
  - `start_date` / `end_date` (optional `ISO-8601`)
  - `frequency` (optional `daily`)
- **Fields (CSV)**: `timestamp`, `open`, `high`, `low`, `close`, `adjusted_close`, `volume`, `dividend_amount`, `split_coefficient`

#### 2. Returns Export
`GET /api/v1/returns/export`
- **Query Parameters**:
  - `instrument_id` (required `UUID`)
  - `format` (optional `csv` | `json`, default `csv`)
  - `return_type` (optional `simple` | `log`, default `simple`)
  - `price_source` (optional `adjusted` | `close`, default `adjusted`)
  - `start_date` / `end_date` (optional `ISO-8601`)
- **Fields (CSV)**: `date`, `price`, `simple_return`, `log_return`, `cumulative_return`

#### 3. Portfolio Export
`GET /api/v1/portfolios/{portfolio_id}/export`
- **Query Parameters**:
  - `data_type` (optional `holdings` | `summary` | `performance`, default `holdings`)
  - `format` (optional `csv` | `json`, default `csv`)
  - `start_date` / `end_date` (optional `ISO-8601`)
  - `price_source` (optional `adjusted` | `close`, default `adjusted`)
- **Fields (Holdings CSV)**: `instrument_id`, `symbol`, `name`, `asset_type`, `quantity`, `entry_price`, `entry_date`, `target_weight`, `current_price`, `market_value`, `weight`, `unrealized_pnl`

#### 4. Correlation Export
`GET /api/v1/correlation/export`
- **Query Parameters**:
  - `data_type` (optional `matrix` | `pairwise` | `rolling`, default `matrix`)
  - `format` (optional `csv` | `json`, default `csv`)
  - `instrument_ids` (multi-valued `UUID` list)
  - `instrument_a` / `instrument_b` (required for pairwise/rolling)
  - `window` (optional integer, default `60` for rolling)
  - `start_date` / `end_date` (optional `ISO-8601`)
  - `price_source` (optional `adjusted` | `close`)
  - `return_type` (optional `simple` | `log`)
- **Format**: Symmetrical CSV matrix with asset tickers as row and column headers.

#### 5. Volatility Export
`GET /api/v1/volatility/export`
- **Query Parameters**:
  - `instrument_id` (required `UUID`)
  - `data_type` (optional `rolling` | `summary`, default `rolling`)
  - `format` (optional `csv` | `json`, default `csv`)
  - `rolling_window` (optional integer, default `30`)
  - `annualized` (optional boolean, default `true`)
  - `start_date` / `end_date` (optional `ISO-8601`)
  - `price_source` / `return_type`
- **Fields (Rolling CSV)**: `date`, `rolling_volatility`, `annualized_volatility`

#### 6. Strategy & Signal Exports
`GET /api/v1/strategies/moving-average/export`
- **Query Parameters**: `instrument_id`, `format`, `fast_window`, `slow_window`, `ma_type`, `price_source`, `start_date`, `end_date`
- **Fields (CSV)**: `timestamp`, `price`, `fast_ma`, `slow_ma`, `signal`, `crossover_event`

`GET /api/v1/signals/export`
- **Query Parameters**: `format`, `instrument_id`, `strategy_type`, `signal_type`, `start_date`, `end_date`
- **Fields (CSV)**: `id`, `timestamp`, `instrument_id`, `strategy_type`, `signal_type`, `signal_state`, `price`, `source`

#### 7. Backtest Research Exports
`GET /api/v1/backtests/{backtest_id}/export`
- **Query Parameters**:
  - `data_type` (optional `report` | `trades` | `equity` | `drawdown` | `states`, default `report`)
  - `format` (optional `pdf` | `csv` | `json`, default `pdf`)
- **PDF Report**: Formatted ReportLab quantitative research document including executive summary, configuration, data quality, performance table, equity trajectory, drawdown analysis, trade log, and methodology notes.
- **Trades CSV**: `trade_id`, `entry_date`, `exit_date`, `direction`, `quantity`, `entry_price`, `exit_price`, `pnl`, `return_pct`, `fees`
- **Equity CSV**: `timestamp`, `cash`, `positions_value`, `total_equity`, `period_return`
- **Drawdown CSV**: `timestamp`, `equity`, `peak`, `drawdown_value`, `drawdown_pct`
- **Portfolio States CSV**: `timestamp`, `cash`, `gross_value`, `net_value`, `leverage`









