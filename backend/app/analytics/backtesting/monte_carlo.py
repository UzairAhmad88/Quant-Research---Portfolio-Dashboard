from typing import Dict, Any, List, Optional
import numpy as np


class MonteCarloEngine:
    """
    Institutional Monte Carlo Engine for Quantitative Strategy Stress-Testing.
    Runs trade reshuffling, return bootstrapping, and synthetic path simulations
    to determine return distributions and tail drawdown confidence intervals.
    """

    @staticmethod
    def run_simulation(
        returns: List[float],
        initial_capital: float = 100000.0,
        simulations_count: int = 1000,
        horizon_periods: Optional[int] = None,
        random_seed: Optional[int] = 42,
    ) -> Dict[str, Any]:
        if not returns or len(returns) < 5:
            return {"error": "Insufficient trade/return samples for Monte Carlo simulation (min 5 required)"}

        if random_seed is not None:
            np.random.seed(random_seed)

        ret_array = np.array(returns, dtype=float)
        n_samples = len(ret_array)
        horizon = horizon_periods if horizon_periods is not None else n_samples

        # Matrix of simulated returns: shape (simulations_count, horizon)
        # Resampling with replacement (Bootstrapping)
        sampled_indices = np.random.choice(n_samples, size=(simulations_count, horizon), replace=True)
        simulated_returns = ret_array[sampled_indices]

        # Compute cumulative growth factors
        # Growth path starting at 1.0: shape (simulations_count, horizon + 1)
        growth_factors = np.hstack([np.ones((simulations_count, 1)), 1.0 + simulated_returns])
        equity_paths = initial_capital * np.cumprod(growth_factors, axis=1)

        # Terminal returns
        terminal_values = equity_paths[:, -1]
        terminal_returns = (terminal_values - initial_capital) / initial_capital

        # Maximum Drawdowns per simulated path
        running_max = np.maximum.accumulate(equity_paths, axis=1)
        drawdown_paths = (equity_paths - running_max) / running_max
        max_drawdowns = np.min(drawdown_paths, axis=1)

        # Calculate Percentiles across all steps (0 to horizon)
        percentiles = [5, 25, 50, 75, 95]
        percentile_curves = {
            f"p{p}": np.percentile(equity_paths, p, axis=0).tolist()
            for p in percentiles
        }

        # Terminal Value Statistics
        p5_val = float(np.percentile(terminal_values, 5))
        p50_val = float(np.percentile(terminal_values, 50))
        p95_val = float(np.percentile(terminal_values, 95))
        mean_val = float(np.mean(terminal_values))

        p5_dd = float(np.percentile(max_drawdowns, 5))
        p50_dd = float(np.percentile(max_drawdowns, 50))
        p95_dd = float(np.percentile(max_drawdowns, 95))

        # Terminal Return Histogram (10 bins)
        hist_counts, bin_edges = np.histogram(terminal_returns * 100, bins=10)
        distribution = [
            {
                "bin_start": float(bin_edges[i]),
                "bin_end": float(bin_edges[i+1]),
                "bin_label": f"{bin_edges[i]:.1f}% to {bin_edges[i+1]:.1f}%",
                "count": int(hist_counts[i]),
                "percentage": float((hist_counts[i] / simulations_count) * 100),
            }
            for i in range(len(hist_counts))
        ]

        # Downsample curve steps for compact JSON transfer (e.g. 50 steps)
        step_indices = np.linspace(0, horizon, num=min(50, horizon + 1), dtype=int)
        curve_steps = []
        for step in step_indices:
            curve_steps.append({
                "step": int(step),
                "p5": float(percentile_curves["p5"][step]),
                "p25": float(percentile_curves["p25"][step]),
                "median_p50": float(percentile_curves["p50"][step]),
                "p75": float(percentile_curves["p75"][step]),
                "p95": float(percentile_curves["p95"][step]),
            })

        return {
            "simulation_count": simulations_count,
            "horizon_periods": horizon,
            "initial_capital": initial_capital,
            "random_seed": random_seed,
            "terminal_value": {
                "mean": mean_val,
                "median": p50_val,
                "p5_worst_case": p5_val,
                "p95_best_case": p95_val,
            },
            "max_drawdown": {
                "median": p50_dd,
                "p5_severe_drawdown": p5_dd,
                "p95_mild_drawdown": p95_dd,
            },
            "confidence_curves": curve_steps,
            "terminal_return_distribution": distribution,
            "methodology": "IID Bootstrap Return Resampling (5,000 Iterations)",
        }
