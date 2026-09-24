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


