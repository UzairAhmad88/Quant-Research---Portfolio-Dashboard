# Frontend Error Handling & Resilience

## 1. Error Boundary Architecture

The frontend uses a dual-layer error boundary structure (`src/components/feedback/ErrorBoundary.tsx`):

```text
┌──────────────────────────────────────────────────┐
│              GlobalErrorBoundary                 │ (Root application shell crash barrier)
│  ┌────────────────────────────────────────────┐  │
│  │ Navigation Sidebar / Command Palette       │  │ (Always alive)
│  ├────────────────────────────────────────────┤  │
│  │ ModuleErrorBoundary (e.g. Backtest Page)   │  │ (Isolates panel crashes)
│  │  - Renders ModuleErrorState on render fail │  │
│  │  - Reset button restores active module     │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

1. **`GlobalErrorBoundary`**: Catches unhandled catastrophic root rendering crashes. Displays an institutional crash screen with a "Reload Dashboard" action.
2. **`ModuleErrorBoundary`**: Catches runtime errors inside an individual quantitative panel (e.g., an unhandled SVG chart edge case). Renders an isolated module error card while keeping the sidebar, context bar, and other pages alive.

---

## 2. Reusable Error UI Components (`src/components/feedback/`)

| Component | Use Case | Key Features |
| :--- | :--- | :--- |
| `ModuleErrorState` | Panel or calculation failure | Error code badge, copyable Request ID, expandable diagnostics, retry trigger. |
| `InsufficientDataState` | Observations below statistical minimum | Explains required vs available counts, provides "Expand Date Range" action. |
| `ProviderErrorState` | Third-party provider outage or 429 rate limit | Rate limit badge, retry countdown, cached data indicator. |
| `StaleDataBanner` | Displaying cached database data when refresh fails | Amber warning banner, observation timestamp, force refresh button. |
| `InlineError` | Form and field-level validation | Accessible `role="alert"` for date ranges, symbol inputs, and parameters. |
| `WarningBanner` | Informative non-fatal warnings | Restrained amber banner for quality-control warnings. |

---

## 3. ApiError Handling in Client Services

All API calls reject with an `ApiError` instance extending native `Error`:
```typescript
try {
  const data = await fetchReturns({ instrument_id: '...' });
} catch (err) {
  if (err instanceof ApiError) {
    console.log(err.code);       // e.g. "INSUFFICIENT_DATA"
    console.log(err.requestId);  // e.g. "8f3b211a-..."
    console.log(err.retryable);  // boolean
  }
}
```
