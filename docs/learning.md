# Quantitative Learning Mode & Mathematical Glossary

## 1. Overview
The platform embeds quantitative financial education directly into the workstation UI, bridging mathematical theory, code implementation, and practical trading limitations.

## 2. Core Mathematical Formulations

### Sharpe Ratio
- **Formula**:
  $$\text{Sharpe} = \frac{R_p - R_f}{\sigma_p}$$
- **Interpretation**: Higher values indicate higher return generated per unit of total risk. Assumes returns are normally distributed.

### Sortino Ratio
- **Formula**:
  $$\text{Sortino} = \frac{R_p - R_f}{\sigma_{\text{downside}}}, \quad \sigma_{\text{downside}} = \sqrt{\frac{1}{N}\sum_{t=1}^N \min(R_t - R_{\text{target}}, 0)^2} \times \sqrt{252}$$
- **Interpretation**: Measures return per unit of bad (downside) volatility without penalizing upside rallies.

### Value at Risk (Parametric & Historical)
- **Parametric (Normal Distribution)**:
  $$\text{VaR}_\alpha = -(\mu_p - Z_\alpha \cdot \sigma_p)$$
- **Historical Simulation**:
  $$\text{VaR}_\alpha = -\text{Quantile}(R, 1 - \alpha)$$

### Expected Shortfall (Conditional VaR)
- **Formula**:
  $$\text{ES}_\alpha = -E[R \mid R \le -\text{VaR}_\alpha]$$
- **Interpretation**: Quantifies the average loss expected when the VaR threshold is breached.

### Maximum Drawdown (MDD)
- **Formula**:
  $$\text{MDD} = \max_{t \in [0, T]} \left( \frac{\text{Peak}_t - P_t}{\text{Peak}_t} \right)$$
