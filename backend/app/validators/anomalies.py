from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional
import math
from app.models.enums import AssetType
from app.validators.quality import ValidationIssue, Severity, ErrorCode

class AnomalyValidator:
    """
    Lightweight heuristic anomaly validator for market data series.
    Distinguishes WARNING (unusual but potentially real) from hard errors.
    """
    def __init__(
        self,
        price_jump_threshold_pct: float = 20.0,
        volume_spike_multiplier: float = 10.0
    ):
        self.price_jump_threshold_pct = price_jump_threshold_pct
        self.volume_spike_multiplier = volume_spike_multiplier

    def detect_anomalies(
        self,
        bars: List[Dict[str, Any]],
        asset_type: AssetType = AssetType.EQUITY
    ) -> List[ValidationIssue]:
        issues: List[ValidationIssue] = []
        if len(bars) == 0:
            return issues

        volumes: List[float] = []

        for i, bar in enumerate(bars):
            ts = bar.get("timestamp") if isinstance(bar.get("timestamp"), datetime) else None
            close_p = bar.get("close")
            open_p = bar.get("open")
            vol = bar.get("volume", 0.0)

            # 1. Zero volume warning for equities/ETFs
            if asset_type in (AssetType.EQUITY, AssetType.ETF) and vol == 0:
                issues.append(ValidationIssue(
                    severity=Severity.INFO,
                    code=ErrorCode.ZERO_VOLUME_EQUITY,
                    message=f"Zero volume recorded on equity observation for date '{ts}'.",
                    timestamp=ts,
                    field="volume",
                    record_reference=f"bar_{i}"
                ))

            # Collect valid positive volumes for rolling stats
            if isinstance(vol, (int, float)) and vol > 0:
                volumes.append(float(vol))

            # 2. Intra-bar anomaly (Open vs Close extreme move)
            if open_p and close_p and open_p > 0:
                intra_change_pct = abs(close_p - open_p) / open_p * 100.0
                if intra_change_pct > self.price_jump_threshold_pct * 1.5:
                    issues.append(ValidationIssue(
                        severity=Severity.WARNING,
                        code=ErrorCode.SUSPICIOUS_PRICE_JUMP,
                        message=f"Extreme intra-bar price move of {intra_change_pct:.2f}% (Open={open_p}, Close={close_p}).",
                        timestamp=ts,
                        field="close",
                        record_reference=f"bar_{i}"
                    ))

            # 3. Inter-bar price jump anomaly
            if i > 0:
                prev_close = bars[i - 1].get("close")
                if prev_close and prev_close > 0 and close_p:
                    change_pct = abs(close_p - prev_close) / prev_close * 100.0
                    if change_pct > self.price_jump_threshold_pct:
                        issues.append(ValidationIssue(
                            severity=Severity.WARNING,
                            code=ErrorCode.SUSPICIOUS_PRICE_JUMP,
                            message=f"Large single-day price movement of {change_pct:.2f}% (Prev Close={prev_close}, Close={close_p}).",
                            timestamp=ts,
                            field="close",
                            record_reference=f"bar_{i}"
                        ))

                # 4. Repeated identical bar check
                if (bar.get("open") == bars[i - 1].get("open") and
                    bar.get("high") == bars[i - 1].get("high") and
                    bar.get("low") == bars[i - 1].get("low") and
                    bar.get("close") == bars[i - 1].get("close") and
                    bar.get("volume") == bars[i - 1].get("volume")):
                    issues.append(ValidationIssue(
                        severity=Severity.WARNING,
                        code=ErrorCode.REPEATED_IDENTICAL_BAR,
                        message=f"Bar {i} has identical OHLCV values to bar {i-1}.",
                        timestamp=ts,
                        record_reference=f"bar_{i}"
                    ))

        # 5. Volume spike anomaly vs rolling median
        if len(volumes) >= 5:
            sorted_vols = sorted(volumes)
            median_vol = sorted_vols[len(sorted_vols) // 2]
            if median_vol > 0:
                for i, bar in enumerate(bars):
                    vol = bar.get("volume", 0.0)
                    ts = bar.get("timestamp") if isinstance(bar.get("timestamp"), datetime) else None
                    if vol > median_vol * self.volume_spike_multiplier:
                        issues.append(ValidationIssue(
                            severity=Severity.WARNING,
                            code=ErrorCode.SUSPICIOUS_VOLUME_SPIKE,
                            message=f"Volume spike of {vol:,.0f} is >{self.volume_spike_multiplier}x median volume ({median_vol:,.0f}).",
                            timestamp=ts,
                            field="volume",
                            record_reference=f"bar_{i}"
                        ))

        return issues
