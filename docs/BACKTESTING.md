# Backtesting Simulation & Monte Carlo Stress Testing

## 1. Overview
The backtesting platform provides institutional-grade historical simulation with explicit trade execution mechanics, realistic slippage, commission structures, and Monte Carlo resampling.

## 2. Simulation Engine Execution Pipeline
```
[Historical OHLCV Series] -> [Signal Generation (t)] -> [Execution at t+1 Open/Close]
                                                               |
                                                               v
                                    [Slippage Model] & [Commission Model]
                                                               |
                                                               v
                                    [Trade Ledger & Equity Path Computation]
                                                               |
                                                               v
                                    [Performance, Drawdown & Risk Attribution]
```

## 3. Real-World Execution Parameters
- **Slippage**: Adjustable percentage (e.g., 5 bps / 0.05%) or dollar amount applied against fill price.
- **Commission**: Flat fee per trade or bps proportional to trade notional value.
- **Position Sizing**: Fixed capital fraction, fixed shares, or volatility-scaled sizing (Kelly / Target Vol).
- **Short Selling**: Explicit borrow rate and margin requirements.

## 4. Monte Carlo Research Lab (`monte_carlo.py`)
Stress-tests historical equity trajectories to quantify sequence-of-returns vulnerability:
- **Resampling Method**: Non-parametric return bootstrapping across 5,000 independent simulation paths.
- **Percentile Confidence Bands**: Computes 5th percentile (stress worst-case), 25th percentile, 50th percentile (median expectation), 75th percentile, and 95th percentile (optimistic) equity curves.
- **Terminal Distribution Metrics**: Estimates probability of strategy ruin (Max DD > 25%), Expected Terminal Capital, and empirical Value at Risk.
