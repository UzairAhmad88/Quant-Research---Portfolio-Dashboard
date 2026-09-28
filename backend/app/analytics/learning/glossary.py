from typing import Dict, Any, List, Optional


GLOSSARY_CATALOG: Dict[str, Dict[str, Any]] = {
    "sharpe_ratio": {
        "term": "Sharpe Ratio",
        "category": "Risk-Adjusted Return",
        "definition": "Measures the excess return of an investment per unit of total risk (measured as annualized standard deviation).",
        "formula": "Sharpe = (R_p - R_f) / sigma_p",
        "variables": [
            {"symbol": "R_p", "name": "Annualized Portfolio Return", "unit": "%"},
            {"symbol": "R_f", "name": "Risk-Free Rate (e.g. 10Y US Treasury)", "unit": "%"},
            {"symbol": "sigma_p", "name": "Annualized Standard Deviation of Returns", "unit": "%"},
        ],
        "example": "If a portfolio achieves 14% annualized return with 16% annualized volatility against a 4% risk-free benchmark: Sharpe = (0.14 - 0.04) / 0.16 = 0.625.",
        "interpretation": "Values > 1.0 indicate good risk-adjusted returns; > 2.0 indicate exceptional quality. Negative values indicate underperformance relative to the risk-free rate.",
        "limitations": "Assumes normal distribution of returns; penalizes upside volatility equally with downside losses; vulnerable to serial correlation smoothing.",
    },
    "sortino_ratio": {
        "term": "Sortino Ratio",
        "category": "Downside Risk-Adjusted Return",
        "definition": "A modification of the Sharpe ratio that penalizes only downside volatility below the target or risk-free return.",
        "formula": "Sortino = (R_p - R_f) / sigma_downside",
        "variables": [
            {"symbol": "R_p", "name": "Annualized Portfolio Return", "unit": "%"},
            {"symbol": "R_f", "name": "Minimum Acceptable Return / Risk-Free Rate", "unit": "%"},
            {"symbol": "sigma_downside", "name": "Annualized Downside Semi-Deviation", "unit": "%"},
        ],
        "example": "If R_p = 18%, R_f = 4%, and downside deviation = 7%: Sortino = (0.18 - 0.04) / 0.07 = 2.0.",
        "interpretation": "A higher Sortino indicates the strategy generates returns without excessive harmful downside variance.",
        "limitations": "Requires sufficient negative return observations to compute a statistically reliable downside deviation.",
    },
    "value_at_risk": {
        "term": "Value at Risk (VaR)",
        "category": "Tail Risk",
        "definition": "Estimates the maximum expected percentage or dollar loss over a specified holding period (e.g., 1 day) at a given confidence level (e.g., 95% or 99%).",
        "formula": "Parametric: VaR_alpha = z_alpha * sigma_daily - mu_daily\nHistorical: VaR_alpha = -Percentile(Returns, 1 - alpha)",
        "variables": [
            {"symbol": "alpha", "name": "Confidence Level (0.95 or 0.99)", "unit": "scalar"},
            {"symbol": "z_alpha", "name": "Standard Normal Critical Value (1.645 for 95%, 2.326 for 99%)", "unit": "scalar"},
            {"symbol": "sigma_daily", "name": "Daily Volatility", "unit": "%"},
        ],
        "example": "For a $1,000,000 portfolio with a 1-day 95% Historical VaR of 1.84%, the maximum expected loss over 1 day with 95% certainty is $18,400.",
        "interpretation": "Used by institutional risk desks and regulatory frameworks (Basel) to monitor portfolio leverage and capital adequacy.",
        "limitations": "Does NOT describe the magnitude of losses in the remaining 5% or 1% tail (see Expected Shortfall).",
    },
    "expected_shortfall": {
        "term": "Expected Shortfall (CVaR)",
        "category": "Tail Risk",
        "definition": "The expected loss given that the loss exceeds the Value at Risk threshold (the average of all tail losses beyond VaR).",
        "formula": "ES_alpha = -E[ R | R <= -VaR_alpha ]",
        "variables": [
            {"symbol": "alpha", "name": "Confidence Level", "unit": "scalar"},
            {"symbol": "VaR_alpha", "name": "Value at Risk cutoff", "unit": "%"},
        ],
        "example": "If 1-day 95% VaR is 1.84% and the average of all worst 5% returns is 2.76%, the Expected Shortfall is 2.76% ($27,600 on $1M).",
        "interpretation": "A coherent risk measure that accurately accounts for fat-tailed distributions and extreme black swan drawdowns.",
        "limitations": "Highly sensitive to historical sample size and extreme outlier events.",
    },
    "beta": {
        "term": "Beta (Market Sensitivity)",
        "category": "Factor Exposure",
        "definition": "Measures the systematic sensitivity of an asset or portfolio's returns relative to a market benchmark (e.g., SPY).",
        "formula": "Beta = Cov(R_p, R_m) / Var(R_m)",
        "variables": [
            {"symbol": "Cov(R_p, R_m)", "name": "Covariance between Portfolio and Market", "unit": "scalar"},
            {"symbol": "Var(R_m)", "name": "Variance of Market Benchmark Returns", "unit": "scalar"},
        ],
        "example": "Beta = 1.25 means the portfolio tends to amplify market moves by 25% (up or down). Beta = 0.70 indicates defensive low-volatility behavior.",
        "interpretation": "Systematic market risk cannot be diversified away. Beta > 1 is aggressive; Beta < 1 is defensive.",
        "limitations": "Assumes linear relationships; beta is unstable and shifts during market stress and regime transitions.",
    },
    "max_drawdown": {
        "term": "Maximum Drawdown (MDD)",
        "category": "Capital Preservation",
        "definition": "The largest peak-to-trough percentage drop in portfolio equity before a new peak is attained.",
        "formula": "Drawdown_t = (Equity_t - Peak_t) / Peak_t; MDD = Min(Drawdown_t)",
        "variables": [
            {"symbol": "Equity_t", "name": "Portfolio Equity at time t", "unit": "$"},
            {"symbol": "Peak_t", "name": "Maximum Equity recorded up to time t", "unit": "$"},
        ],
        "example": "If equity rises to $1,200,000 and drops to $960,000 before recovering, MDD = ($960,000 - $1,200,000) / $1,200,000 = -20.0%.",
        "interpretation": "Critical measure of psychological and institutional survival. Deep drawdowns require disproportionate gains to recover (e.g. -50% requires +100%).",
        "limitations": "Path-dependent; historical worst drawdown is a sample minimum and could be exceeded in the future.",
    },
};


class QuantLearningEngine:
    @staticmethod
    def get_glossary_terms() -> List[Dict[str, Any]]:
        return list(GLOSSARY_CATALOG.values())

    @staticmethod
    def get_term_detail(term_key: str) -> Optional[Dict[str, Any]]:
        return GLOSSARY_CATALOG.get(term_key)
