# API Contract & Schema Testing

## 1. Overview & Transport Setup

API testing verifies that all HTTP endpoints uphold predictable contracts, strict Pydantic input/output schemas, standardized HTTP status codes, and uniform error structures.

API tests use `httpx.AsyncClient` paired with FastAPI's `ASGITransport` to execute fast, in-process requests without opening network ports:

```python
from httpx import AsyncClient, ASGITransport
from app.main import app

transport = ASGITransport(app=app)
async with AsyncClient(transport=transport, base_url="http://test") as client:
    response = await client.get("/api/v1/health")
```

---

## 2. HTTP Status Codes & Error Envelopes

API tests verify standard status codes:

| HTTP Status | Trigger Condition | Test Verification |
| :--- | :--- | :--- |
| **200 OK** | Successful read, calculation, or query | Response body adheres to Pydantic schema |
| **201 Created** | Successful entity creation (e.g. portfolio, backtest) | Returns newly generated UUID and entity data |
| **400 Bad Request**| Business validation failure (e.g., unsupported export format) | Returns error code and structured explanation |
| **404 Not Found** | Missing resource UUID or symbol | Returns structured 404 error envelope |
| **422 Unprocessable**| Malformed payload or missing required Pydantic fields | Returns FastAPI field-level validation errors |
| **500 Internal** | Unhandled provider or execution error | Safe error message without exposing credentials |

### Standard Error Envelope Verification
```python
# Verification of 404 structured response
response = await client.get(f"/api/v1/instruments/{uuid.uuid4()}")
assert response.status_code == 404
data = response.json()
assert "detail" in data
```

---

## 3. Serialization & Date-Time Standards

All API responses enforce strict quantitative formatting standards:
1. **Timestamp Serialization**: Timestamps must be serialized in ISO-8601 format with UTC timezone indicators (`Z` or `+00:00`).
2. **Numeric Precision**: Prices, weights, and returns are serialized as JSON numbers, never converted to ambiguous strings.
3. **Null Semantics**: Missing values (such as undefined Sharpe ratio on zero variance or initial return in a discrete series) must serialize as `null`, never `NaN`, `Infinity`, or `0.0`.

---

## 4. Tested Endpoints Catalog

- `/api/v1/health`: System health and component status.
- `/api/v1/instruments`: Instrument search, creation, and metadata retrieval.
- `/api/v1/market-data`: Historical OHLCV bar queries and ingestion triggers.
- `/api/v1/market-data/latest`: Real-time quote acquisition and freshness assessment.
- `/api/v1/analytics/returns`: Simple, log, and cumulative return calculations.
- `/api/v1/analytics/volatility`: Daily, annualized, rolling, and upside/downside volatility.
- `/api/v1/analytics/correlation`: Multi-asset Pearson correlation matrices.
- `/api/v1/portfolio`: Portfolios, holdings, valuations, and target weights.
- `/api/v1/strategies`: Moving Average strategy configuration and signal runs.
- `/api/v1/backtests`: Backtest execution, trade simulation, equity progression, and metrics.
- `/api/v1/exports`: Multi-format export delivery (CSV, JSON, PDF).
