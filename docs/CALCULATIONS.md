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


## Portfolio Return

R_p = sum(w_i * R_i)

## Pearson Correlation

rho(X,Y) = Cov(X,Y) / (sigma_X * sigma_Y)

## Volatility

sigma = standard deviation of returns

## Annualized Daily Volatility

sigma_annual = sigma_daily * sqrt(252)

The annualization convention must remain configurable.

## SMA

SMA_n = mean of the last n prices

## Drawdown

Drawdown_t = (PortfolioValue_t - PreviousPeak_t) / PreviousPeak_t

## Backtest Metrics

Implement total return, annualized return, volatility, Sharpe ratio, maximum drawdown, trade count, win rate and profit factor with clearly documented assumptions.
