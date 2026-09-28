from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd


class MarketRegimeEngine:
    """
    Market Regime Lab Engine for Quantitative Research.
    Identifies market regimes (Bullish Expansion, Bearish Contraction, Sideways Consolidation)
    using rule-based thresholds and statistical clustering with explicit transition telemetry.
    """

    @staticmethod
    def detect_regimes_rule_based(
        df: pd.DataFrame,
        sma_fast: int = 50,
        sma_slow: int = 200,
        vol_lookback: int = 20,
    ) -> Dict[str, Any]:
        """
        Classifies periods into regimes based on price relative to moving averages and rolling volatility.
        Regimes:
        - REGIME_1_BULL: Close > SMA50 and SMA50 > SMA200 (Upward Trend, Low/Moderate Volatility)
        - REGIME_2_BEAR: Close < SMA50 and SMA50 < SMA200 (Downward Trend, Elevated Volatility)
        - REGIME_3_SIDEWAYS: Consolidation or Mean-Reverting Transition
        """
        if df.empty or len(df) < 20:
            return {"error": "Insufficient data for regime classification"}

        df = df.copy()
        close = df["close"].astype(float)
        ret = close.pct_change().fillna(0.0)

        sma_f = close.rolling(window=min(sma_fast, len(df)), min_periods=1).mean()
        sma_s = close.rolling(window=min(sma_slow, len(df)), min_periods=1).mean()
        vol_roll = ret.rolling(window=min(vol_lookback, len(df)), min_periods=5).std() * np.sqrt(252)
        median_vol = float(vol_roll.median()) if not np.isnan(vol_roll.median()) else 0.15

        regimes = []
        for i in range(len(df)):
            c = close.iloc[i]
            sf = sma_f.iloc[i]
            ss = sma_s.iloc[i]
            v = vol_roll.iloc[i]

            if c >= sf and sf >= ss:
                reg = "BULL_TREND"
            elif c < sf and sf < ss:
                reg = "BEAR_TREND"
            elif v > median_vol * 1.3:
                reg = "HIGH_VOL_TURBULENCE"
            else:
                reg = "SIDEWAYS_CONSOLIDATION"

            regimes.append(reg)

        df["regime"] = regimes
        df["return"] = ret

        # Compute characteristics per regime
        summary = {}
        for r_name in ["BULL_TREND", "BEAR_TREND", "SIDEWAYS_CONSOLIDATION", "HIGH_VOL_TURBULENCE"]:
            sub = df[df["regime"] == r_name]
            count = len(sub)
            if count > 0:
                sub_ret = sub["return"]
                mean_r = float(sub_ret.mean() * 252)
                vol_r = float(sub_ret.std() * np.sqrt(252)) if count > 1 else 0.0
                sharpe_r = float(mean_r / vol_r) if vol_r > 0 else 0.0
                summary[r_name] = {
                    "count": count,
                    "percentage": float((count / len(df)) * 100),
                    "annualized_return": mean_r,
                    "annualized_volatility": vol_r,
                    "sharpe_ratio": sharpe_r,
                }
            else:
                summary[r_name] = {
                    "count": 0,
                    "percentage": 0.0,
                    "annualized_return": 0.0,
                    "annualized_volatility": 0.0,
                    "sharpe_ratio": 0.0,
                }

        # Time series points (last 120 points)
        points = [
            {
                "timestamp": str(idx),
                "price": float(c),
                "regime": r,
                "volatility": float(v) if not np.isnan(v) else 0.0,
            }
            for idx, c, r, v in zip(df.index[-120:], close[-120:], df["regime"][-120:], vol_roll[-120:])
        ]

        return {
            "methodology": "Rule-Based Trend and Volatility Dispersion Filter",
            "parameters": {
                "fast_ma": sma_fast,
                "slow_ma": sma_slow,
                "volatility_lookback": vol_lookback,
            },
            "regime_summary": summary,
            "time_series": points,
            "observations": "Regimes reflect historical structural conditions without predictive forward certainty.",
        }
