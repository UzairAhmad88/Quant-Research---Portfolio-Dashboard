import pandas as pd

def portfolio_returns(returns: pd.DataFrame, weights: dict[str, float]) -> pd.Series:
    weight_series = pd.Series(weights, dtype=float)
    if abs(weight_series.sum() - 1.0) > 1e-9:
        raise ValueError("Portfolio weights must sum to 1.")
    return returns[list(weights)].mul(weight_series, axis=1).sum(axis=1)
