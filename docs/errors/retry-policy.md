# Provider & API Retry Policy

## 1. Principles of Safe Retries

Retrying requests against external market data providers or internal databases must be strictly bounded to prevent:
1. **Retry Storms**: Cascading request spikes amplifying upstream outages.
2. **Thread Pool Exhaustion**: Workers blocked waiting for unresponsive endpoints.
3. **Data Duplication**: Re-running non-idempotent insert operations.

---

## 2. Backend Provider Retry Policy (`app.providers.retry`)

The `execute_with_retry` function governs provider network operations:

- **Maximum Attempts**: **3** (Attempt 1 $\to$ Backoff $\to$ Attempt 2 $\to$ Backoff $\to$ Attempt 3 $\to$ Final Failure).
- **Initial Delay**: 0.5 seconds.
- **Backoff Factor**: 2.0 (Exponential: 0.5s, 1.0s, 2.0s).
- **Randomized Jitter**: Uniform random variation added between $0\%$ and $25\%$ of delay to desynchronize concurrent retry attempts.

### Classification of Failures

| Failure Type | Examples | Retry Action |
| :--- | :--- | :--- |
| **Transient Network** | `TimeoutError`, `asyncio.TimeoutError`, socket disconnect | Retry up to 3 times with backoff |
| **Provider 503 / 502** | `ProviderUnavailableException`, Bad Gateway | Retry up to 3 times with backoff |
| **HTTP 429 Rate Limit** | "Too Many Requests" | Do NOT retry immediately; raise `RateLimitedException` with `retry_after_seconds` |
| **Permanent Client** | `NotFoundException` (unknown ticker), `ValidationException` | **No Retry** (fail immediately on attempt 1) |

---

## 3. Frontend TanStack Query Retry Policy (`frontend/src/App.tsx`)

Configured centrally on the root `QueryClient`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Never retry 4xx errors (validation, insufficient data, not found)
        const status = error?.status || error?.response?.status;
        if (status && status >= 400 && status < 500) {
          return false;
        }
        return failureCount < 2; // Up to 2 retries for 5xx/network errors
      },
    },
  },
});
```
