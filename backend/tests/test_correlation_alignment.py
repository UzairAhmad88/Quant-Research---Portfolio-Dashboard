from datetime import datetime, timedelta
from app.analytics.correlation import CorrelationAlignment, MIN_CORRELATION_OBSERVATIONS

def test_pairwise_aligned_observations_inner_join():
    base_date = datetime(2026, 1, 1)
    # A has Days 1..5
    series_a = [(base_date + timedelta(days=i), float(i)) for i in range(5)]
    # B has Days 3..7
    series_b = [(base_date + timedelta(days=i), float(i * 2)) for i in range(2, 7)]

    ts_list, vals_a, vals_b = CorrelationAlignment.get_pairwise_aligned_observations(series_a, series_b)

    # Intersection should be Days 2, 3, 4 (indexing 0-based: days=2, 3, 4)
    assert len(ts_list) == 3
    assert len(vals_a) == 3
    assert len(vals_b) == 3

    assert ts_list[0] == base_date + timedelta(days=2)
    assert vals_a[0] == 2.0
    assert vals_b[0] == 4.0

def test_validate_minimum_observations():
    assert CorrelationAlignment.validate_minimum_observations(30) is True
    assert CorrelationAlignment.validate_minimum_observations(50) is True
    assert CorrelationAlignment.validate_minimum_observations(29) is False
    assert CorrelationAlignment.validate_minimum_observations(0) is False
