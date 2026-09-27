# End-to-End (E2E) Testing with Playwright

## 1. Overview & Deterministic Principles

End-to-end testing verifies that critical user research journeys operate reliably in a real browser environment. 

To maintain **100% determinism and avoid test flakiness**, our Playwright suite operates under two core rules:
1. **Network Interception**: All backend API calls (`/api/v1/*`) are intercepted using Playwright's `page.route()` fixtures, returning known deterministic payloads.
2. **Zero External Dependencies**: The E2E suite requires no internet connectivity and makes zero live provider calls.

---

## 2. Playwright Configuration (`frontend/playwright.config.ts`)

Configured with modern web standards:
- **Test Directory**: `./e2e`
- **Browsers**: Chromium (with optional WebKit / Firefox support)
- **Base URL**: `http://localhost:5173`
- **Web Server Hook**: Automatically boots Vite dev server during test execution if not already active.

---

## 3. Implemented Workflows (`research-workflows.spec.ts`)

The suite exercises five primary institutional workflows:

### Workflow 1 — Market Data Research
```text
Open Dashboard → Select Market Data → Select AAPL → Inspect OHLCV Bars → Trigger CSV Export
```
- Verifies instrument selection.
- Validates bar table populated with dates, open, high, low, close, volume.
- Tests export action trigger.

### Workflow 2 — Return Analysis
```text
Navigate to Returns → Switch to Log Returns → Select Date Range → Inspect Mean & Cumulative Returns
```
- Verifies interactive return calculation toggles.
- Validates responsive rendering of quantitative metric summaries.

### Workflow 3 — Portfolio Research & Allocation
```text
Navigate to Portfolio → Create Portfolio → Add Cash & Holdings → Verify Allocation Breakdown
```
- Exercises the portfolio creation modal.
- Verifies holding addition and client-side target weight validation.

### Workflow 4 — Strategy Configuration & Signal Generation
```text
Navigate to Strategies → Select Fast/Slow MA Windows → Run Strategy → Inspect Signal Table
```
- Sets parameters (e.g. Fast MA 20, Slow MA 50).
- Verifies BUY/SELL signal event list and timestamps.

### Workflow 5 — Backtesting & Executive Report Generation
```text
Navigate to Backtest → Configure Initial Capital & Fees → Run Backtest → Inspect Metrics & Export PDF
```
- Runs trade simulation with commissions and slippage.
- Asserts presence of Sharpe Ratio, Max Drawdown, and Equity progression charts.
- Triggers PDF research report generation.

---

## 4. Running E2E Tests

```bash
# Run Playwright tests headlessly
npm run test:e2e

# Run with interactive UI mode
npx playwright test --ui

# Run a specific workflow
npx playwright test research-workflows.spec.ts
```
