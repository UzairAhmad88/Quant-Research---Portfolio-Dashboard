import math
from typing import Any, Optional, Dict, List
from app.core.exceptions import CalculationException, InsufficientDataException

def sanitize_non_finite(data: Any, strict: bool = False) -> Any:
    """
    Recursively inspects data structures and sanitizes NaN, Infinity, and -Infinity values.
    
    If strict=True: Raises CalculationException when a non-finite value is detected.
    If strict=False: Replaces non-finite values with None (serialized as JSON null),
                     preserving numerical integrity and preventing invalid IEEE 754 in JSON.
    """
    if isinstance(data, float):
        if math.isnan(data) or math.isinf(data):
            if strict:
                raise CalculationException(f"Non-finite numerical value encountered: {data}")
            return None
        return data

    if isinstance(data, dict):
        return {k: sanitize_non_finite(v, strict=strict) for k, v in data.items()}

    if isinstance(data, list):
        return [sanitize_non_finite(v, strict=strict) for v in data]

    return data


def validate_sufficient_observations(
    available: int,
    required: int,
    metric_name: str = "quantitative calculation"
) -> None:
    """
    Validates that a dataset has sufficient observations to calculate a statistical or financial metric.
    Raises InsufficientDataException if available < required.
    """
    if available < required:
        raise InsufficientDataException(
            message=f"Insufficient observations for {metric_name}. Required at least {required}, but received {available}.",
            required=required,
            available=available,
            details={"metric": metric_name, "required": required, "available": available}
        )


def safe_divide(numerator: Optional[float], denominator: Optional[float], default: Optional[float] = None) -> Optional[float]:
    """
    Safely divides two numbers. Returns default (None) if denominator is zero,
    or if either operand is None, NaN, or infinite.
    Prevents division-by-zero crashes or Infinity in metrics like Sharpe, Sortino, Profit Factor.
    """
    if numerator is None or denominator is None:
        return default

    try:
        num = float(numerator)
        den = float(denominator)
    except (ValueError, TypeError):
        return default

    if math.isnan(num) or math.isinf(num) or math.isnan(den) or math.isinf(den):
        return default

    if abs(den) < 1e-12:
        return default

    result = num / den
    if math.isnan(result) or math.isinf(result):
        return default

    return result
