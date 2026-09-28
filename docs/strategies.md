# Quantitative Strategy Lab & Parameter Robustness

## 1. Overview
The Strategy Lab enables rigorous hypothesis formulation, signal generation, parameter sensitivity heatmapping, and walk-forward overfitting detection.

## 2. Strategy Architecture
Every quantitative strategy adheres to strict architectural criteria:
- **Zero Lookahead Bias**: Signals generated at $t$ can only execute on $t+1$ Open or $t+1$ Close, never using future information.
- **Explicit Versioning**: All parameter variations and formula adjustments are stored with unique hashes and configuration fingerprints.
- **Execution Modeling**: Realistic slippage (e.g. 5 bps) and commission costs (e.g. 10 bps per trade) are incorporated into backtesting evaluations.

## 3. Parameter Sweep Sensitivity Matrix (`parameter_lab.py`)
Rather than point optimization (which leads to overfitted curve-fitting), the system calculates an N-dimensional parameter matrix across indicator permutations (e.g. Fast MA 10-50, Slow MA 50-200):
- **Stability Islands**: Strategies with alpha distributed evenly across neighboring parameter sets are favored over isolated brittle spikes.
- **Heatmap Visualization**: Immediate visualization of Sharpe, CAGR, and Drawdown topologies.

## 4. Walk-Forward Testing Engine
Divides historical datasets into chronological train/test windows:
1. **In-Sample (Train)**: Strategy parameters are evaluated on historical segment $T_1 \dots T_k$.
2. **Out-of-Sample (Test)**: The strategy is applied untouched to subsequent unseen segment $T_{k+1} \dots T_m$.
3. **Performance Drift**: Quantifies degradation ($\Delta \text{Sharpe}$) between in-sample and out-of-sample periods to identify overfitting early.
