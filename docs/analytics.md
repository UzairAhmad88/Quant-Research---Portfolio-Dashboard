# Quantitative Analytics & Feature Engineering

## 1. Overview
The quantitative analytics engine is built around high-performance vectorized operations utilizing NumPy, SciPy, and Pandas. It powers statistical feature extraction, rolling volatility models, correlation structure discovery, and regime classification.

## 2. Feature Engineering Pipeline (`feature_engine.py`)
Features are calculated strictly on historical and current bar observations without lookahead contamination:

### Price & Return Features
- **Arithmetic Returns**: $R_t = \frac{P_t - P_{t-1}}{P_{t-1}}$
- **Logarithmic Returns**: $r_t = \ln(P_t / P_{t-1})$
- **Cumulative Return**: $\prod_{i=1}^t (1 + R_i) - 1$
- **Rolling Min / Max**: $\min_{i \in [t-N+1, t]} P_i, \max_{i \in [t-N+1, t]} P_i$

### Momentum & Oscillator Indicators
- **Relative Strength Index (RSI-14)**:
  $$RS = \frac{\text{EMA}(\text{Gains}, 14)}{\text{EMA}(\text{Losses}, 14)}, \quad RSI = 100 - \frac{100}{1 + RS}$$
- **Rate of Change (ROC-N)**: $\frac{P_t - P_{t-N}}{P_{t-N}} \times 100$
- **Moving Average Convergence Divergence (MACD)**:
  $$\text{MACD Line} = \text{EMA}_{12} - \text{EMA}_{26}, \quad \text{Signal} = \text{EMA}_9(\text{MACD Line})$$

### Volatility & Dispersion
- **Rolling Annualized Volatility**: $\sigma_{\text{ann}} = \text{std}(R_{t-N..t}) \times \sqrt{252}$
- **Average True Range (ATR-14)**:
  $$TR = \max(H_t - L_t, |H_t - C_{t-1}|, |L_t - C_{t-1}|), \quad ATR = \text{EMA}_{14}(TR)$$
- **Bollinger Bands %B**: $\frac{\text{Price} - \text{LowerBand}}{\text{UpperBand} - \text{LowerBand}}$

## 3. Market Regime Lab (`regime_engine.py`)
Identifies structural market shifts using statistical thresholds:
1. **Bull Trend**: Price > SMA50 > SMA200, Moderate Volatility.
2. **Bear Trend**: Price < SMA50 < SMA200, Elevated Volatility.
3. **Sideways Consolidation**: SMA50 $\approx$ SMA200 with low dispersion.
4. **High Volatility Turbulence**: Rolling volatility > 85th historical percentile.

Provides unconditional regime transition matrices and empirical Sharpe ratios per state.
