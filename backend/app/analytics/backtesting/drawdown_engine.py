from datetime import datetime
from typing import List, Dict, Any, Optional
import uuid


class DrawdownEngine:
    """
    Dedicated Drawdown Analytics Engine for Backtest Results.
    Analyzes portfolio equity trajectories to compute underwater time series
    and detect discrete drawdown periods (Peak -> Trough -> Recovery / Active).
    """

    @staticmethod
    def calculate_drawdown_series(
        initial_capital: float,
        portfolio_states: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        if not portfolio_states:
            return {
                "max_drawdown": 0.0,
                "max_drawdown_duration_days": 0.0,
                "current_drawdown": 0.0,
                "current_drawdown_amount": 0.0,
                "current_status": "AT_PEAK",
                "drawdown_series": []
            }

        # Sort chronologically
        states = sorted(portfolio_states, key=lambda s: s["timestamp"])
        values = [float(s["portfolio_value"]) for s in states]
        timestamps_raw = [s["timestamp"] for s in states]

        parsed_timestamps = []
        for ts in timestamps_raw:
            if isinstance(ts, str):
                parsed_timestamps.append(datetime.fromisoformat(ts.replace("Z", "+00:00")))
            else:
                parsed_timestamps.append(ts)

        running_peak = float(initial_capital)
        max_drawdown = 0.0
        max_dd_duration_days = 0.0
        peak_ts = parsed_timestamps[0]

        drawdown_series = []

        for i in range(len(values)):
            val = values[i]
            ts_dt = parsed_timestamps[i]

            if val > running_peak:
                running_peak = val
                peak_ts = ts_dt

            dd_amount = val - running_peak
            dd_pct = (val / running_peak) - 1.0 if running_peak > 0 else 0.0

            if dd_pct < max_drawdown:
                max_drawdown = dd_pct

            if val <= running_peak:
                dur_delta = ts_dt - peak_ts
                dur_days = dur_delta.total_seconds() / 86400.0 if hasattr(dur_delta, "total_seconds") else 0.0
                if dur_days > max_dd_duration_days:
                    max_dd_duration_days = dur_days

            drawdown_series.append({
                "timestamp": ts_dt,
                "portfolio_value": val,
                "running_peak": running_peak,
                "drawdown_amount": dd_amount,
                "drawdown_percentage": dd_pct
            })

        latest_dd = drawdown_series[-1]["drawdown_percentage"] if drawdown_series else 0.0
        latest_dd_amount = drawdown_series[-1]["drawdown_amount"] if drawdown_series else 0.0
        current_status = "IN_DRAWDOWN" if latest_dd < -1e-6 else "AT_PEAK"

        return {
            "max_drawdown": float(max_drawdown),
            "max_drawdown_duration_days": float(max_dd_duration_days),
            "current_drawdown": float(latest_dd),
            "current_drawdown_amount": float(latest_dd_amount),
            "current_status": current_status,
            "drawdown_series": drawdown_series
        }

    @staticmethod
    def detect_drawdown_periods(
        initial_capital: float,
        portfolio_states: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        if not portfolio_states:
            return []

        states = sorted(portfolio_states, key=lambda s: s["timestamp"])
        values = [float(s["portfolio_value"]) for s in states]
        timestamps_raw = [s["timestamp"] for s in states]

        parsed_timestamps = []
        for ts in timestamps_raw:
            if isinstance(ts, str):
                parsed_timestamps.append(datetime.fromisoformat(ts.replace("Z", "+00:00")))
            else:
                parsed_timestamps.append(ts)

        periods = []
        peak_val = float(initial_capital)
        peak_idx = 0
        trough_val = float(initial_capital)
        trough_idx = 0
        in_drawdown = False

        for i in range(len(values)):
            v = values[i]
            ts = parsed_timestamps[i]

            if v > peak_val + 1e-12:
                if in_drawdown:
                    # Period recovered!
                    dur_delta = ts - parsed_timestamps[peak_idx]
                    dur_days = dur_delta.total_seconds() / 86400.0 if hasattr(dur_delta, "total_seconds") else 0.0
                    
                    rec_delta = ts - parsed_timestamps[trough_idx]
                    rec_days = rec_delta.total_seconds() / 86400.0 if hasattr(rec_delta, "total_seconds") else 0.0

                    dd_amt = trough_val - peak_val
                    dd_pct = (trough_val / peak_val) - 1.0 if peak_val > 0 else 0.0

                    periods.append({
                        "id": str(uuid.uuid4()),
                        "peak_timestamp": parsed_timestamps[peak_idx],
                        "trough_timestamp": parsed_timestamps[trough_idx],
                        "recovery_timestamp": ts,
                        "peak_equity": peak_val,
                        "trough_equity": trough_val,
                        "drawdown_amount": dd_amt,
                        "drawdown_percentage": dd_pct,
                        "duration_days": dur_days,
                        "recovery_duration_days": rec_days,
                        "status": "RECOVERED"
                    })
                    in_drawdown = False

                peak_val = v
                peak_idx = i

            elif v < peak_val - 1e-12:
                if not in_drawdown:
                    in_drawdown = True
                    trough_val = v
                    trough_idx = i
                else:
                    if v < trough_val:
                        trough_val = v
                        trough_idx = i

        # Handle unrecovered drawdown active at simulation boundary
        if in_drawdown:
            end_ts = parsed_timestamps[-1]
            dur_delta = end_ts - parsed_timestamps[peak_idx]
            dur_days = dur_delta.total_seconds() / 86400.0 if hasattr(dur_delta, "total_seconds") else 0.0

            dd_amt = trough_val - peak_val
            dd_pct = (trough_val / peak_val) - 1.0 if peak_val > 0 else 0.0

            periods.append({
                "id": str(uuid.uuid4()),
                "peak_timestamp": parsed_timestamps[peak_idx],
                "trough_timestamp": parsed_timestamps[trough_idx],
                "recovery_timestamp": None,
                "peak_equity": peak_val,
                "trough_equity": trough_val,
                "drawdown_amount": dd_amt,
                "drawdown_percentage": dd_pct,
                "duration_days": dur_days,
                "recovery_duration_days": None,
                "status": "ACTIVE"
            })

        # Sort drawdown periods by drawdown depth (most severe first)
        periods.sort(key=lambda p: p["drawdown_percentage"])
        return periods
