# Quantitative Calculations

## Simple Return

R_t = (P_t - P_(t-1)) / P_(t-1)

## Log Return

r_t = ln(P_t / P_(t-1))

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
