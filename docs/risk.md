# Advanced Risk Engine & Methodology

## Overview

The **Risk Engine** computes institutional tail-risk and downside statistics with full formula transparency.

---

## 1. Metrics & Formulations

### 1.1 Historical Value at Risk (VaR)
$$\text{VaR}_\alpha = -\text{Percentile}(\text{Returns}, 1 - \alpha)$$
Represents the empirical $(1-\alpha)$ loss threshold over a 1-day horizon.

### 1.2 Expected Shortfall (CVaR)
$$\text{ES}_\alpha = -\mathbb{E}[R \mid R \le -\text{VaR}_\alpha]$$
The conditional expected loss given that returns breach the VaR threshold.

### 1.3 Downside Deviation & Sortino Ratio
$$\sigma_{\text{downside}} = \sqrt{\frac{1}{N}\sum_{t=1}^N \min(0, R_t - R_f)^2} \times \sqrt{252}$$
$$\text{Sortino} = \frac{R_{\text{ann}} - R_f}{\sigma_{\text{downside}}}$$

### 1.4 Marginal Contribution to Risk (MCR)
$$\text{MCR}_i = \frac{(\Sigma w)_i}{\sigma_{\text{portfolio}}}$$
$$\text{Percentage Risk Contribution}_i = \frac{w_i \cdot \text{MCR}_i}{\sigma_{\text{portfolio}}}$$
