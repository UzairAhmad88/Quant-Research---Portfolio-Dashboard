# Quantitative Calculations Reference

## 1. Return Calculations (Step 09)

### Simple Return
For price observation $P_t$ at time $t$ relative to $P_{t-1}$:
$$R_t = \frac{P_t}{P_{t-1}} - 1$$
- First observation $t=0$: $R_0 = \text{null}$.

### Logarithmic Return
$$r_t = \ln\left(\frac{P_t}{P_{t-1}}\right)$$
- Computed only when $P_t > 0$ and $P_{t-1} > 0$.
- First observation $t=0$: $r_0 = \text{null}$.

### Cumulative Simple Return
Compounded performance accumulation relative to baseline price $P_0$:
$$C_t = \prod_{i=1}^t (1 + R_i) - 1 = \frac{P_t}{P_0} - 1$$
- Baseline observation $t=0$: $C_0 = 0.0$ ($0\%$).

### Period Return
Total period return from first valid price $P_{\text{start}}$ to final valid price $P_{\text{end}}$:
$$R_{\text{period}} = \frac{P_{\text{end}}}{P_{\text{start}}} - 1$$

### Annualized CAGR Return
Compounded annual equivalent return based on elapsed periods $N_{\text{bars}}$:
$$R_{\text{annualized}} = (1 + R_{\text{period}})^{\frac{N_{\text{annual}}}{N_{\text{bars}} - 1}} - 1$$

### Annualization Conventions
- **Equities, ETFs, Indices**: $N_{\text{annual}} = 252$ trading days.
- **Cryptocurrencies**: $N_{\text{annual}} = 365$ calendar days (24/7 continuous trading).


## 2. Portfolio Analytics (Step 10)

### Position Initial & Current Value
For position holding $i$ with quantity $Q_i$ and price $P_{i,t}$:
$$V_{i,t} = Q_i \times P_{i,t}$$

### Portfolio Market Value & Cash
For initial capital $C_0$ and active position holdings $1 \dots k$:
$$\text{Cash} = \max\left(0, C_0 - \sum_{i=1}^k (Q_i \times P_{i,\text{entry}})\right)$$
$$V_{p,t} = \text{Cash} + \sum_{i=1}^k (Q_i \times P_{i,t})$$

### Position Weights
- **Invested Capital Weight**:
  $$w_{\text{invested},i} = \frac{V_{i,\text{entry}}}{\sum_{j=1}^k V_{j,\text{entry}}}$$
- **Total Portfolio Weight (including Cash)**:
  $$w_{\text{total},i} = \frac{V_{i,t}}{V_{p,t}}, \quad w_{\text{cash}} = \frac{\text{Cash}}{V_{p,t}}$$

### Position P&L and Return
$$\text{P\&L}_{\$,i} = V_{i,t} - V_{i,\text{entry}}$$
$$\text{P\&L}_{\%,i} = \frac{P_{i,t}}{P_{i,\text{entry}}} - 1$$

### Position Performance Contribution
Period contribution of holding $i$ under buy-and-hold methodology:
$$\text{Contribution}_i = w_{\text{invested},i} \times \text{P\&L}_{\%,i}$$

### Portfolio Total Return
Cumulative return of portfolio relative to total initial capital $C_0$:
$$R_p(t) = \frac{V_{p,t}}{C_0} - 1$$

## 3. Correlation Analyzer (Step 11)

### Return Series Input & Timestamp Alignment
For returns $R_A(t)$ and $R_B(t)$ of instruments $A$ and $B$, correlation is calculated exclusively on aligned return observations where both series have valid data:
$$T_{\text{aligned}} = \{t \mid R_A(t) \ne \text{null} \land R_B(t) \ne \text{null}\}$$

Minimum observation requirement: $|T_{\text{aligned}}| \ge 30$.

### Pearson Correlation Coefficient
$$\rho(A,B) = \frac{\text{Cov}(R_A, R_B)}{\sigma_A \sigma_B} = \frac{\sum_{t \in T_{\text{aligned}}} (R_A(t) - \bar{R}_A)(R_B(t) - \bar{R}_B)}{\sqrt{\sum_{t \in T_{\text{aligned}}} (R_A(t) - \bar{R}_A)^2} \sqrt{\sum_{t \in T_{\text{aligned}}} (R_B(t) - \bar{R}_B)^2}}$$

Properties:
- Bounds: $-1.0 \le \rho(A,B) \le 1.0$
- Self-Correlation: $\rho(A,A) = 1.0$
- Matrix Symmetry: $\rho(A,B) = \rho(B,A)$

### Rolling Window Correlation
For moving observation window size $N$ at aligned step $k$:
$$\rho_k(A,B) = \text{Correlation}(R_{A, k-N+1:k}, R_{B, k-N+1:k})$$
- Observations $k < N$: $\rho_k = \text{null}$ (no artificial zero-filling).

---

## 4. Volatility Analyzer & Risk Measurement (Step 12)

### Return-Derived Input
Volatility is calculated strictly from validated return series ($r_1, r_2, \dots, r_n$), NOT raw price levels:
$$r_t = \text{ReturnCalculator}(P_t, P_{t-1})$$

### Historical Sample Standard Deviation
Using sample standard deviation ($ddof=1$):
$$\sigma_{\text{daily}} = \sqrt{\frac{\sum_{i=1}^n (r_i - \bar{r})^2}{n - 1}}$$

### Asset-Aware Annualized Volatility
Reuses asset-class-aware annualization conventions:
$$\sigma_{\text{annual}} = \sigma_{\text{daily}} \times \sqrt{N_{\text{annual}}}$$
- **Equities, ETFs, Indices**: $N_{\text{annual}} = 252$ trading days.
- **Cryptocurrencies**: $N_{\text{annual}} = 365$ calendar days.

### Rolling Volatility
For moving observation window size $N$ at observation $t$:
$$\sigma_{t, N} = \text{StdDev}(r_{t-N+1}, \dots, r_t, ddof=1)$$
- Observations $t < N - 1$: $\sigma_{t, N} = \text{null}$ (no zero-filling).
- Annualized rolling volatility: $\sigma_{\text{rolling, annual}} = \sigma_{t, N} \times \sqrt{N_{\text{annual}}}$.

### Upside & Downside Volatility
- **Upside Volatility ($\sigma_+$)**: Sample standard deviation of strictly positive returns ($r_i > 0$):
  $$\sigma_+ = \text{StdDev}(\{r_i \mid r_i > 0\}, ddof=1)$$
- **Downside Volatility ($\sigma_-$)**: Sample standard deviation of strictly negative returns ($r_i < 0$):
  $$\sigma_- = \text{StdDev}(\{r_i \mid r_i < 0\}, ddof=1)$$

### Return Distribution Summary & Histogram Bins
Descriptive statistics ($\bar{r}, r_{\text{med}}, r_{\min}, r_{\max}, \sigma$) and histogram bin counts:
$$\text{Bin}_k = [b_k, b_{k+1}), \quad f_k = \sum_{i=1}^n \mathbb{I}(r_i \in \text{Bin}_k)$$

### Minimum Observations Cutoff
Minimum 30 valid return observations required ($n \ge 30$). If $n < 30$, `is_sufficient = False` is returned.

## 5. Moving Average Strategy Engine (Step 13)

### Simple Moving Average (SMA)
For observation price $P_t$ over rolling window size $n$:
$$\text{SMA}_{t, n} = \frac{1}{n} \sum_{i=0}^{n-1} P_{t-i}$$
- Observations $t < n - 1$: $\text{SMA}_{t, n} = \text{null}$ (warm-up period).

### Exponential Moving Average (EMA)
Weighted moving average prioritizing recent observations with smoothing factor $\alpha = \frac{2}{n + 1}$:
$$\text{EMA}_{t, n} = \alpha P_t + (1 - \alpha) \text{EMA}_{t-1, n}$$
- Observations $t < n - 1$: $\text{EMA}_{t, n} = \text{null}$.

### Crossover Signal Rules & Look-Ahead Bias Prevention
Signal evaluation at time $t$ uses exclusively information available at $t-1$ and $t$:
- **Bullish Crossover (`BUY`)**:
  $$\text{Fast}_{t-1} \le \text{Slow}_{t-1} \quad \land \quad \text{Fast}_t > \text{Slow}_t \implies \text{Signal}_t = \text{BUY}$$
- **Bearish Crossover (`SELL`)**:
  $$\text{Fast}_{t-1} \ge \text{Slow}_{t-1} \quad \land \quad \text{Fast}_t < \text{Slow}_t \implies \text{Signal}_t = \text{SELL}$$
- **No Crossover (`HOLD`)**:
  $$\text{Otherwise} \implies \text{Signal}_t = \text{HOLD}$$

### Warm-Up Data Lookback (Step 14)
When a user specifies a date range starting at $T_{\text{start}}$, the backend fetches prior historical observations starting at $T_{\text{fetch}} = T_{\text{start}} - 3 \times n_{\text{slow}}$ to pre-warm moving averages. Strategy outputs and crossover events are then filtered to $t \ge T_{\text{start}}$, ensuring pre-warmed moving averages from Day 1 of the requested display range.

---

## 6. Future Analytics Modules (Scaffolded)

### Maximum Drawdown
$$\text{Drawdown}_t = \frac{V_{p,t} - \max_{s \le t} V_{p,s}}{\max_{s \le t} V_{p,s}}$$


## 7. Signal Management & Strategy Signal Layer (Step 15)

### Strategy Configuration Identity & Hash
Each strategy configuration parameter set is normalized into a deterministic SHA256 configuration hash:
$$H(\text{config}) = \text{SHA256}\left(\text{STRATEGY\_TYPE} \parallel \text{instrument\_id} \parallel \text{JSON}(\text{params})\right)$$
- Guarantees parameter set uniqueness.
- Distinguishes SMA vs EMA and different window sizes ($N_{\text{fast}}, N_{\text{slow}}$).

### Signal Event & Research State Normalization
Standardizes discrete strategy triggers into domain signal events:
- **BUY Event**: Triggered when $FastMA_{t-1} \le SlowMA_{t-1}$ and $FastMA_t > SlowMA_t$. Implies `BULLISH` research state.
- **SELL Event**: Triggered when $FastMA_{t-1} \ge SlowMA_{t-1}$ and $FastMA_t < SlowMA_t$. Implies `BEARISH` research state.
- **HOLD**: Absence of a crossover event. Not persisted as individual rows to avoid database bloat.

### Idempotency & Look-Ahead Protection
- Unique database constraint: $(strategy\_configuration\_id, timestamp, signal\_type)$.
- Signals are evaluated at time $t$ strictly using observations available up to $(t-1)$ and $t$.
- Signal events represent historical quantitative strategy outputs, decoupled from portfolio trade execution and backtesting performance metrics.

---

## 8. Backtesting Architecture & Historical Simulation Framework (Step 16)

### Chronological Simulation Loop
Chronological iteration over validated price observations $t = 1 \dots N$:
1. Process pending execution scheduled from prior observation $t-1$.
2. Execute trade at $\text{Open}_t$ using $t+1$ `NEXT_OPEN` execution model.
3. Update Cash balance and Position Quantity.
4. Value Portfolio at observation $t$ close: $V_{p,t} = \text{Cash}_t + Q_t \times \text{Close}_t$.
5. Inspect strategy signal at $t$.
6. If actionable under position state, schedule execution for observation $t+1$.

### Look-Ahead-Free Execution Timing (`NEXT_OPEN`)
For signal generated at timestamp $t_{\text{sig}}$:
$$t_{\text{exec}} = t_{\text{sig}} + 1 \quad (\text{Next available market observation})$$
$$P_{\text{exec}} = \text{Open}_{t_{\text{exec}}}$$
Eliminates same-bar look-ahead bias by preventing execution at $\text{Close}_{t_{\text{sig}}}$ or $\text{Open}_{t_{\text{sig}}}$.

### Cost-Aware Position Sizing (`FULL_CAPITAL`)
Calculates trade quantity $Q$ using available cash while explicitly accounting for transaction costs:
$$\text{Cost Multiplier} = 1.0 + \max(0, c) + \max(0, s)$$
$$P_{\text{effective}} = P_{\text{exec}} \times \text{Cost Multiplier}$$
$$Q_{\text{BUY}} = \frac{\text{Cash}}{P_{\text{effective}}}$$
- Supports fractional units to avoid rounding distortion in quantitative research simulations.
- Ensures $\text{Notional} + \text{Commission} + \text{Slippage} \le \text{Cash}$.

### Transaction Cost Equations
For trade notional value $N = Q \times P_{\text{exec}}$, with commission rate $c$ and slippage rate $s$:
$$\text{Commission Cost} = N \times c$$
$$\text{Slippage Cost} = N \times s$$
- **BUY Execution**: $\text{Cash}_{\text{after}} = \text{Cash}_{\text{before}} - N - \text{Commission} - \text{Slippage}$
- **SELL Execution**: $\text{Cash}_{\text{after}} = \text{Cash}_{\text{before}} + N - \text{Commission} - \text{Slippage}$

### Position State Machine & Redundant Signal Filtering
- Initial state: $\text{FLAT}$ ($Q = 0$).
- $\text{BUY}$ signal in $\text{FLAT}$ state $\implies$ transition to $\text{LONG}$ ($Q > 0$).
- $\text{BUY}$ signal in $\text{LONG}$ state $\implies$ ignored (redundant signal under long-only rule).
- $\text{SELL}$ signal in $\text{LONG}$ state $\implies$ transition to $\text{FLAT}$ ($Q = 0$).
- $\text{SELL}$ signal in $\text{FLAT}$ state $\implies$ ignored (shorting disabled in initial long-only mode).

### End-of-Backtest Liquidation (`FORCED_END`)
### End-of-Backtest Liquidation (`FORCED_END`)
If position is $\text{LONG}$ at final observation $N$, position is liquidated at final close price $\text{Close}_N$ with execution reason `FORCED_END` to close portfolio state cleanly.

---

## 9. Trade Simulation, Execution Accounting & Position Lifecycle (Step 17)

### Market Price vs. Execution Price (Slippage Model)
Slippage directly adjusts the execution price $P_{\text{exec}}$ relative to raw market price $P_{\text{mkt}}$:
$$\text{BUY Effective Price: } P_{\text{exec}} = P_{\text{mkt}} \times (1 + s)$$
$$\text{SELL Effective Price: } P_{\text{exec}} = P_{\text{mkt}} \times (1 - s)$$
where $s$ is the configured slippage percentage rate.

### Transaction Notional Value & Commission
For quantity $Q$ executed at effective price $P_{\text{exec}}$:
$$\text{Notional Value: } N = Q \times P_{\text{exec}}$$
$$\text{Commission Cost: } C = N \times c$$
$$\text{Slippage Cost: } S = Q \times |P_{\text{exec}} - P_{\text{mkt}}|$$
where $c$ is the configured percentage commission rate.

### Cash Accounting Invariants
- **BUY Transaction**: Cash decreases by notional value plus commission:
  $$\text{Cash}_{\text{after}} = \text{Cash}_{\text{before}} - (N + C)$$
- **SELL Transaction**: Cash increases by notional value minus commission:
  $$\text{Cash}_{\text{after}} = \text{Cash}_{\text{before}} + (N - C)$$
- **Invariant**: $\text{Cash} \ge 0$ and $\text{Position Quantity} \ge 0$ at all observations.

### Portfolio State Valuation & Unrealized P&L
At valuation observation $t$ with market close price $P_{\text{close},t}$:
$$\text{Position Value}_t = Q_t \times P_{\text{close},t}$$
$$\text{Portfolio Value}_t = \text{Cash}_t + \text{Position Value}_t$$
$$\text{Unrealized P\&L}_t = (P_{\text{close},t} - P_{\text{entry}}) \times Q_t \quad (\text{when position is OPEN})$$

### Completed Round-Trip Trade Accounting
A completed trade matches an entry execution $t_{\text{entry}}$ with a subsequent exit execution $t_{\text{exit}}$:
$$\text{Gross P\&L} = (P_{\text{exit}} - P_{\text{entry}}) \times Q$$
$$\text{Total Transaction Costs} = C_{\text{entry}} + C_{\text{exit}} + S_{\text{entry}} + S_{\text{exit}}$$
$$\text{Net P\&L} = \text{Gross P\&L} - (C_{\text{entry}} + C_{\text{exit}})$$
$$\text{Trade Return} = \frac{\text{Net P\&L}}{\text{Notional}_{\text{entry}}}$$
$$\text{Trade Duration (Days)} = \frac{t_{\text{exit}} - t_{\text{entry}}}{86,400\text{ seconds}}$$

---

## 10. Performance Metrics & Quantitative Evaluation Engine (Step 18)

### Return Metrics
- **Total Return**:
  $$\text{Total Return} = \frac{V_{\text{final}}}{V_{\text{initial}}} - 1$$
- **Annualized Return (CAGR)**:
  $$\text{CAGR} = \left(\frac{V_{\text{final}}}{V_{\text{initial}}}\right)^{\frac{1}{T}} - 1 \quad \left(T = \frac{\text{elapsed\_days}}{365.25}\right)$$
- **Periodic Return Series**:
  $$R_t = \frac{V_t}{V_{t-1}} - 1 \quad \text{for } t = 1 \dots N$$

### Risk Metrics & Ratios
- **Annualized Volatility**:
  $$\sigma_{\text{ann}} = \sigma_{\text{daily}} \times \sqrt{A} \quad (A=252 \text{ for equities}, \text{sample std dev } \text{ddof}=1)$$
- **Sharpe Ratio** ($R_f=0$ default):
  $$\text{Sharpe} = \frac{\text{Mean}(R_t - R_{f,\text{period}})}{\sigma_{\text{daily}}} \times \sqrt{A}$$
- **Sortino Ratio** ($\text{MAR}=0$):
  $$\sigma_{\text{downside}} = \sqrt{\frac{1}{N} \sum_{t=1}^N \min(R_t - \text{MAR}, 0)^2}$$
  $$\text{Sortino} = \frac{\text{Mean}(R_t - \text{MAR})}{\sigma_{\text{downside}}} \times \sqrt{A}$$

### Drawdown & Recovery
- **Running Peak Series**:
  $$\text{Peak}_t = \max_{s \le t} V_s$$
- **Drawdown Series**:
  $$\text{Drawdown}_t = \frac{V_t - \text{Peak}_t}{\text{Peak}_t}$$
- **Maximum Drawdown**:
  $$\text{Max Drawdown} = \min_{t} \text{Drawdown}_t$$
- **Calmar Ratio**:
  $$\text{Calmar} = \frac{\text{CAGR}}{|\text{Max Drawdown}|}$$

### Trading Statistics & Exposure
- **Win Rate**:
  $$\text{Win Rate} = \frac{N_{\text{winning\_trades}}}{N_{\text{total\_completed\_trades}}}$$
- **Profit Factor**:
  $$\text{Profit Factor} = \frac{\sum \text{Gross Profits}}{\left| \sum \text{Gross Losses} \right|}$$
- **Exposure**:
  $$\text{Exposure} = \frac{\text{Count}(Q_t > 0)}{N}$$
- **Turnover**:
  $$\text{Turnover} = \frac{\sum |\text{Transaction Notional}|}{\text{Mean}(V_t)}$$

---

## 11. Equity & Drawdown Analytics Layer (Step 19)

### Running Equity Peak
For portfolio value sequence $V_1, V_2, \dots, V_t$:
$$\text{Running Peak}_t = \max(V_1, V_2, \dots, V_t)$$

### Drawdown Amount & Drawdown Percentage
$$\text{Drawdown Amount}_t = V_t - \text{Running Peak}_t \quad (\le 0)$$
$$\text{Drawdown \%}_t = \frac{V_t}{\text{Running Peak}_t} - 1 \quad (\le 0)$$

### Drawdown Period Lifecycle Detection
A discrete drawdown period starts at $t_{\text{start}}$ when $V_t < \text{Running Peak}_{t-1}$, reaches trough $t_{\text{trough}}$ at $\min(V_t)$, and completes at recovery $t_{\text{recovery}}$ when $V_t \ge \text{Peak}_{t_{\text{start}}}$.

- **Drawdown Duration**:
  $$\text{Duration} = \frac{t_{\text{trough/recovery}} - t_{\text{peak}}}{86,400 \text{ seconds}}$$
- **Recovery Duration**:
  $$\text{Recovery Duration} = \frac{t_{\text{recovery}} - t_{\text{trough}}}{86,400 \text{ seconds}}$$
- **Active (Unrecovered) Status**: If $V_{\text{final}} < \text{Peak}_{t_{\text{start}}}$, $t_{\text{recovery}} = \text{null}$ and $\text{Status} = \text{ACTIVE}$.

---

## 12. Backtest Reports & Research Summary (Step 20)

### Deterministic Configuration Fingerprint Hash
To ensure 100% experiment reproducibility across research sessions and exports, a SHA-256 hash is computed over a sorted JSON canonical string of all material experimental parameters:

$$\text{Fingerprint Hash} = \text{SHA256}\left(\text{JSON\_Canonical}(\{ \text{backtest\_id}, \text{instrument\_id}, \text{strategy\_config\_id}, \text{start\_date}, \text{end\_date}, \text{capital}, \text{execution\_timing}, \text{position\_sizing}, \text{commission}, \text{slippage}, \text{direction}, \dots \})\right)$$

### Presentation & Aggregation Rules
- **No Calculation Re-computation**: The report service aggregates authoritative outputs from `BacktestRepository`, `PerformanceEngine`, `DrawdownEngine`, and `SignalRepository`.
- **Undefined Metrics**: Any mathematically undefined metric (e.g. zero volatility Sharpe ratio) is explicitly rendered as `null` / `N/A`.
- **Export Formats**: Report DTO is formatted into structured JSON, tabular CSV, and pixel-perfect PDF research artifacts.

---

## 13. Unified Quant Research Dashboard Aggregation (Step 21)

### Orchestration & Service Boundaries
- **No Calculation Duplication**: The `DashboardService` acts strictly as an aggregation and orchestration layer. It consumes outputs directly from domain repositories (`InstrumentRepository`, `MarketDataRepository`, `PortfolioRepository`, `SignalRepository`, `BacktestRepository`, `IngestionRepository`) without recomputing financial models.
- **System Health Status Determination**:
  $$\text{Data Status} = \begin{cases} \text{"No Data"} & \text{if } N_{\text{instruments}} = 0 \lor N_{\text{observations}} = 0 \\ \text{"Good with Warnings"} & \text{if any } N_{\text{bars}} < 100 \lor \text{recent warnings} \\ \text{"Good"} & \text{otherwise} \end{cases}$$
- **N+1 Query Prevention**: Batch queries and summary projections are utilized to aggregate multi-asset instrument observations, recent signals, active portfolios, and historical backtests cleanly.








