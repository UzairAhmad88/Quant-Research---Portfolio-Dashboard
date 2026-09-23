from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Tuple, Optional
from app.validators.quality import ValidationIssue, Severity, ErrorCode

class TimestampValidator:
    """
    Validates UTC timestamp structure, sanity bounds, and chronological sequence ordering.
    """
    def __init__(self, max_future_minutes: int = 1440):
        self.max_future_minutes = max_future_minutes

    def normalize_utc(self, dt: Any) -> Tuple[bool, Optional[datetime], List[ValidationIssue]]:
        issues: List[ValidationIssue] = []
        if not isinstance(dt, datetime):
            issues.append(ValidationIssue(
                severity=Severity.ERROR,
                code=ErrorCode.INVALID_TIMESTAMP,
                message=f"Timestamp '{dt}' is not a valid datetime object."
            ))
            return False, None, issues

        # Convert to UTC aware datetime
        if dt.tzinfo is None:
            utc_dt = dt.replace(tzinfo=timezone.utc)
        else:
            utc_dt = dt.astimezone(timezone.utc)

        # Sanity check: Future timestamps beyond threshold
        now_utc = datetime.now(timezone.utc)
        if utc_dt > now_utc + timedelta(minutes=self.max_future_minutes):
            issues.append(ValidationIssue(
                severity=Severity.WARNING,
                code=ErrorCode.INVALID_TIMESTAMP,
                message=f"Timestamp {utc_dt.isoformat()} is in the future relative to current time {now_utc.isoformat()}.",
                timestamp=utc_dt
            ))

        return True, utc_dt, issues

    def validate_chronological_order(self, bars: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[ValidationIssue]]:
        issues: List[ValidationIssue] = []
        if len(bars) <= 1:
            return bars, issues

        is_out_of_order = False
        for i in range(1, len(bars)):
            prev_ts = bars[i - 1].get("timestamp")
            curr_ts = bars[i].get("timestamp")
            if isinstance(prev_ts, datetime) and isinstance(curr_ts, datetime):
                if curr_ts <= prev_ts:
                    is_out_of_order = True
                    issues.append(ValidationIssue(
                        severity=Severity.WARNING,
                        code=ErrorCode.OUT_OF_ORDER_TIMESTAMP,
                        message=f"Chronological sequence violation: Bar {i} ({curr_ts}) is not strictly after Bar {i-1} ({prev_ts}).",
                        timestamp=curr_ts,
                        record_reference=f"bar_{i}"
                    ))

        if is_out_of_order:
            # Safely sort chronologically
            sorted_bars = sorted(bars, key=lambda x: x.get("timestamp") if isinstance(x.get("timestamp"), datetime) else datetime.min.replace(tzinfo=timezone.utc))
            return sorted_bars, issues

        return bars, issues
