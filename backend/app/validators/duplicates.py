from typing import Dict, Any, List, Set, Tuple
from datetime import datetime
from app.validators.quality import ValidationIssue, Severity, ErrorCode

class DuplicateValidator:
    """
    Detects and filters duplicate observations within an ingestion payload
    or against existing stored database timestamps.
    """
    def find_duplicates(
        self,
        bars: List[Dict[str, Any]],
        existing_timestamps: Set[datetime]
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[ValidationIssue]]:
        """
        Returns (unique_bars, duplicate_bars, issues)
        """
        unique_bars: List[Dict[str, Any]] = []
        duplicate_bars: List[Dict[str, Any]] = []
        issues: List[ValidationIssue] = []

        seen_in_batch: Set[datetime] = set()

        for idx, bar in enumerate(bars):
            ts = bar.get("timestamp")
            if not isinstance(ts, datetime):
                unique_bars.append(bar)
                continue

            if ts in existing_timestamps or ts in seen_in_batch:
                duplicate_bars.append(bar)
                issues.append(ValidationIssue(
                    severity=Severity.INFO,
                    code=ErrorCode.DUPLICATE_RECORD,
                    message=f"Duplicate observation detected for timestamp '{ts.isoformat()}'. Filtered out.",
                    timestamp=ts,
                    record_reference=f"bar_{idx}"
                ))
            else:
                seen_in_batch.add(ts)
                unique_bars.append(bar)

        return unique_bars, duplicate_bars, issues
