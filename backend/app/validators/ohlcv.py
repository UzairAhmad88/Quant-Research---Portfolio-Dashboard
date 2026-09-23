from typing import Dict, Any, List, Tuple
from app.validators.quality import ValidationIssue, Severity, ErrorCode

class OHLCVValidator:
    """
    Validates structural OHLC relationships and non-negative prices & volumes.
    """
    def validate_bar(self, bar: Dict[str, Any], index: int = 0) -> Tuple[bool, List[ValidationIssue]]:
        issues: List[ValidationIssue] = []
        is_valid = True

        open_p = bar.get("open")
        high_p = bar.get("high")
        low_p = bar.get("low")
        close_p = bar.get("close")
        adj_close = bar.get("adjusted_close")
        vol = bar.get("volume", 0.0)
        ts = bar.get("timestamp")

        # 1. Missing required numeric fields
        for name, val in [("open", open_p), ("high", high_p), ("low", low_p), ("close", close_p)]:
            if val is None or not isinstance(val, (int, float)):
                issues.append(ValidationIssue(
                    severity=Severity.ERROR,
                    code=ErrorCode.MISSING_REQUIRED_FIELD,
                    message=f"Observation is missing required field '{name}' or is not numeric.",
                    timestamp=ts,
                    field=name,
                    record_reference=f"bar_{index}"
                ))
                is_valid = False

        if not is_valid:
            return False, issues

        # 2. Positive prices validation
        if open_p <= 0 or high_p <= 0 or low_p <= 0 or close_p <= 0:
            issues.append(ValidationIssue(
                severity=Severity.ERROR,
                code=ErrorCode.NEGATIVE_PRICE,
                message=f"Prices must be strictly positive: Open={open_p}, High={high_p}, Low={low_p}, Close={close_p}.",
                timestamp=ts,
                field="ohlc",
                record_reference=f"bar_{index}"
            ))
            is_valid = False

        if adj_close is not None and adj_close <= 0:
            issues.append(ValidationIssue(
                severity=Severity.ERROR,
                code=ErrorCode.NEGATIVE_PRICE,
                message=f"Adjusted Close must be positive if specified: AdjustedClose={adj_close}.",
                timestamp=ts,
                field="adjusted_close",
                record_reference=f"bar_{index}"
            ))
            is_valid = False

        # 3. Volume non-negative validation
        if vol is not None and vol < 0:
            issues.append(ValidationIssue(
                severity=Severity.ERROR,
                code=ErrorCode.NEGATIVE_VOLUME,
                message=f"Trading volume cannot be negative: Volume={vol}.",
                timestamp=ts,
                field="volume",
                record_reference=f"bar_{index}"
            ))
            is_valid = False

        # 4. OHLC logical relationships validation
        if high_p < open_p or high_p < close_p or high_p < low_p:
            issues.append(ValidationIssue(
                severity=Severity.ERROR,
                code=ErrorCode.INVALID_OHLC_RELATIONSHIP,
                message=f"High ({high_p}) is lower than Open ({open_p}), Close ({close_p}), or Low ({low_p}).",
                timestamp=ts,
                field="high",
                record_reference=f"bar_{index}"
            ))
            is_valid = False

        if low_p > open_p or low_p > close_p:
            issues.append(ValidationIssue(
                severity=Severity.ERROR,
                code=ErrorCode.INVALID_OHLC_RELATIONSHIP,
                message=f"Low ({low_p}) is higher than Open ({open_p}) or Close ({close_p}).",
                timestamp=ts,
                field="low",
                record_reference=f"bar_{index}"
            ))
            is_valid = False

        return is_valid, issues
