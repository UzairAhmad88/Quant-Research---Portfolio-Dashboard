from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from scipy import stats


class RiskEngine:
    """
    Institutional Risk Engine for Quantitative Research & Portfolio Risk Management.
    Computes parametric and historical VaR, Expected Shortfall (CVaR), Downside Deviation,
    Beta, Tracking Error, and Risk Contributions with full methodology transparency.
    """

    @staticmethod
    def calculate_portfolio_risk(
        returns: pd.Series,
        benchmark_returns: Optional[pd.Series] = None,
        confidence_level: float = 0.95,
        portfolio_value: float = 1000000.0,
        risk_free_rate: float = 0.04,
    ) -> Dict[str, Any]:
        """
        Computes comprehensive risk metrics for a returns series.
        """
        clean_returns = returns.dropna()
        if len(clean_returns) < 5:
            return {
                "error": "Insufficient observations for robust risk calculation (min 5 required)",
                "sample_size": len(clean_returns),
            }

        ret_array = clean_returns.values
        n = len(ret_array)
        mean_daily = float(np.mean(ret_array))
        std_daily = float(np.std(ret_array, ddof=1)) if n > 1 else 0.0
        annualized_vol = float(std_daily * np.sqrt(252))

        # 1. Historical VaR
        # Percentile of returns at (1 - confidence_level)
        alpha = 1.0 - confidence_level
        hist_var_pct = float(-np.percentile(ret_array, alpha * 100))
        hist_var_dollars = float(hist_var_pct * portfolio_value)

        # 2. Parametric (Gaussian) VaR
        z_score = float(stats.norm.ppf(confidence_level))
        param_var_pct = float(z_score * std_daily - mean_daily)
        param_var_dollars = float(param_var_pct * portfolio_value)

        # 3. Expected Shortfall (CVaR - Conditional Value at Risk)
        # Average of returns that fall beyond the historical VaR cutoff
        tail_cutoff = -hist_var_pct
        tail_returns = ret_array[ret_array <= tail_cutoff]
        if len(tail_returns) > 0:
            hist_es_pct = float(-np.mean(tail_returns))
        else:
            hist_es_pct = hist_var_pct * 1.25
        hist_es_dollars = float(hist_es_pct * portfolio_value)

        # 4. Downside Deviation & Sortino
        rf_daily = risk_free_rate / 252.0
        downside_diff = np.minimum(0, ret_array - rf_daily)
        downside_dev_daily = float(np.sqrt(np.mean(downside_diff ** 2)))
        downside_dev_ann = float(downside_dev_daily * np.sqrt(252))

        annualized_ret = float((1 + mean_daily) ** 252 - 1)
        sortino_ratio = (
            float((annualized_ret - risk_free_rate) / downside_dev_ann)
            if downside_dev_ann > 0
            else 0.0
        )
        sharpe_ratio = (
            float((annualized_ret - risk_free_rate) / annualized_vol)
            if annualized_vol > 0
            else 0.0
        )

        # 5. Maximum Drawdown & Peak-to-Trough
        cum_ret = (1 + clean_returns).cumprod()
        running_max = cum_ret.cummax()
        drawdown_series = (cum_ret - running_max) / running_max
        max_drawdown = float(drawdown_series.min())
        avg_drawdown = float(drawdown_series.mean())

        # 6. Benchmark Metrics (Beta, Tracking Error, Alpha, Information Ratio)
        beta = 1.0
        alpha_ann = 0.0
        tracking_error = 0.0
        info_ratio = 0.0
        corr_bm = 1.0

        if benchmark_returns is not None and not benchmark_returns.empty:
            aligned = pd.concat([clean_returns, benchmark_returns], axis=1).dropna()
            if len(aligned) > 5:
                p_ret = aligned.iloc[:, 0].values
                bm_ret = aligned.iloc[:, 1].values
                cov_mat = np.cov(p_ret, bm_ret)
                bm_var = cov_mat[1, 1]
                if bm_var > 0:
                    beta = float(cov_mat[0, 1] / bm_var)
                corr_bm = float(np.corrcoef(p_ret, bm_ret)[0, 1])

                # Active Return & Tracking Error
                active_diff = p_ret - bm_ret
                tracking_error_daily = float(np.std(active_diff, ddof=1))
                tracking_error = float(tracking_error_daily * np.sqrt(252))
                active_mean_ann = float(np.mean(active_diff) * 252)
                info_ratio = float(active_mean_ann / tracking_error) if tracking_error > 0 else 0.0

                bm_ann_ret = float((1 + np.mean(bm_ret)) ** 252 - 1)
                alpha_ann = float(annualized_ret - (risk_free_rate + beta * (bm_ann_ret - risk_free_rate)))

        return {
            "methodology": {
                "confidence_level": confidence_level,
                "confidence_label": f"{int(confidence_level * 100)}%",
                "horizon": "1-Day",
                "sample_size": n,
                "portfolio_value": portfolio_value,
                "risk_free_rate": risk_free_rate,
            },
            "var": {
                "historical_pct": hist_var_pct,
                "historical_dollars": hist_var_dollars,
                "parametric_pct": param_var_pct,
                "parametric_dollars": param_var_dollars,
            },
            "expected_shortfall": {
                "historical_es_pct": hist_es_pct,
                "historical_es_dollars": hist_es_dollars,
            },
            "volatility": {
                "daily": std_daily,
                "annualized": annualized_vol,
                "downside_deviation_daily": downside_dev_daily,
                "downside_deviation_annualized": downside_dev_ann,
            },
            "drawdown": {
                "maximum_drawdown": max_drawdown,
                "average_drawdown": avg_drawdown,
            },
            "ratios": {
                "sharpe_ratio": sharpe_ratio,
                "sortino_ratio": sortino_ratio,
                "calmar_ratio": float(abs(annualized_ret / max_drawdown)) if max_drawdown != 0 else 0.0,
            },
            "benchmark_analytics": {
                "beta": beta,
                "alpha_annualized": alpha_ann,
                "correlation": corr_bm,
                "tracking_error": tracking_error,
                "information_ratio": info_ratio,
            },
        }

    @staticmethod
    def calculate_asset_risk_contributions(
        returns_df: pd.DataFrame,
        weights: np.ndarray,
    ) -> List[Dict[str, Any]]:
        """
        Computes Marginal Contribution to Risk (MCR) and Percentage Contribution to Risk (PCR)
        for each component asset in a portfolio.
        """
        clean_df = returns_df.dropna()
        if clean_df.empty or len(clean_df.columns) != len(weights):
            return []

        cov_matrix = clean_df.cov().values * 252.0  # Annualized covariance
        port_variance = float(weights.T @ cov_matrix @ weights)
        port_volatility = np.sqrt(port_variance) if port_variance > 0 else 1.0

        # Marginal Contribution to Risk: d(sigma)/d(w) = (Cov @ w) / sigma
        marginal_risk = (cov_matrix @ weights) / port_volatility
        # Absolute Contribution to Risk: w_i * MCR_i
        absolute_risk = weights * marginal_risk
        # Percentage Contribution to Risk: (w_i * MCR_i) / sigma
        pct_risk = absolute_risk / port_volatility

        contributions = []
        for i, col in enumerate(clean_df.columns):
            contributions.append({
                "symbol": col,
                "weight": float(weights[i]),
                "weight_pct": float(weights[i] * 100),
                "marginal_contribution": float(marginal_risk[i]),
                "absolute_risk_contribution": float(absolute_risk[i]),
                "percentage_risk_contribution": float(pct_risk[i] * 100),
            })

        return contributions
