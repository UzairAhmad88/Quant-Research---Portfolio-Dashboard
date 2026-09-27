# Module Implementation Checklist

## 01 Market Data Workspace, Visualization & Quality Layer (Step 06..08)
- [x] Provider interface
- [x] Historical download
- [x] Symbol search & validation
- [x] OHLCV normalization & validation
- [x] Structural OHLC bounds & UTC normalization
- [x] Market Calendar session gap detection (Equity vs Crypto)
- [x] Pre-persistence duplicate detection
- [x] Anomaly detection (price jumps, volume spikes)
- [x] Data quality & coverage panel
- [x] Historical OHLCV table
- [x] Interactive Candlestick & Line Chart
- [x] Volume pane visualization
- [x] Crosshair & OHLC tooltip
- [x] Date range presets & custom range selection
- [x] Raw vs Adjusted price selection
- [x] Settings popover & Fullscreen research mode
- [x] Validation issues drawer UI
- [x] CSV Export


## 02 Return Calculator (Step 09)
- [x] Simple return ($R_t = P_t/P_{t-1} - 1$)
- [x] Log return ($r_t = \ln(P_t/P_{t-1})$)
- [x] Cumulative return ($C_t = \prod(1+R_i) - 1$)
- [x] Period return & CAGR Annualized return (252-day Equity vs 365-day Crypto)
- [x] Price source selection (Adjusted Close vs Raw Close)
- [x] Cumulative & Periodic Canvas Chart Views
- [x] Summary metrics (Positive/Negative counts, Best/Worst periods)
- [x] Return series table & CSV Export


## 03 Portfolio Calculator & Portfolio Analytics (Step 10)
- [x] Portfolio entity & PostgreSQL persistence (`core.portfolios`, `core.portfolio_holdings`)
- [x] Portfolio holdings management & Instrument foreign-key integrity
- [x] Duplicate holding rejection & non-negative cash enforcement ($C_{\text{uninvested}} \ge 0$)
- [x] Initial capital allocation ($V_{\text{initial}} = \text{Cash} + \sum V_i$)
- [x] Invested vs Total Portfolio weights calculation ($w_i = V_i / V_p$)
- [x] Position P&L ($) and P&L (%) calculation
- [x] Position performance contribution ($w_{\text{invested},i} \times \text{P\&L}_{\%,i}$)
- [x] Buy-and-hold frictionless equity curve computation
- [x] Interactive SVG Allocation Donut chart
- [x] Interactive Portfolio Equity Curve & Cumulative Return Canvas chart
- [x] Portfolio CRUD & Holdings REST API endpoints under `/api/v1/portfolios`
- [x] Portfolio creation & add-holding modal workflows
- [x] Data quality integration & coverage warning alerts

## 04 Correlation Analyzer & Correlation Matrix (Step 11)
- [x] Multi-instrument selection (2 to 20 instruments)
- [x] Return-based correlation engine (Simple & Log returns)
- [x] Price source selection (Adjusted Close vs Raw Close)
- [x] Aligned return series timestamp inner joins & pairwise complete handling
- [x] Minimum observation enforcement ($\ge 30$ observations)
- [x] Pearson correlation matrix ($N \times N$, diagonal = 1.0, symmetric)
- [x] Interactive correlation matrix heatmap with qualitative interpretation
- [x] Pairwise return scatter plot visualization ($X$ vs $Y$)
- [x] Rolling window correlation series (30D..252D observations)
- [x] Insufficient window handling (no synthetic zero-filling)
- [x] Data quality integration & coverage warning alerts
- [x] REST API endpoints (`/api/v1/correlation`, `/pair`, `/rolling`)
- [x] Correlation matrix CSV export

## 05 Volatility Analyzer & Risk Measurement (Step 12)
- [x] Return-derived calculation engine (Simple & Log returns)
- [x] Sample standard deviation ($ddof=1$)
- [x] Asset-aware annualization (252-day Equity/ETF/Index vs 365-day Crypto)
- [x] Daily & Annualized volatility metrics
- [x] Rolling volatility time series (10D..252D observation windows)
- [x] Window offset handling (first $N-1$ points return null)
- [x] Upside volatility ($\text{StdDev}(R_i \mid R_i > 0)$)
- [x] Downside volatility ($\text{StdDev}(R_i \mid R_i < 0)$)
- [x] Return distribution statistics (Mean, Median, Min, Max, StdDev, Pos/Neg counts)
- [x] Return distribution histogram with 0.0% reference line
- [x] Multi-instrument volatility comparison bar chart & detailed table
- [x] Minimum observation cutoff ($\ge 30$ observations)
- [x] Data quality integration & coverage warning alerts
- [x] REST API endpoint (`GET /api/v1/volatility`)

## 06 Moving Average Strategy Engine & Visualization Workstation (Step 13..14)
- [x] Vectorized Simple Moving Average (SMA) calculation
- [x] Exponential Moving Average (EMA) calculation ($\alpha = 2/(n+1)$)
- [x] Warm-up offset & pre-warmup lookback fetching ($3 \times slow\_window$)
- [x] Fast MA vs Slow MA crossover detector (Bullish & Bearish)
- [x] Research signal generator (`BUY`, `SELL`, `HOLD`)
- [x] Current strategy state vs discrete signal event tracking
- [x] Look-ahead bias prevention & automated validation
- [x] Parameter validation ($fast\_window < slow\_window$)
- [x] Insufficient data handling ($n < slow\_window$)
- [x] Data quality integration & coverage warning alerts
- [x] REST API endpoint (`GET /api/v1/strategies/moving-average`)
- [x] Frontend chart adapter (`strategyChartAdapter.ts`) with Vitest test suite
- [x] Research workstation header with Research Signal State badge (`BUY`, `SELL`, `HOLD`)
- [x] Strategy configuration panel with Candlestick & Line price toggles
- [x] Interactive Price + Fast MA + Slow MA overlay chart with Fullscreen mode
- [x] Visual crossover markers (`▲` BUY, `▼` SELL) & crosshair tooltips
- [x] Crossover signal history log table with `BUY`/`SELL`/`ALL` filters & sorting
- [x] Methodology panel & Data provenance quality panel
- [x] Market Data context quick navigation link

## 07 Signal Management & Strategy Signal Layer (Step 15)
- [x] Standardized Signal Domain (`SignalEvent`, `StrategyConfiguration`)
- [x] Schema `strategy` with `strategy_configurations` and `signal_events` PostgreSQL tables
- [x] SHA256 Strategy Configuration hashing for parameter uniqueness
- [x] Idempotent signal persistence via `SignalRepository` & `SignalService`
- [x] Bulk signal creation with duplicate event prevention
- [x] Standardized `SignalType` (`BUY`, `SELL`) & `SignalState` (`BULLISH`, `BEARISH`, `NEUTRAL`)
- [x] Standardized `SignalSource` (`STRATEGY_ENGINE`, `MANUAL`, `EXTERNAL`, `MODEL`)
- [x] Signal REST API endpoints (`GET /api/v1/signals`, `GET /api/v1/signals/{id}`)
- [x] Frontend `useSignals` & `useSignalDetail` TanStack Query hooks
- [x] Frontend `SignalDetailModal` component for structured signal inspection & auditability
- [x] "Focus on Chart" navigation integration from Signal Detail modal
- [x] Comprehensive Pytest test suite (`test_signals.py`) covering domain, repository, idempotency, recomputation, and API endpoints
- [x] Frontend Vitest unit test suite (`signalAdapter.test.ts`)

## 08 Backtesting Architecture & Historical Simulation Framework (Step 16)
- [x] Pure historical simulation engine (`run_backtest_simulation`)
- [x] Decoupled Execution Model (`NextOpenExecutionModel`) eliminating same-bar look-ahead bias
- [x] Decoupled Position Sizing Model (`FullCapitalPositionSizing`) supporting cost-aware fractional units
- [x] Decoupled Cost Model (`FixedCostModel`) for explicit commission & slippage accounting
- [x] Position State Machine (`FLAT` $\leftrightarrow$ `LONG`) with redundant signal filtering
- [x] End-of-backtest forced liquidation (`FORCED_END`) for clean portfolio closing
- [x] Database schema `backtesting` with `backtests`, `trade_events`, and `portfolio_states` tables
- [x] Alembic database migration (`005_add_backtesting_tables.py`)
- [x] Repository layer (`BacktestRepository`) and Service layer (`BacktestService`)
- [x] REST API endpoints (`POST /api/v1/backtests`, `GET /api/v1/backtests`, `GET /api/v1/backtests/{id}`, `GET /api/v1/backtests/{id}/trades`, `GET /api/v1/backtests/{id}/states`)
- [x] Frontend TanStack Query hooks (`useRunBacktest`, `useBacktests`, `useBacktestDetail`, `useBacktestTrades`, `useBacktestPortfolioStates`)
- [x] Workstation components (`BacktestConfigPanel`, `BacktestSummaryCard`, `TradeEventsTable`, `PortfolioStateTable`, `PortfolioValueChart`)
- [x] Upgraded `/backtesting` page
- [x] Backend Pytest suite (`test_backtesting.py`) verifying look-ahead protection, redundant signal filtering, determinism, and API integration
- [x] Frontend Vitest suite (`backtestAdapter.test.ts`)

## 09 Trade Simulation, Execution Accounting & Position Lifecycle (Step 17)
- [x] Explicit domain abstractions (`PositionState`, `ExecutionScheduler`, `ExecutionService`, `TradeLifecycleService`)
- [x] Separation of concerns: Signal $\ne$ Execution $\ne$ Trade $\ne$ Position $\ne$ Portfolio
- [x] Execution Price Calculator with percentage slippage adjustment ($P_{\text{exec}} = P_{\text{mkt}} \times (1 \pm s)$)
- [x] Cost-aware quantity calculation ensuring total transaction costs never exceed available cash
- [x] Cash conservation invariants ($\text{Cash} \ge 0$, $\text{Position} \ge 0$)
- [x] Round-trip completed trade accounting (`gross_pnl`, `net_pnl`, `total_cost`, `trade_return`, `duration_days`)
- [x] Position lifecycle tracking (`FLAT` vs `OPEN`, `unrealized_pnl`)
- [x] Execution rejection logging (`NO_OPEN_POSITION`, `ALREADY_LONG`, `INSUFFICIENT_CASH`)
- [x] Alembic database migration (`006_add_completed_trades_and_unrealized_pnl.py`) creating `backtesting.completed_trades` table and adding `unrealized_pnl` to `backtesting.portfolio_states`
- [x] REST API endpoint (`GET /api/v1/backtests/{backtest_id}/completed-trades`)
- [x] Frontend TanStack Query hook (`useBacktestCompletedTrades`)
- [x] Institutional `CompletedTradesTable` component with round-trip trade metrics and row selection
- [x] Institutional `TradeDetailModal` component for breakdown of entry/exit executions, costs, and P&L
- [x] Enhanced `BacktestSummaryCard` displaying Open Position status and Unrealized P&L
- [x] Pytest suite (`tests/test_backtesting.py`) verifying entry/exit accounting, costs, redundant signal rejections, forced liquidation, and determinism

## 10 Performance Metrics & Quantitative Evaluation Engine (Step 18)
- [x] Pure calculation layer (`PerformanceEngine`) decoupled from trade simulator
- [x] Return Metrics: Total return, Cumulative return series, Annualized return (CAGR based on calendar time span)
- [x] Risk Metrics: Volatility ($\text{ddof}=1$), Annualized volatility ($\times \sqrt{252}$), Sharpe ratio ($R_f=0$), Sortino ratio ($\text{MAR}=0$)
- [x] Drawdown Metrics: Running peak series, Drawdown series, Maximum drawdown, Max drawdown duration (days), Calmar ratio
- [x] Trade Metrics: Trade count, Win rate, Average win, Average loss, Profit factor, Average trade return, Best trade, Worst trade
- [x] Exposure & Turnover: Position exposure fraction, Portfolio turnover ratio, Total commission, Total slippage cost, Total transaction costs
- [x] Strict Null & Edge Case Handling: Undefined metrics (e.g. no losing trades, zero volatility, zero drawdown, zero trades) cleanly return `null` instead of fake zero or infinity
- [x] REST API endpoints (`GET /api/v1/backtests/{backtest_id}/performance`, `GET /api/v1/backtests/{backtest_id}/equity`)
- [x] Frontend TanStack Query hooks (`useBacktestPerformance`, `useBacktestEquity`)
- [x] Institutional `PerformanceMetricsCard` component with tooltips and 5-column metric group layout
- [x] Institutional `PerformanceMethodologyModal` component explaining mathematical formulas
- [x] Backend Pytest suite (`tests/test_performance_engine.py`) verifying return, risk, drawdown, trade metrics, undefined edge cases, and API integration
## 11 Equity & Drawdown Analytics Layer (Step 19)
- [x] Dedicated `DrawdownEngine` backend module (`app/analytics/backtesting/drawdown_engine.py`)
- [x] Authoritative source reuse: Consumes backtest `portfolio_states` without duplicating trade accounting
- [x] Vectorized drawdown series calculation: Running peak series, drawdown amount, drawdown percentage ($\le 0$)
- [x] Discrete drawdown period detection: Start, Peak, Trough, Recovery dates, Depth, Duration, Recovery duration
- [x] Active/unrecovered drawdown handling: Unrecovered periods cleanly logged with `status="ACTIVE"` and `recovery_timestamp=null`
- [x] Zero-drawdown & flat equity edge cases: Returns empty period list and `0%` drawdown depth without false triggers
- [x] REST API endpoints (`GET /api/v1/backtests/{backtest_id}/drawdown`, `GET /api/v1/backtests/{backtest_id}/drawdown-periods`)
- [x] React Query integration (`useBacktestDrawdownSeries`, `useBacktestDrawdownPeriods`)
- [x] Institutional `UnderwaterChart` component rendering drawdown percentage depth with red fill
- [x] Institutional `DrawdownPeriodsTable` component with sortable columns, status badges (`Recovered` / `Active`), and period detail inspection drawer
- [x] Synchronized `EquityAnalyticsWorkspace` component linking Equity curve, Running peak line, Initial capital baseline, Trade markers, Underwater chart, and Drawdown period selection
- [x] `CurrentDrawdownStatus` component providing real-time `AT_PEAK` vs `IN_DRAWDOWN` status, running peak, peak date, and active duration
- [x] Backend Pytest suite (`tests/test_drawdown_engine.py`) verifying series calculations, active/recovered period detection, and flat equity cases (98 passed)
## 12 Backtest Reports & Research Summary (Step 20)
- [x] Dedicated `ReportService` backend module (`app/analytics/backtesting/report_service.py`) aggregating authoritative outputs from backtest, performance, drawdown, and signal repositories without formula duplication
- [x] Deterministic sha256 experiment fingerprint hash calculation over material configuration parameters
- [x] ReportLab PDF Generator (`app/analytics/backtesting/report_pdf_generator.py`) producing structured 4-page institutional quantitative research report PDF artifacts
- [x] REST API endpoints (`GET /api/v1/backtests/{backtest_id}/report` and `GET /api/v1/backtests/{backtest_id}/report/export` supporting JSON, CSV, and PDF formats)
- [x] React Query integration (`useBacktestReport`) and export helper (`getBacktestReportExportUrl`)
- [x] Institutional `ReportHeader` component rendering metadata, version 1.0 badge, status badges, and PDF/CSV/JSON export buttons
- [x] Sticky `ReportNavigation` component enabling fast section scrolling across all 14 report sections
- [x] `ReportWarningBanner` component displaying data-quality and simulation warnings for `COMPLETED_WITH_WARNINGS` status
- [x] Institutional `BacktestReportView` component displaying structured 14-section research document (Executive Summary, Config, Strategy, Market Data, Execution Assumptions, Performance, Equity, Drawdown, Trades, Accounting, Data Quality, Methodology, Limitations, Reproducibility with Copyable SHA256 Fingerprint)
- [x] View Mode Switcher in `BacktestingPage.tsx` toggling between Interactive Workspace and Research Report View
- [x] Backend Pytest suite (`tests/test_report_service.py`) verifying DTO aggregation, deterministic fingerprinting, ReportLab PDF rendering, and API export endpoints (102 passed)
- [x] Frontend Vitest suite (`npm test`) and Vite production build (`npm run build`) passing cleanly (17 passed)

## 13 Cross-Module State & Research Context (Step 22)
- [x] Typed `ResearchContext` interface in `src/lib/researchContext.ts`
- [x] Centralized URL parser (`parseResearchContext`) and serializer (`serializeResearchContext`)
- [x] Centralized URL builder (`buildResearchUrl`) and context validation (`validateResearchContext`)
- [x] Route/module-scoped state ownership model (URL = shareable context, TanStack Query = server state, Zustand = UI state, DB = domain entities)
- [x] Custom hook `useResearchContext()` providing search params synchronization and update triggers
- [x] `ResearchContextBar` component with interactive ticker selection, range presets (`1M`..`MAX`), price source toggles, and reset controls
- [x] `Breadcrumbs` component with active context tracking
- [x] Context-aware `CommandPalette` action labels carrying active symbol context
- [x] Seamless context preservation across Market Data, Returns, Portfolio, Correlation, Volatility, Strategy, and Backtesting modules
- [x] Direct URL loading, browser back/forward history navigation, and refresh safety
- [x] Explicit date precedence (`start`/`end`) over range presets
- [x] Multi-instrument symbol list parsing (`symbols=AAPL,MSFT,SPY`) for Correlation module
- [x] Strategy-to-backtest parameter handoff initialized without auto-execution
- [x] Comprehensive Vitest test suite (`researchContext.test.ts`, `ResearchContextBar.test.tsx`) & Vite production build passing cleanly (28 tests passed)

## 14 Real-Time & Latest Market Data Integration (Step 23)
- [x] Provider capability abstraction (`ProviderCapabilities` in `app/providers/base.py`)
- [x] Yahoo Finance provider latest methods (`get_latest_ohlcv`, `get_latest_ohlcv_batch`) with explicit delayed EOD flags
- [x] Calendar-aware freshness policy (`FreshnessPolicy` in `app/analytics/market_data/freshness_policy.py`) supporting `CURRENT`, `RECENT`, `STALE`, `UNKNOWN`, `UNAVAILABLE`
- [x] Weekend and holiday session awareness eliminating false stale warnings for equities
- [x] Database-first caching mechanism returning valid stored observations without unnecessary provider calls
- [x] Idempotent observation persistence (`insert_bar_idempotent` in `MarketDataRepository`) preventing duplicate OHLCV records
- [x] Controlled force refresh (`force_refresh=True`) bypassing cache with rate-limit and provider error fallback
- [x] Price change ($) and change (%) calculation reusing `ReturnCalculator.calculate_period_return`
- [x] REST API endpoints (`GET /api/v1/market-data/latest`, `GET /api/v1/market-data/latest/batch`, `GET /api/v1/market-data/providers/capabilities`)
- [x] Frontend `useLatestMarketData`, `useLatestMarketDataBatch`, and `useRefreshLatestMarketData` TanStack Query hooks
- [x] Institutional `LatestMarketDataPanel.tsx` component in Market Data workspace
- [x] Extended Unified Dashboard snapshot (`MarketDataSnapshotPanel.tsx`) with latest price column and freshness badge
- [x] Extended Settings page with Provider capabilities and disabled auto-refresh policy
- [x] Backend Pytest suite (`test_latest_market_data.py`) with 109/109 tests passing
- [x] Frontend Vitest suite (`LatestMarketDataPanel.test.tsx`) with 33/33 tests passing and clean Vite production build

## 15 Export, Research Reports & Data Delivery (Step 24)
- [x] Unified backend export architecture (`app/export/`): `ExportFormat` (CSV, JSON, PDF), `ExportMetadata`, `Exporter` base class, and filename sanitizer
- [x] RFC 4180-compliant `CSVExporter` supporting UTC ISO timestamps, precision preservation, no currency symbols in numeric columns, and proper null-as-empty-field handling
- [x] `JSONExporter` with custom JSON encoder handling `Decimal`, `date`, `datetime` (UTC ISO-8601), `UUID`, and `Enum` serialization with standardized metadata envelope
- [x] ReportLab `PDFExporter` generating institutional quantitative research reports with executive summaries, metrics tables, trade logs, and methodology
- [x] Reusable `ExportService` managing format validation, HTTP streaming headers, and Content-Disposition attachment filenames
- [x] Export API endpoints across all domain modules:
  - `GET /api/v1/market-data/export` (Market Data & Quality QC metrics)
  - `GET /api/v1/returns/export` (Simple/Log returns & cumulative trajectories)
  - `GET /api/v1/portfolios/{id}/export` (Holdings, Summary, Performance)
  - `GET /api/v1/correlation/export` (Matrix, Pairwise, Rolling)
  - `GET /api/v1/volatility/export` (Rolling & Summary volatility)
  - `GET /api/v1/strategies/moving-average/export` (MA series & crossovers)
  - `GET /api/v1/signals/export` (Signal events & execution states)
  - `GET /api/v1/backtests/{id}/export` (Research Report PDF/JSON/CSV, Trades, Equity, Drawdown, States)
- [x] Frontend `exportService.ts` providing typed URL builders and browser blob download trigger with `Content-Disposition` header filename resolution
- [x] Reusable institutional `ExportMenu` component with format badges (CSV, JSON, PDF), loading state spinners, and error alerts
- [x] Integrated `ExportMenu` into Market Data, Returns, Volatility, Portfolio, Strategies, Backtesting workspace, and Backtest Report header
- [x] Strict non-duplication rule: Exporters consume existing calculation engines (Return Engine, Volatility Analyzer, Portfolio Calculator, Backtest Engine); no duplicate calculations created
- [x] Backend Pytest suite (`test_export_service.py` and API tests) with 115/115 tests passing
- [x] Frontend Vitest suite (`ExportMenu.test.tsx`, `exportService.test.ts`) with 45/45 tests passing and clean Vite production build
