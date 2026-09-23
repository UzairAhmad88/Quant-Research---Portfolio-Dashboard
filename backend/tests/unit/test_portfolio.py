import pandas as pd
import pytest
from app.analytics.portfolio import PortfolioCalculator

def test_portfolio_weights():
    invested_w, total_w = PortfolioCalculator.calculate_weights([50.0, 50.0], total_portfolio_value=100.0)
    assert invested_w == [50.0, 50.0]
    assert total_w == [50.0, 50.0]
