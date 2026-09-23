from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import pandas as pd

MIN_CORRELATION_OBSERVATIONS = 30

class CorrelationAlignment:
    """
    Handles timestamp alignment of return series across multiple instruments.
    """

    @staticmethod
    def align_return_series(
        return_dict: Dict[str, List[Tuple[datetime, float]]],
        mode: str = "pairwise_complete"
    ) -> pd.DataFrame:
        """
        Builds aligned DataFrame where index = timestamp and columns = instrument symbols/IDs.
        """
        if not return_dict:
            return pd.DataFrame()

        # Collect data into a dictionary of pandas Series
        series_dict = {}
        for key, obs_list in return_dict.items():
            if obs_list:
                df_item = pd.DataFrame(obs_list, columns=["timestamp", key])
                df_item = df_item.drop_duplicates(subset=["timestamp"]).set_index("timestamp")
                series_dict[key] = df_item[key]
            else:
                series_dict[key] = pd.Series(dtype=float)

        df = pd.DataFrame(series_dict)
        df = df.sort_index()

        if mode == "common_intersection":
            df = df.dropna()

        return df

    @staticmethod
    def get_pairwise_aligned_observations(
        series_a: List[Tuple[datetime, float]],
        series_b: List[Tuple[datetime, float]]
    ) -> Tuple[List[datetime], List[float], List[float]]:
        """
        Inner alignment for two specific return series.
        Returns (timestamps, returns_a, returns_b) for matching timestamps.
        """
        if not series_a or not series_b:
            return [], [], []

        map_a = {ts: val for ts, val in series_a if val is not None}
        map_b = {ts: val for ts, val in series_b if val is not None}

        common_ts = sorted(list(set(map_a.keys()).intersection(set(map_b.keys()))))

        aligned_ts: List[datetime] = []
        aligned_a: List[float] = []
        aligned_b: List[float] = []

        for ts in common_ts:
            aligned_ts.append(ts)
            aligned_a.append(float(map_a[ts]))
            aligned_b.append(float(map_b[ts]))

        return aligned_ts, aligned_a, aligned_b

    @staticmethod
    def validate_minimum_observations(observation_count: int, min_required: int = MIN_CORRELATION_OBSERVATIONS) -> bool:
        return observation_count >= min_required
