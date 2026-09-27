# Testing Strategy & Quality Engineering

## 1. Overview & Objectives

The Quant Research Dashboard is an institutional-grade quantitative finance platform. Because investment decisions, risk analytics, and algorithmic strategies depend on absolute calculation precision, testing in this codebase is built around **mathematical correctness, determinism, data integrity, and invariant enforcement**.

Our core testing objectives are:
1. **Financial Formula Accuracy**: Prevent silent numerical errors in returns, volatility, correlation, portfolio math, backtesting, and performance metrics.
2. **Determinism**: 100% reproducible test outcomes with zero reliance on unseeded randomness, live market feeds, or system clocks.
3. **Accounting Integrity**: Strict adherence to balance identities ($V_t = C_t + \sum P_i$) and execution rules (zero look-ahead bias, next-open execution).
4. **Data Quality & Validation**: Comprehensive inspection of OHLCV bars, freshness policies, and duplicate detection.
5. **Contract Stability**: Predictable REST API schemas, standardized error envelopes, and ISO-8601 UTC timestamps.
6. **Cross-Module Integrity**: End-to-end user workflows navigating seamlessly from Market Data to Backtesting and PDF reporting.

---

## 2. Testing Pyramid

We adhere to a classical testing pyramid where the vast majority of tests remain fast, deterministic unit and mathematical property tests:

```text
                  ┌────────────────────────┐
                  │    E2E Workflows       │  (Playwright: 5 core flows)
                  ├────────────────────────┤
                  │    Frontend Pages      │  (Vitest + RTL: 50 tests)
                  ├────────────────────────┤
                  │   API & DB Integration │  (pytest + httpx: 25 tests)
                  ├────────────────────────┤
                  │   Backend Unit Tests   │  (pytest: 104 tests)
                  ├────────────────────────┤
                  │ Financial Invariants & │  (Hypothesis: 6 properties)
                  │ Property-Based Tests   │
                  └────────────────────────┘
```

- **Bottom Tier (Financial & Property Unit Tests)**: Executes in pure Python / NumPy / SciPy without database or HTTP overhead. Validates edge cases like zero volatility, single-bar series, and constant prices.
- **Middle Tier (Service, Repositories, Database & API Contracts)**: Validates transactional boundaries, unique constraint deduplication, and schema validation.
- **Top Tier (Frontend UI & Browser E2E)**: Tests user interactions, TanStack Query cache management, Zustand UI preferences, and Playwright workflow runs with mocked network responses.

---

## 3. Test Directory Architecture

### Backend (`backend/tests/`)
```text
backend/tests/
├── conftest.py                            # Central fixtures, test DB session, async test client
├── fixtures/                              # Deterministic synthetic test data
│   ├── market_data.py                     # Synthetic equity/crypto/invalid/constant OHLCV
│   ├── instruments.py                     # Instrument model fixtures
│   ├── portfolios.py                      # Portfolio and holdings fixtures
│   ├── strategies.py                      # Strategy config fixtures
│   └── backtests.py                       # Backtest payload fixtures
├── unit/                                  # Unit and financial engine tests
│   ├── test_property_based.py             # Hypothesis invariant verification
│   ├── test_mock_provider_abstraction.py  # Mock market data provider & failure modes
│   ├── test_api_contracts.py              # Schema contracts, error envelopes, serialization
│   ├── test_market_data_validation.py     # OHLCV validator & quality control
│   ├── test_returns.py                    # Simple, log, cumulative, annualized returns
│   ├── test_volatility.py                 # Daily, annualized, rolling, upside, downside vol
│   ├── test_correlation.py                # Pearson correlation, symmetry, rolling windows
│   ├── test_portfolio_calculator.py       # Portfolio value, weights, contribution
│   ├── test_moving_average_strategy.py    # SMA/EMA crossover signals & look-ahead check
│   ├── test_backtesting_engine.py         # Next-open fills, cash accounting, trade lifecycle
│   ├── test_drawdown_engine.py            # Running peaks, underwater series, max drawdown
│   ├── test_performance_metrics.py        # Sharpe, Sortino, Calmar, win rate, profit factor
│   └── test_export_engine.py              # CSV, JSON, and PDF report generators
└── integration/                           # Database & service integration tests
    ├── test_database_integrity.py         # Unique constraints, transactions, idempotency
    ├── test_health.py                     # System health & connectivity
    └── test_market_data_pipeline.py       # Ingestion & storage workflows
```

### Frontend (`frontend/src/` & `frontend/e2e/`)
```text
frontend/
├── src/
│   ├── components/__tests__/              # Reusable UI component unit tests
│   │   ├── MetricCard.test.tsx
│   │   ├── ContextBar.test.tsx
│   │   └── ResearchCommandPalette.test.tsx
│   ├── hooks/__tests__/                   # Custom state & research context hook tests
│   │   └── useResearchContext.test.tsx
│   └── pages/__tests__/                   # Full research workflow page tests
│       └── ResearchWorkflows.test.tsx
├── e2e/                                   # Playwright browser end-to-end tests
│   └── research-workflows.spec.ts         # 5 complete user journeys with mocked routes
├── playwright.config.ts                   # Playwright configuration
└── vitest.config.ts                       # Vitest and coverage thresholds
```

---

## 4. Coverage Targets & Quality Gates

| Layer | Target Coverage | Current Status |
| :--- | :--- | :--- |
| **Critical Financial Engines** (Returns, Volatility, Portfolio, Backtest) | $\ge 90\%$ | **94% - 100%** |
| **Backend Service Layer** | $\ge 85\%$ | **88%** |
| **Database Repositories & Integrity** | $\ge 80\%$ | **85%** |
| **API Layer & Contracts** | $\ge 80\%$ | **82%** |
| **Frontend Critical Components & Pages** | $\ge 80\%$ | **86%** |
| **Total Project Baseline** | $\ge 80\%$ | **84% (Backend) / 88% (Frontend)** |

### Quality Gate Pass Criteria
A pull request or build is rejected if:
1. Any financial invariant or calculation unit test fails.
2. Any look-ahead bias or execution timing assertion fails.
3. Database constraint tests or transaction rollback tests fail.
4. TypeScript compilation or linting emits errors.
5. Code coverage falls below the defined 80% baseline.
