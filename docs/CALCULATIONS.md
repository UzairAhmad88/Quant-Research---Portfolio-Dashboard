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

## 4. Future Analytics Modules (Scaffolded)

### Volatility
Annualized daily volatility:
$$\sigma_{\text{annual}} = \sigma_{\text{daily}} \times \sqrt{N_{\text{annual}}}$$

### Maximum Drawdown
$$\text{Drawdown}_t = \frac{V_{p,t} - \max_{s \le t} V_{p,s}}{\max_{s \le t} V_{p,s}}$$

