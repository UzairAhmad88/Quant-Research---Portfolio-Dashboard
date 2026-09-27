# Troubleshooting & Diagnostic Guide

## 1. Using Request IDs for End-to-End Tracing

Every request processed by the FastAPI backend generates or receives a UUID correlation identifier:
- **Client Header**: `X-Request-ID`
- **Response Header**: `X-Request-ID`
- **Response Payload**: `request_id` field in standard error envelopes

When a researcher reports a calculation or provider issue:
1. Locate the Request ID in the `ModuleErrorState` card or developer console.
2. Search the backend logs for `req_id=<request_id>`:
   ```bash
   grep "req_id=8f3b211a-3e91-4cf1-837b-99d9b4b08702" backend/logs/*.log
   ```
3. The log entry will provide exact duration, method, path, HTTP status, and full backend traceback without exposing sensitive credentials to the browser.

---

## 2. Common Diagnostic Scenarios

### Scenario A: "Rate limit exceeded (HTTP 429)"
- **Cause**: Rapid consecutive fetches against Yahoo Finance free tier.
- **Solution**: The system displays `ProviderErrorState` with `RATE_LIMITED`. Rely on previously cached database observations or configure a commercial provider adapter.

### Scenario B: "Insufficient observations for annualized volatility"
- **Cause**: The selected instrument only has 10 daily bars in the database, but 30 observations are required for sample standard deviation with statistical validity.
- **Solution**: Click "Expand Date Range" to pull a broader historical window.

### Scenario C: "Database rollback after failed ingestion"
- **Cause**: Network dropped midway through downloading a 5-year OHLCV batch.
- **Solution**: Transaction safety guarantees zero orphaned bars were written. Safe to trigger the fetch again via the Market Data page.
