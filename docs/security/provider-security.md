# Provider Security & SSRF Protection

Market data ingestion communicates with external data providers (e.g. Yahoo Finance) under strict architectural controls.

---

## 1. SSRF Prevention & Provider Allowlist

- The API **never** accepts arbitrary external URLs from client requests (e.g., `POST /fetch { "url": "http://169.254.169.254" }`).
- Provider identifiers are validated against an explicit allowlist:
  ```python
  ALLOWED_PROVIDERS = {"yahoo_finance", "yahoo", "YAHOO", "ABSTRACT"}
  ```
- Each provider is resolved through a hardcoded, verified adapter class (`YahooFinanceProviderAdapter`).

---

## 2. Ingestion Defense Pipeline

External provider responses are treated as untrusted input. The ingestion pipeline enforces:

```
Provider Response
      │
      ▼
HTTP Timeout & Retry Policy (Max 3 retries, exponential backoff, circuit breaker on 429)
      │
      ▼
Pydantic Data Normalization (Explicit typed mapping)
      │
      ▼
Market Data Validation Engine:
  ├── Positive Price Validation (Open, High, Low, Close > 0)
  ├── Non-Negative Volume (Volume >= 0)
  ├── OHLC Logic (Low <= Open, Close <= High)
  ├── Chronological Monotonic Timestamps
  ├── Duplicate Detection
  └── Suspicious Return Outlier Alerts
      │
      ▼
Controlled Persistence (Unique constraint on instrument_id + timestamp + frequency)
```
