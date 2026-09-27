from datetime import datetime, date, timezone, timedelta
from typing import Optional, List
from app.models.enums import AssetType, DataFrequency, DataFreshness
from app.validators.gaps import CalendarFactory

class FreshnessPolicy:
    """
    Evaluates market-data observation freshness with market calendar awareness.
    Distinguishes between latest available data and stale data without
    false alarms during weekends, holidays, or off-market hours.
    """

    @staticmethod
    def get_latest_expected_trading_days(
        asset_type: AssetType,
        as_of_date: date,
        count: int = 5
    ) -> List[date]:
        """
        Returns the last `count` expected trading dates on or prior to `as_of_date`.
        """
        calendar = CalendarFactory.get_calendar(asset_type)
        days: List[date] = []
        curr = as_of_date
        while len(days) < count:
            if calendar.is_expected_trading_day(curr):
                days.append(curr)
            curr -= timedelta(days=1)
        return days

    @classmethod
    def evaluate_freshness(
        cls,
        observation_timestamp: Optional[datetime],
        asset_type: AssetType = AssetType.EQUITY,
        frequency: DataFrequency = DataFrequency.DAILY,
        as_of: Optional[datetime] = None
    ) -> DataFreshness:
        """
        Determines the DataFreshness status of a market observation.
        """
        if observation_timestamp is None:
            return DataFreshness.UNAVAILABLE

        now_utc = as_of or datetime.now(timezone.utc)
        if now_utc.tzinfo is None:
            now_utc = now_utc.replace(tzinfo=timezone.utc)

        obs_utc = observation_timestamp
        if obs_utc.tzinfo is None:
            obs_utc = obs_utc.replace(tzinfo=timezone.utc)

        # Future observation anomaly
        if obs_utc.date() > (now_utc + timedelta(days=1)).date():
            return DataFreshness.UNKNOWN

        if frequency == DataFrequency.DAILY:
            expected_days = cls.get_latest_expected_trading_days(asset_type, now_utc.date(), count=4)
            t0 = expected_days[0]  # Latest expected trading day <= today
            t_minus_1 = expected_days[1] if len(expected_days) > 1 else None
            t_minus_2 = expected_days[2] if len(expected_days) > 2 else None

            obs_date = obs_utc.date()

            if obs_date >= t0:
                return DataFreshness.CURRENT

            if t_minus_1 and obs_date == t_minus_1:
                # If today is a trading day and market has not closed / settled yet (< 22:00 UTC),
                # yesterday's close is still the authoritative latest completed session.
                if t0 == now_utc.date() and now_utc.hour < 22:
                    return DataFreshness.CURRENT
                return DataFreshness.RECENT

            if t_minus_2 and obs_date == t_minus_2:
                return DataFreshness.RECENT

            return DataFreshness.STALE

        # Future frequency handling (e.g. HOURLY, MINUTE)
        elapsed_hours = (now_utc - obs_utc).total_seconds() / 3600.0
        if elapsed_hours < 2.0:
            return DataFreshness.CURRENT
        elif elapsed_hours < 24.0:
            return DataFreshness.RECENT
        else:
            return DataFreshness.STALE
