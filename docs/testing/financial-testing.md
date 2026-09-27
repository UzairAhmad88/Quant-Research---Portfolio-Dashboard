# Financial Calculation & Invariant Testing

## 1. Mathematical Formulas & Conventions

The application implements rigorous quantitative finance standards. All financial formulas are tested against hand-calculated analytical benchmarks and edge cases.

### 1.1 Return Engine

- **Simple Return ($R_t$)**:
  $$R_t = \frac{P_t}{P_{t-1}} - 1$$
  *Requirement*: First observation in a discrete return series must always be `null` (`NaN`), never `0.0`.

- **Log Return ($r_t$)**:
  $$r_t = \ln\left(\frac{P_t}{P_{t-1}}\right) = \ln(P_t) - \ln(P_{t-1})$$
  *Numerical Relationship*: $R_t = e^{r_t} - 1$.

- **Cumulative Return**:
  $$R_{0, T} = \prod_{t=1}^T (1 + R_t) - 1$$

- **Annualized Return**:
  $$\text{CAGR} = (1 + R_{0, T})^{\frac{N_{\text{annual}}}{T}} - 1$$
  - Equity Convention: $N_{\text{annual}} = 252$ trading days.
  - Crypto Convention: $N_{\text{annual}} = 365$ calendar days.

---

### 1.2 Volatility Engine

- **Sample Volatility ($\sigma$)**:
  Sample standard deviation using degrees of freedom $N-1$ (`ddof = 1`):
  $$\sigma = \sqrt{\frac{1}{N - 1} \sum_{t=1}^N (R_t - \bar{R})^2}$$

- **Annualized Volatility**:
  $$\sigma_{\text{ann}} = \sigma \times \sqrt{N_{\text{annual}}}$$

- **Rolling Volatility**:
  A window of size $W$ produces `null` for the first $W-1$ observations and sample $\sigma$ for observation $W$ onward.

- **Upside & Downside Volatility**:
  - *Upside Volatility*: Standard deviation conditioned exclusively on positive returns ($R_t > 0$).
  - *Downside Volatility*: Standard deviation conditioned exclusively on negative returns ($R_t < 0$).
  *(Note: Downside volatility is distinct from Downside Deviation, which measures dispersion relative to a target return threshold)*.

---

### 1.3 Correlation Engine

- **Pearson Correlation ($\rho$)**:
  $$\rho_{X, Y} = \frac{\sum (X_t - \bar{X})(Y_t - \bar{Y})}{\sqrt{\sum (X_t - \bar{X})^2 \sum (Y_t - \bar{Y})^2}}$$
- **Invariants**:
  - Diagonal identity: $\rho(X, X) \equiv 1.0$.
  - Symmetry: $\rho(X, Y) \equiv \rho(Y, X)$.
  - Boundedness: $-1.0 \le \rho(X, Y) \le 1.0$.
  - Zero volatility: Constant price series produces `null`, avoiding division by zero.

---

### 1.4 Portfolio Accounting Identities

- **Portfolio Balance Identity**:
  At any evaluation timestamp $t$:
  $$V_t = C_t + \sum_{i=1}^M (Q_{i, t} \times P_{i, t})$$
  Where $V_t$ is total portfolio value, $C_t$ is uninvested cash, $Q_{i, t}$ is quantity held, and $P_{i, t}$ is market price.

- **Non-negativity Invariants (Long-Only)**:
  - Cash: $C_t \ge 0$.
  - Holdings: $Q_{i, t} \ge 0$.
  - Target weight sum: $\sum w_i \le 1.0$ (with residual allocated to cash).

---

### 1.5 Backtest Execution & Look-Ahead Bias Prevention

- **Next-Open Fill Rule**:
  Signals generated on bar $t$ (using bar $t$'s Close or prior information) **must execute strictly at Bar $t+1$'s Open price**.
  $$\text{Execution Price} = \text{Open}_{t+1}$$
  $$\text{Fill Timestamp} = \text{Timestamp}_{t+1}$$
  Execution using Bar $t$'s Open or Close violates look-ahead boundaries and is caught by unit tests.

- **Transaction Costs & Slippage**:
  $$\text{Net P&L} = \text{Gross P&L} - \text{Total Commissions} - \text{Total Slippage}$$

---

### 1.6 Equity, Drawdown & Performance Metrics

- **Running Peak**:
  $$M_t = \max_{0 \le s \le t} (E_s)$$
  *Invariant*: $M_t \ge E_t$ for all $t$.

- **Drawdown Series**:
  $$DD_t = \frac{E_t}{M_t} - 1$$
  *Invariant*: $DD_t \le 0.0$ at all times.

- **Maximum Drawdown**:
  $$\text{MDD} = \min_{0 \le t \le T} (DD_t)$$

- **Sharpe Ratio**:
  $$S = \frac{\bar{R}_{\text{ann}} - R_f}{\sigma_{\text{ann}}}$$
  *Edge Case*: When $\sigma = 0$, Sharpe ratio must return `null`, never `Infinity` or `0.0`.

- **Sortino Ratio**:
  $$S_{\text{sortino}} = \frac{\bar{R}_{\text{ann}} - R_f}{\text{Downside Deviation}_{\text{ann}}}$$

- **Calmar Ratio**:
  $$\text{Calmar} = \frac{\text{CAGR}}{|\text{MDD}|}$$

---

## 2. Numerical Tolerance Policy

Because floating-point representation (IEEE 754) introduces minor precision drift in division and trigonometric/transcendental functions, strict equality (`==`) is forbidden for floating-point financial assertions.

We establish the following standard tolerances:

| Metric Category | Relative Tolerance (`rel_tol`) | Absolute Tolerance (`abs_tol`) | Rationale |
| :--- | :--- | :--- | :--- |
| **Returns** (Simple / Log) | `1e-6` | `1e-8` | Prevents sub-basis-point drift |
| **Volatility** (Daily / Ann) | `1e-5` | `1e-7` | Accommodates $\sqrt{N}$ scaling |
| **Correlation** ($\rho$) | `1e-5` | `1e-6` | Accommodates pairwise covariance |
| **Portfolio Value & P&L** | `1e-4` | `1e-4` | Cent-level precision on high capital |
| **Sharpe / Sortino / Calmar** | `1e-4` | `1e-5` | Ratio sensitivity to volatility |

### Assertion Helpers in Code
```python
import math
import pytest

# Example pytest assertion
assert return_val == pytest.approx(expected_return, rel=1e-5, abs=1e-6)

# Example math check
assert math.isclose(port_val, cash + pos_val, rel_tol=1e-4, abs_tol=1e-4)
```

---

## 3. Property-Based Testing (Hypothesis)

We use `hypothesis` to test mathematical invariants over wide, automatically generated distributions.

Key property tests implemented in `backend/tests/unit/test_property_based.py`:
1. `test_property_return_identity`: For any positive price pairs $P_1, P_2 \in (0.01, 100,000)$, $P_2 = P_1 \times (1 + R)$ and $e^r = 1 + R$.
2. `test_property_correlation_symmetry`: For any two series of length $N \ge 10$, $\rho(A, B) = \rho(B, A)$ and $\rho(A, A) = 1.0$.
3. `test_property_drawdown_invariants`: For any valid equity trajectory, $DD_t \le 0.0$ and running peak $\ge E_t$.
4. `test_property_portfolio_accounting_identity`: For any combination of cash and asset holdings, total portfolio value equals cash plus position values.
5. `test_property_backtest_next_open_execution_no_lookahead`: Guarantees fill occurs at bar $t+1$'s Open price without incorporating future data.
6. `test_property_constant_price_zero_volatility`: Verifies that a zero variance dataset produces zero volatility and `null` Sharpe ratio.
