# Market Data Provider Failures & Cached Fallback

## 1. Provider Isolation

The application interacts with third-party market data feeds (such as Yahoo Finance) exclusively through the `MarketDataProvider` abstraction. No financial engine depends directly on vendor-specific payloads.

---

## 2. Failure Handling & Cached Fallback Strategy

When fetching latest or historical market data:

```text
User or System triggers Quote / Bar Refresh
                      ↓
           Provider API Call (Attempt 1..3)
                      ↓
                  [FAILS?]
                 /        \
              YES          NO → Validate → Persist Idempotently → Return Fresh Data
              /
   Check PostgreSQL Cache
          /          \
   [Valid Bar Exists?] \
        /               \
      YES                NO
      /                   \
Return Cached Bar    Raise Explicit Exception
+ DataFreshness.STALE     (ProviderUnavailableException)
+ Warning Message         Zero synthetic or fake data returned!
```

---

## 3. Freshness States on Fallback

When a provider is unreachable, previously validated historical records are returned with explicit freshness indicators:

- `is_cached`: `true`
- `freshness`: `STALE` or `RECENT`
- `warning`: `"Provider temporarily unavailable. Showing the most recent validated observation."`

The UI renders the `StaleDataBanner` component, ensuring the researcher is never misled into believing the data reflects real-time prices.
