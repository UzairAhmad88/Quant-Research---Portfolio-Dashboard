import pytest
from app.analytics.portfolio import PortfolioCalculator

def test_portfolio_weights():
    invested_w, total_w = PortfolioCalculator.calculate_weights(
        holding_values=[50.0, 50.0],
        total_invested=100.0,
        total_portfolio=100.0
    )
    assert invested_w == [0.5, 0.5]
    assert total_w == [0.5, 0.5]
