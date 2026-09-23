from datetime import datetime, date, timedelta, timezone
from typing import List, Dict, Any, Set, Tuple, Optional
from abc import ABC, abstractmethod
from app.models.enums import AssetType
from app.validators.quality import ValidationIssue, Severity, ErrorCode

class MarketCalendar(ABC):
    """
    Abstract market calendar interface for session coverage and missing day detection.
    """
    @abstractmethod
    def is_expected_trading_day(self, dt: date) -> bool:
        pass

    def get_expected_trading_days(self, start_date: date, end_date: date) -> List[date]:
        expected: List[date] = []
        curr = start_date
        while curr <= end_date:
            if self.is_expected_trading_day(curr):
                expected.append(curr)
            curr += timedelta(days=1)
        return expected


class EquityCalendar(MarketCalendar):
    """
    Equity & ETF market calendar (excludes Saturday & Sunday).
    """
    def is_expected_trading_day(self, dt: date) -> bool:
        # ISO weekday: 1=Mon, 6=Sat, 7=Sun
        return dt.isoweekday() not in (6, 7)


class CryptoCalendar(MarketCalendar):
    """
    Cryptocurrency continuous market calendar (24/7/365 trading).
    """
    def is_expected_trading_day(self, dt: date) -> bool:
        return True


class CalendarFactory:
    @staticmethod
    def get_calendar(asset_type: AssetType) -> MarketCalendar:
        if asset_type == AssetType.CRYPTO:
            return CryptoCalendar()
        # Default to Equity/ETF calendar for Equity, ETF, Index
        return EquityCalendar()


class GapValidator:
    """
    Analyzes historical bar timestamps against expected market calendars to detect missing sessions.
    Does NOT generate synthetic/fabricated data.
    """
    def detect_missing_sessions(
        self,
        bars: List[Dict[str, Any]],
        asset_type: AssetType,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Tuple[List[date], List[ValidationIssue]]:
        issues: List[ValidationIssue] = []
        missing_dates: List[date] = []

        if not bars:
            return missing_dates, issues

        # Collect distinct dates present in observations
        present_dates: Set[date] = set()
        for b in bars:
            ts = b.get("timestamp")
            if isinstance(ts, datetime):
                present_dates.add(ts.date())

        if not present_dates:
            return missing_dates, issues

        calendar = CalendarFactory.get_calendar(asset_type)

        range_start = start_date.date() if start_date else min(present_dates)
        range_end = end_date.date() if end_date else max(present_dates)

        expected_days = calendar.get_expected_trading_days(range_start, range_end)

        for expected in expected_days:
            if expected not in present_dates:
                missing_dates.append(expected)
                dt_utc = datetime(expected.year, expected.month, expected.day, tzinfo=timezone.utc)
                issues.append(ValidationIssue(
                    severity=Severity.WARNING,
                    code=ErrorCode.POTENTIAL_MISSING_SESSION,
                    message=f"Missing trading session detected for date '{expected.isoformat()}'.",
                    timestamp=dt_utc,
                    field="timestamp"
                ))

        return missing_dates, issues
