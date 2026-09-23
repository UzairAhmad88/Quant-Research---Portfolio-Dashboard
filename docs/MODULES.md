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

## 04 Correlation Analyzer
- [ ] Asset selection
- [ ] Correlation matrix
- [ ] Heatmap
- [ ] Pair analysis
- [ ] Rolling correlation

## 05 Volatility Analyzer
- [ ] Daily volatility
- [ ] Annualized volatility
- [ ] Rolling volatility
- [ ] Volatility chart

## 06 Moving-Average Strategy
- [ ] SMA
- [ ] EMA
- [ ] Crossover signals
- [ ] Signal history
- [ ] Strategy chart

## 07 Backtesting Engine
- [ ] Historical simulation
- [ ] Position management
- [ ] Execution model
- [ ] Commission
- [ ] Slippage
- [ ] Equity curve
- [ ] Drawdown
- [ ] Performance metrics
- [ ] Trade history
