# Recovery Strategies by Failure Class

## 1. Matrix of Operational Recovery Paths

Every failure in the Quant Research Dashboard maps to a deterministic recovery path:

| Failure Scenario | Error Code | Automatic System Action | User Recovery Path |
| :--- | :--- | :--- | :--- |
| **Provider Timeout / 503** | `PROVIDER_TIMEOUT` / `PROVIDER_UNAVAILABLE` | Retries 3 times with exponential backoff & jitter. Fallback to cached DB records if available. | Click "Force Refresh" when provider recovers, or continue analysis with cached observations. |
| **Provider Rate Limit (429)** | `RATE_LIMITED` | Prevents immediate retry loops; extracts `retry_after`. | Wait for rate limit cool-down; inspect `retry_after` countdown in `ProviderErrorState`. |
| **Insufficient Historical Bars** | `INSUFFICIENT_DATA` | Mathematical calculations return `null` instead of crashing with division by zero. | Expand date range preset (`1Y`, `5Y`, `MAX`) via `InsufficientDataState` action. |
| **Critical Data Quality Issue** | `DATA_QUALITY_ERROR` | Prevents invalid bar insertion; marks batch `INVALID` in IngestionLog. | Select alternative data provider or inspect QC issue logs in Data Quality tab. |
| **Zero Variance / Constant Price** | `CALCULATION_ERROR` | Sanitizes `NaN`/`Inf` to `None`/`null`; avoids returning fake numbers. | Select dynamic asset with historical price movement. |
| **Database Lock / Transient Abort** | `DATABASE_TIMEOUT` / `DATABASE_ERROR` | Explicit `session.rollback()` reverts partial state. | Click "Retry Request" on `ModuleErrorState`. |
| **Export Generation Failure** | `EXPORT_ERROR` | Aborts corrupted file generation; returns structured JSON error. | Check active date range and retry export via `ExportMenu`. |
| **Frontend Component Crash** | Client Exception | `ModuleErrorBoundary` isolates crash to target panel. | Click "Reset Module" button; navigation and other pages remain intact. |
