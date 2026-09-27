# Centralized Error Code Reference & HTTP Mapping

## 1. Error Taxonomy

The application defines a centralized taxonomy of machine-readable error codes (`ErrorCode` enum in `app.core.exceptions`):

| Error Code | HTTP Status | Severity | Retryable | Description / Trigger |
| :--- | :---: | :---: | :---: | :--- |
| `VALIDATION_ERROR` | 422 / 400 | WARNING | No | Malformed request body, invalid UUID, date range violation, or unsupported parameter. |
| `NOT_FOUND` | 404 | WARNING | No | Target entity (instrument, portfolio, backtest) does not exist. |
| `CONFLICT` | 409 | WARNING | No | Duplicate key or constraint violation (e.g. symbol already exists). |
| `AUTHENTICATION_ERROR`| 401 | ERROR | No | Missing or invalid authentication token. |
| `AUTHORIZATION_ERROR` | 403 | ERROR | No | Caller lacks permission for requested operation. |
| `RATE_LIMITED` | 429 | WARNING | Yes | Provider or API rate limit exceeded. Contains `retry_after_seconds`. |
| `PROVIDER_ERROR` | 502 | ERROR | Yes | Upstream market data provider (e.g. Yahoo Finance) returned an error or invalid payload. |
| `PROVIDER_TIMEOUT` | 504 | ERROR | Yes | Upstream provider request exceeded the HTTP timeout limit. |
| `PROVIDER_UNAVAILABLE`| 503 | ERROR | Yes | Provider is down for maintenance or unreachable. |
| `DATABASE_ERROR` | 500 | CRITICAL | No | Relational persistence failure or transaction abort. |
| `DATABASE_TIMEOUT` | 504 | ERROR | Yes | Database query or lock acquisition timed out. |
| `CALCULATION_ERROR` | 422 / 500 | ERROR | No | Mathematical requirement violated (e.g., zero variance, singular matrix). |
| `INSUFFICIENT_DATA` | 422 | WARNING | No | Series has fewer observations than required (e.g. <30 bars for rolling volatility). |
| `DATA_QUALITY_ERROR` | 422 | ERROR | No | Critical OHLCV validation failure (e.g. High < Low, negative price). |
| `EXPORT_ERROR` | 500 | ERROR | No | Document renderer (PDF/CSV/JSON) encountered serialization failure. |
| `DEPENDENCY_ERROR` | 502 | ERROR | Yes | Internal microservice or subsystem communication failure. |
| `TIMEOUT` | 504 | ERROR | Yes | General operation timeout. |
| `INTERNAL_ERROR` | 500 | CRITICAL | No | Unhandled runtime exception. Stack trace recorded in server logs only. |

---

## 2. Standard Error Response Envelope

All API errors return a uniform JSON schema:

```json
{
  "error": {
    "code": "INSUFFICIENT_DATA",
    "message": "Insufficient observations for annualized volatility. Required at least 30, but received 12.",
    "details": {
      "metric": "annualized volatility",
      "required_observations": 30,
      "available_observations": 12
    },
    "severity": "WARNING",
    "retryable": false
  },
  "request_id": "8f3b211a-3e91-4cf1-837b-99d9b4b08702",
  "detail": "Insufficient observations for annualized volatility."
}
```

- `error.code`: Standard machine-readable enum value.
- `error.message`: Human-readable summary suitable for display.
- `error.details`: Structured diagnostic metadata.
- `error.severity`: `INFO`, `WARNING`, `ERROR`, or `CRITICAL`.
- `error.retryable`: Boolean informing the frontend whether an immediate or backoff retry may succeed.
- `request_id`: Tracing correlation ID linked with server logs.
