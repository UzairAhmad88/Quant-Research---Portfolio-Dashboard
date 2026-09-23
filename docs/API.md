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
- **`400 Bad Request`** (`VALIDATION_ERROR`): Invalid query parameters or date range (`start_date > end_date`).
- **`404 Not Found`** (`NOT_FOUND`): Requested instrument or resource ID does not exist.
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

#### `GET /api/v1/market-data/{instrument_id}/latest`
- **Response `200 OK`**: Returns single latest `OHLCVResponse` bar for specified instrument.

#### `GET /api/v1/market-data/{instrument_id}/quality`
- **Query Parameters**:
  - `start_date`: ISO 8601 UTC timestamp (Optional)
  - `end_date`: ISO 8601 UTC timestamp (Optional)
  - `frequency`: `DAILY` | `HOURLY` | `MINUTE` (Default: `DAILY`)
- **Response `200 OK`**:
```json
{
  "status": "GOOD",
  "summary": {
    "total_records": 1256,
    "valid_records": 1256,
    "invalid_records": 0,
    "warning_count": 0,
    "error_count": 0,
    "critical_count": 0,
    "duplicate_records": 0,
    "potential_missing_sessions": 0
  },
  "issues": [],
  "instrument_id": "7f8c49e2-3b1a-4f5a-9c8d-123456789abc",
  "symbol": "AAPL",
  "asset_type": "EQUITY",
  "provider": "DATABASE",
  "start_date": "2021-09-23T00:00:00Z",
  "end_date": "2026-09-23T00:00:00Z",
  "generated_at": "2026-09-24T00:00:00Z"
}
```

#### `GET /api/v1/market-data/{instrument_id}/ingestions/{ingestion_id}`
- **Response `200 OK`**: Returns detailed ingestion audit log along with `quality_report`.

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
- **Response `200 OK`**:
```json
{
  "instrument_id": "7f8c49e2-3b1a-4f5a-9c8d-123456789abc",
  "symbol": "SPY",
  "asset_type": "ETF",
  "price_source": "adjusted",
  "return_type": "simple",
  "frequency": "DAILY",
  "quality_status": "GOOD",
  "quality_warning": null,
  "summary": {
    "period_return": 0.2461,
    "annualized_return": 0.0814,
    "cumulative_return": 0.2461,
    "positive_periods": 782,
    "negative_periods": 660,
    "best_period": 0.0742,
    "worst_period": -0.0611,
    "annualization_factor": 252
  },
  "series": [
    {
      "timestamp": "2021-09-23T00:00:00Z",
      "price": 440.50,
      "simple_return": null,
      "log_return": null,
      "cumulative_return": 0.0
    },
    {
      "timestamp": "2021-09-24T00:00:00Z",
      "price": 443.10,
      "simple_return": 0.005902,
      "log_return": 0.005885,
      "cumulative_return": 0.005902
    }
  ]
}
```


