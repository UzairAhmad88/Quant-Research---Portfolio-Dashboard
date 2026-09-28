from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd


class FeatureEngine:
    """
    Institutional Feature Engineering Engine for Quant Research.
    Generates deterministic, vectorized financial features across price, momentum,
    trend, volatility, and volume domains with zero lookahead bias.
    """

    @staticmethod
    def compute_all_features(df: pd.DataFrame) -> pd.DataFrame:
        """
        Takes a validated DataFrame containing [open, high, low, close, volume]
        and returns a rich feature-engineered DataFrame.
        """
        if df.empty or len(df) < 5:
            return df

        df = df.copy()
        if "close" not in df.columns:
            return df

        close = df["close"].astype(float)
        high = df["high"].astype(float) if "high" in df.columns else close
        low = df["low"].astype(float) if "low" in df.columns else close
        volume = df["volume"].astype(float) if "volume" in df.columns else pd.Series(1.0, index=df.index)

        # 1. Price & Return Features
        df["return_simple"] = close.pct_change().fillna(0.0)
        df["return_log"] = np.log(close / close.shift(1)).fillna(0.0)
        df["return_cum"] = (1 + df["return_simple"]).cumprod() - 1.0
        df["rolling_mean_20"] = close.rolling(window=20, min_periods=1).mean()
        df["rolling_std_20"] = close.rolling(window=20, min_periods=1).std().fillna(0.0)
        df["rolling_min_20"] = close.rolling(window=20, min_periods=1).min()
        df["rolling_max_20"] = close.rolling(window=20, min_periods=1).max()

        # 2. Momentum Features
        # Rate of Change (10-day)
        df["roc_10"] = ((close - close.shift(10)) / close.shift(10).replace(0, np.nan)).fillna(0.0) * 100
        # Momentum (10-day)
        df["momentum_10"] = close - close.shift(10).fillna(close)
        # Relative Strength Index (RSI-14) with Wilder's exponential smoothing
        delta = close.diff()
        gain = (delta.where(delta > 0, 0)).fillna(0)
        loss = (-delta.where(delta < 0, 0)).fillna(0)
        avg_gain = gain.ewm(alpha=1/14, min_periods=14, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1/14, min_periods=14, adjust=False).mean()
        rs = avg_gain / avg_loss.replace(0, np.nan)
        df["rsi_14"] = (100 - (100 / (1 + rs))).fillna(50.0)

        # 3. Trend Features
        df["sma_20"] = close.rolling(window=20, min_periods=1).mean()
        df["sma_50"] = close.rolling(window=50, min_periods=1).mean()
        df["sma_200"] = close.rolling(window=200, min_periods=1).mean()
        df["ema_12"] = close.ewm(span=12, adjust=False).mean()
        df["ema_26"] = close.ewm(span=26, adjust=False).mean()
        df["macd"] = df["ema_12"] - df["ema_26"]
        df["macd_signal"] = df["macd"].ewm(span=9, adjust=False).mean()
        df["macd_hist"] = df["macd"] - df["macd_signal"]

        # 4. Volatility Features
        # Rolling annualized volatility (20-day)
        df["volatility_20"] = (df["return_simple"].rolling(window=20, min_periods=5).std() * np.sqrt(252)).fillna(0.0)
        # Average True Range (ATR-14)
        prev_close = close.shift(1)
        tr1 = high - low
        tr2 = (high - prev_close).abs()
        tr3 = (low - prev_close).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        df["atr_14"] = tr.rolling(window=14, min_periods=1).mean().fillna(0.0)
        # Bollinger Bands (20, 2)
        bb_mid = df["sma_20"]
        bb_std = df["rolling_std_20"]
        df["bb_upper"] = bb_mid + (bb_std * 2)
        df["bb_lower"] = bb_mid - (bb_std * 2)
        bb_range = (df["bb_upper"] - df["bb_lower"]).replace(0, np.nan)
        df["bb_pct_b"] = ((close - df["bb_lower"]) / bb_range).fillna(0.5)
        df["bb_bandwidth"] = (bb_range / bb_mid.replace(0, np.nan)).fillna(0.0)

        # 5. Volume Features
        df["volume_change"] = volume.pct_change().fillna(0.0)
        df["volume_ma_20"] = volume.rolling(window=20, min_periods=1).mean()
        df["volume_ratio_20"] = (volume / df["volume_ma_20"].replace(0, np.nan)).fillna(1.0)

        return df

    @staticmethod
    def explore_feature(df: pd.DataFrame, feature_name: str, window: int = 14) -> Dict[str, Any]:
        """
        Analyzes a single feature for statistical distribution, forward return correlation,
        and rolling telemetry.
        """
        featured_df = FeatureEngine.compute_all_features(df)
        if feature_name not in featured_df.columns:
            raise ValueError(f"Feature '{feature_name}' not available in engineered dataset.")

        series = featured_df[feature_name].dropna()
        if series.empty:
            return {"error": "Empty series for requested feature"}

        # Forward return (1-period ahead)
        forward_ret = featured_df["return_simple"].shift(-1).dropna()
        aligned = pd.concat([series, forward_ret], axis=1, keys=["feat", "fwd_ret"]).dropna()

        corr_fwd = float(aligned["feat"].corr(aligned["fwd_ret"])) if len(aligned) > 5 else 0.0

        stats = {
            "mean": float(series.mean()),
            "median": float(series.median()),
            "std": float(series.std()),
            "min": float(series.min()),
            "max": float(series.max()),
            "skewness": float(series.skew()) if len(series) > 3 else 0.0,
            "kurtosis": float(series.kurt()) if len(series) > 3 else 0.0,
            "forward_return_correlation": corr_fwd,
            "sample_size": len(series),
        }

        # Histogram distribution (10 bins)
        hist_counts, bin_edges = np.histogram(series.values, bins=10)
        distribution = [
            {
                "bin_start": float(bin_edges[i]),
                "bin_end": float(bin_edges[i+1]),
                "bin_label": f"{bin_edges[i]:.2f}–{bin_edges[i+1]:.2f}",
                "count": int(hist_counts[i]),
                "percentage": float((hist_counts[i] / len(series)) * 100),
            }
            for i in range(len(hist_counts))
        ]

        # Recent time series points (up to 100 points)
        time_series = [
            {
                "timestamp": str(idx),
                "value": float(val),
            }
            for idx, val in zip(series.index[-100:], series.values[-100:])
        ]

        return {
            "feature": feature_name,
            "window": window,
            "statistics": stats,
            "distribution": distribution,
            "time_series": time_series,
            "description": "Descriptive research telemetry without lookahead certainty.",
        }
