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


