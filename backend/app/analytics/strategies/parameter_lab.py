from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd


class ParameterLabEngine:
    """
    Parameter Sweep, Walk-Forward, and Out-of-Sample Strategy Robustness Engine.
    Evaluates parameter sensitivity heatmaps and walk-forward stability without lookahead bias.
    """

    @staticmethod
    def run_sma_parameter_sweep(
        df: pd.DataFrame,
        fast_range: List[int] = [10, 20, 30, 40, 50],
        slow_range: List[int] = [50, 100, 150, 200],
        initial_capital: float = 100000.0,
        commission_pct: float = 0.001,
        slippage_pct: float = 0.0005,
    ) -> Dict[str, Any]:
        if df.empty or len(df) < 50:
            return {"error": "Insufficient data for parameter sweep (min 50 bars required)"}

        close = df["close"].astype(float).values
        n = len(close)

        results_matrix = []
        best_sharpe = -999.0
        best_combo = None

        for fast in fast_range:
            for slow in slow_range:
                if fast >= slow:
                    continue

                # Calculate simple moving averages
                sma_fast = pd.Series(close).rolling(window=fast, min_periods=1).mean().values
                sma_slow = pd.Series(close).rolling(window=slow, min_periods=1).mean().values

                # Signal: 1 when fast > slow, 0 otherwise
                signals = (sma_fast > sma_slow).astype(int)
                # Position on next day
                positions = np.roll(signals, 1)
                positions[0] = 0

                # Returns calculation
                price_pct = np.zeros(n)
                price_pct[1:] = (close[1:] - close[:-1]) / close[:-1]

                # Strategy daily return
                strat_ret = positions * price_pct

                # Costs on position change
                pos_changes = np.abs(positions - np.roll(positions, 1))
                pos_changes[0] = 0
                strat_ret = strat_ret - (pos_changes * (commission_pct + slippage_pct))

                cum_growth = np.cumprod(1.0 + strat_ret)
                total_return = float((cum_growth[-1] - 1.0) * 100)

                mean_r = np.mean(strat_ret)
                std_r = np.std(strat_ret, ddof=1) if len(strat_ret) > 1 else 0.0
                ann_vol = float(std_r * np.sqrt(252) * 100)
                sharpe = float((mean_r / std_r) * np.sqrt(252)) if std_r > 0 else 0.0

                # Max Drawdown
                running_max = np.maximum.accumulate(cum_growth)
                drawdowns = (cum_growth - running_max) / running_max
                max_dd = float(np.min(drawdowns) * 100)

                trade_count = int(np.sum(pos_changes) / 2)

                record = {
                    "fast_window": fast,
                    "slow_window": slow,
                    "total_return_pct": total_return,
                    "annualized_volatility_pct": ann_vol,
                    "sharpe_ratio": sharpe,
                    "max_drawdown_pct": max_dd,
                    "trade_count": trade_count,
                }
                results_matrix.append(record)

                if sharpe > best_sharpe:
                    best_sharpe = sharpe
                    best_combo = record

        return {
            "tested_combinations_count": len(results_matrix),
            "fast_range": fast_range,
            "slow_range": slow_range,
            "best_combination": best_combo,
            "matrix": results_matrix,
            "methodology": "Grid Optimization with Transaction Costs and 1-Day Execution Lag",
        }

    @staticmethod
    def run_walk_forward_analysis(
        df: pd.DataFrame,
        train_window_pct: float = 0.6,
        step_periods: int = 60,
        fast_candidates: List[int] = [10, 20, 30],
        slow_candidates: List[int] = [50, 100, 200],
    ) -> Dict[str, Any]:
        if df.empty or len(df) < 120:
            return {"error": "Insufficient data for walk-forward analysis (min 120 bars required)"}

        total_bars = len(df)
        train_len = int(total_bars * train_window_pct)
        test_len = total_bars - train_len

        # In-Sample Segment
        in_sample_df = df.iloc[:train_len]
        out_of_sample_df = df.iloc[train_len:]

        in_sample_sweep = ParameterLabEngine.run_sma_parameter_sweep(
            in_sample_df, fast_range=fast_candidates, slow_range=slow_candidates
        )
        best_in_sample = in_sample_sweep.get("best_combination", {"fast_window": 20, "slow_window": 50})

        # Out-of-sample evaluation using the optimal in-sample parameters
        out_sweep = ParameterLabEngine.run_sma_parameter_sweep(
            out_of_sample_df,
            fast_range=[best_in_sample["fast_window"]],
            slow_range=[best_in_sample["slow_window"]],
        )
        out_result = out_sweep["matrix"][0] if out_sweep.get("matrix") else {}

        # Performance drift
        in_sharpe = best_in_sample.get("sharpe_ratio", 0.0)
        out_sharpe = out_result.get("sharpe_ratio", 0.0)
        drift_pct = float(((out_sharpe - in_sharpe) / abs(in_sharpe)) * 100) if in_sharpe != 0 else 0.0

        return {
            "in_sample_period": {
                "bars": train_len,
                "fast_window": best_in_sample.get("fast_window"),
                "slow_window": best_in_sample.get("slow_window"),
                "sharpe_ratio": in_sharpe,
                "total_return_pct": best_in_sample.get("total_return_pct"),
                "max_drawdown_pct": best_in_sample.get("max_drawdown_pct"),
            },
            "out_of_sample_period": {
                "bars": test_len,
                "sharpe_ratio": out_sharpe,
                "total_return_pct": out_result.get("total_return_pct"),
                "max_drawdown_pct": out_result.get("max_drawdown_pct"),
            },
            "performance_drift_pct": drift_pct,
            "parameter_stability": "STABLE" if abs(drift_pct) < 30 else "MODERATE_DEGRADATION" if drift_pct < 0 else "EXPANDED_ALPHA",
            "methodology": "Walk-Forward Out-of-Sample Train/Test Partitioning",
        }
