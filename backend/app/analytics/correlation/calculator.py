import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional, Any

class CorrelationCalculator:
    """
    Pure numerical correlation engine.
    Calculates Pearson correlation matrices, pairwise statistics, and rolling window correlation series.
    """

    @staticmethod
    def calculate_pearson_correlation(
        series_a: List[float],
        series_b: List[float]
    ) -> Optional[float]:
        """
        Calculates Pearson correlation coefficient between two equal-length numeric series.
        Returns None if fewer than 2 data points or if either series has zero variance (constant series).
        """
        if len(series_a) != len(series_b) or len(series_a) < 2:
            return None

        arr_a = np.array(series_a, dtype=np.float64)
        arr_b = np.array(series_b, dtype=np.float64)

        # Check zero variance (constant series)
        std_a = np.std(arr_a, ddof=1)
        std_b = np.std(arr_b, ddof=1)
        if std_a == 0.0 or std_b == 0.0 or np.isnan(std_a) or np.isnan(std_b):
            return None

        cov = np.cov(arr_a, arr_b)[0, 1]
        corr = cov / (std_a * std_b)

        if np.isnan(corr):
            return None

        # Clamp numerical floating point precision strictly to [-1.0, 1.0]
        return float(np.clip(corr, -1.0, 1.0))

    @staticmethod
    def calculate_correlation_matrix(
        aligned_df: pd.DataFrame
    ) -> Tuple[List[str], List[List[Optional[float]]]]:
        """
        Calculates NxN Pearson correlation matrix from aligned return DataFrame.
        Guarantees diagonal = 1.0 for valid columns and symmetry rho(A,B) = rho(B,A).
        """
        symbols = list(aligned_df.columns)
        n = len(symbols)
        if n == 0:
            return [], []

        # Vectorized correlation computation via pandas / numpy C routines
        corr_df = aligned_df.corr(method="pearson", min_periods=2)
        matrix: List[List[Optional[float]]] = []

        for i, sym_i in enumerate(symbols):
            row: List[Optional[float]] = []
            for j, sym_j in enumerate(symbols):
                if i == j:
                    row.append(1.0)
                else:
                    val = corr_df.iloc[i, j]
                    if pd.isna(val):
                        row.append(None)
                    else:
                        row.append(float(np.clip(val, -1.0, 1.0)))
            matrix.append(row)

        return symbols, matrix

    @staticmethod
    def calculate_rolling_correlation(
        series_a: List[float],
        series_b: List[float],
        timestamps: List[Any],
        window: int
    ) -> List[Tuple[Any, Optional[float]]]:
        """
        Calculates rolling Pearson correlation over a moving window of N observations.
        First window-1 elements will be None due to insufficient observations.
        """
        if len(series_a) != len(series_b) or len(series_a) != len(timestamps):
            return []

        results: List[Tuple[Any, Optional[float]]] = []
        n = len(series_a)

        for i in range(n):
            ts = timestamps[i]
            if i < window - 1:
                results.append((ts, None))
            else:
                window_a = series_a[i - window + 1 : i + 1]
                window_b = series_b[i - window + 1 : i + 1]
                corr = CorrelationCalculator.calculate_pearson_correlation(window_a, window_b)
                results.append((ts, corr))

        return results

    @staticmethod
    def get_correlation_interpretation(corr: Optional[float]) -> str:
        """
        Descriptive institutional interpretation ranges.
        """
        if corr is None:
            return "Undefined / Insufficient Variance"

        c = float(corr)
        if c >= 0.80:
            return "Very Strong Positive"
        elif c >= 0.60:
            return "Strong Positive"
        elif c >= 0.40:
            return "Moderate Positive"
        elif c >= 0.20:
            return "Weak Positive"
        elif c > -0.20:
            return "Very Weak / Near Zero"
        elif c > -0.40:
            return "Weak Negative"
        elif c > -0.60:
            return "Moderate Negative"
        elif c > -0.80:
            return "Strong Negative"
        else:
            return "Very Strong Negative"
