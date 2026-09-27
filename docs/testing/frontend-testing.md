# Frontend Testing with Vitest & React Testing Library

## 1. Overview & Tooling

The frontend testing suite utilizes **Vitest** paired with **React Testing Library (RTL)** and **jsdom**. The architecture prioritizes testing user-visible behavior and quantitative state transitions rather than fragile internal implementation details.

### Test Runner Configuration
Configured in `frontend/vitest.config.ts`:
- Environment: `jsdom`
- Setup File: `src/test/setup.ts` (sets up `@testing-library/jest-dom`, mocks for `ResizeObserver`, `IntersectionObserver`, and Canvas for charts)
- Coverage Provider: `v8`

---

## 2. Component Testing

Reusable UI components are tested in `frontend/src/components/__tests__/`:

### 2.1 `MetricCard.test.tsx`
- Renders quantitative metric title, formatted value, and sub-text.
- Applies institutional semantic styling (e.g., green for positive return, red for negative return).
- Handles empty/undefined metric values gracefully.

### 2.2 `ContextBar.test.tsx`
- Displays active research context (selected instrument, active date range, current benchmark).
- Renders quick-navigation badges allowing users to jump across research modules.
- Synchronizes with URL search parameters and TanStack Query keys.

### 2.3 `ResearchCommandPalette.test.tsx`
- Opens via shortcut (`Cmd+K` / `Ctrl+K`) or header trigger.
- Provides keyboard navigation across all 10 quantitative modules.
- Allows immediate symbol search and research context switching.

---

## 3. Page & Workflow Testing (`ResearchWorkflows.test.tsx`)

Located in `frontend/src/pages/__tests__/ResearchWorkflows.test.tsx`, these tests mount full page views wrapped in `QueryClientProvider` and `MemoryRouter`:

1. **Market Data Page**:
   - Verifies instrument selection dropdown.
   - Tests historical OHLCV table rendering and frequency selectors.
   - Validates CSV export trigger.

2. **Returns Analysis Page**:
   - Verifies return type toggle (Simple vs Log).
   - Validates metrics summary cards (Mean Return, Volatility, Cumulative Return).
   - Tests date range selector updates.

3. **Portfolio Management Page**:
   - Verifies portfolio creation modal and holding addition inputs.
   - Asserts target weight validation (preventing weights exceeding 100%).
   - Displays portfolio balance and asset allocation breakdown.

4. **Strategy Configuration Page**:
   - Configures Moving Average parameters (Fast MA, Slow MA).
   - Verifies signal generation button and signal history table.

5. **Backtesting & Reporting Page**:
   - Executes backtest run with selected capital and transaction cost parameters.
   - Asserts key metrics: Sharpe Ratio, Sortino Ratio, Max Drawdown, Win Rate.
   - Triggers backtest PDF and CSV report exports.

---

## 4. TanStack Query & State Management Testing

### Mocking Server Queries
All page tests configure an isolated `QueryClient` with retries disabled:
```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
  },
});
```

### Zustand Store Isolation
Zustand stores (such as UI preferences and research context) reset between test cases using `beforeEach` hooks to prevent cross-test state leakage.
