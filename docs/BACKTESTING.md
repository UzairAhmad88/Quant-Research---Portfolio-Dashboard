# Backtesting Specification

## Pipeline

Historical Data
-> Validate Data
-> Calculate Indicators
-> Generate Signals
-> Generate Positions
-> Simulate Orders
-> Apply Commission/Slippage
-> Track Portfolio
-> Calculate Metrics
-> Return Trades and Charts

## Required Protections

- No future data in indicator calculations.
- Signals must be aligned with executable prices.
- Handle missing market data.
- Validate position sizes.
- Prevent impossible negative cash/positions unless explicitly supported.
- Record transaction costs.
- Store strategy parameters with every backtest.

## Initial Strategy

Moving-average crossover:

- short window
- long window
- SMA or EMA
- configurable entry/exit rules
