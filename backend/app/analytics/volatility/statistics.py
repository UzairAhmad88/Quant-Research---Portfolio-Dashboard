import math
from typing import Dict, Any, List
import numpy as np
import pandas as pd


def calculate_return_distribution(returns: pd.Series, num_bins: int = 20) -> Dict[str, Any]:
    """
    Computes descriptive return statistics and histogram bins for return distribution visualization.
    
    Args:
        returns: pandas Series of return values.
        num_bins: Number of histogram bins (default 20).
        
    Returns:
        Dict containing descriptive summary and histogram bin lists.
    """
    clean_returns = returns.dropna()
    total_obs = len(clean_returns)
    
    if total_obs == 0:
        return {
            "summary": {
                "mean": 0.0,
                "median": 0.0,
                "min": 0.0,
                "max": 0.0,
                "std_dev": 0.0,
                "positive_observations": 0,
                "negative_observations": 0,
                "zero_observations": 0,
                "total_observations": 0,
            },
            "histogram": []
        }
        
    mean_val = float(clean_returns.mean())
    median_val = float(clean_returns.median())
    min_val = float(clean_returns.min())
    max_val = float(clean_returns.max())
    std_val = float(clean_returns.std(ddof=1)) if total_obs > 1 else 0.0
    
    pos_count = int((clean_returns > 0.0).sum())
    neg_count = int((clean_returns < 0.0).sum())
    zero_count = int((clean_returns == 0.0).sum())
    
    # Calculate Histogram Bins
    histogram_bins: List[Dict[str, float]] = []
    
    # Handle edge case where min == max (constant series)
    if min_val == max_val:
        histogram_bins.append({
            "bin_start": min_val - 0.001,
            "bin_end": max_val + 0.001,
            "bin_center": min_val,
            "count": total_obs,
            "frequency_pct": 100.0
        })
    else:
        counts, bin_edges = np.histogram(clean_returns, bins=num_bins)
        for i in range(len(counts)):
            b_start = float(bin_edges[i])
            b_end = float(bin_edges[i + 1])
            b_center = (b_start + b_end) / 2.0
            cnt = int(counts[i])
            freq_pct = (cnt / total_obs) * 100.0 if total_obs > 0 else 0.0
            
            histogram_bins.append({
                "bin_start": b_start,
                "bin_end": b_end,
                "bin_center": b_center,
                "count": cnt,
                "frequency_pct": freq_pct
            })
            
    return {
        "summary": {
            "mean": mean_val,
            "median": median_val,
            "min": min_val,
            "max": max_val,
            "std_dev": std_val if not math.isnan(std_val) else 0.0,
            "positive_observations": pos_count,
            "negative_observations": neg_count,
            "zero_observations": zero_count,
            "total_observations": total_obs,
        },
        "histogram": histogram_bins
    }
