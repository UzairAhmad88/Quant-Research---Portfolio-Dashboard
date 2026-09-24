from typing import Tuple
import pandas as pd


def validate_volatility_inputs(returns: pd.Series, min_obs: int = 30) -> Tuple[bool, str]:
    """
    Validates return series observation count against minimum statistical requirement.
    Default minimum threshold is 30 valid return observations.
    
    Returns:
        Tuple of (is_valid: bool, warning_or_error_message: str)
    """
    clean_returns = returns.dropna()
    obs_count = len(clean_returns)
    
    if obs_count < min_obs:
        return (
            False,
            f"Insufficient Data: Only {obs_count} valid return observations are available. At least {min_obs} are required."
        )
        
    return (True, "")
