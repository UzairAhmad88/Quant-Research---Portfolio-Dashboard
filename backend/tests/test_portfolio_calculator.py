import pytest
from app.analytics.portfolio import PortfolioCalculator

def test_calculate_position_value():
    assert PortfolioCalculator.calculate_position_value(100.0, 150.0) == 15000.0
    assert PortfolioCalculator.calculate_position_value(0.5, 60000.0) == 30000.0

def test_calculate_portfolio_totals():
    pos_values = [15000.0, 35000.0]
    cash = 50000.0
    invested, cash_val, total = PortfolioCalculator.calculate_portfolio_totals(pos_values, cash)
    assert invested == 50000.0
    assert cash_val == 50000.0
    assert total == 100000.0

def test_calculate_portfolio_totals_cash_floor():
    pos_values = [60000.0, 50000.0]
    cash = -10.0
    invested, cash_val, total = PortfolioCalculator.calculate_portfolio_totals(pos_values, cash)
    assert invested == 110000.0
    assert cash_val == 0.0
    assert total == 110000.0

def test_calculate_weights():
    pos_values = [30000.0, 70000.0]
    invested_w, total_w = PortfolioCalculator.calculate_weights(pos_values, total_invested=100000.0, total_portfolio=100000.0)
    assert invested_w == [0.3, 0.7]
    assert total_w == [0.3, 0.7]

def test_calculate_weights_with_cash():
    pos_values = [40000.0, 40000.0]  # Total invested: 80,000, Total portfolio: 100,000
    invested_w, total_w = PortfolioCalculator.calculate_weights(pos_values, total_invested=80000.0, total_portfolio=100000.0)
    assert invested_w == [0.5, 0.5]
    assert total_w == [0.4, 0.4]

def test_calculate_position_metrics():
    init_val, curr_val, pnl_amt, pnl_pct, contrib = PortfolioCalculator.calculate_position_metrics(
        quantity=100.0,
        entry_price=100.0,
        current_price=120.0,
        initial_portfolio_invested=20000.0,
    )
    assert init_val == 10000.0
    assert curr_val == 12000.0
    assert pnl_amt == 2000.0
    assert pnl_pct == pytest.approx(0.20)
    assert contrib == pytest.approx(0.10)  # 50% * 20% = 10%

def test_calculate_portfolio_return():
    assert PortfolioCalculator.calculate_portfolio_return(110000.0, 100000.0) == pytest.approx(0.10)
    assert PortfolioCalculator.calculate_portfolio_return(90000.0, 100000.0) == pytest.approx(-0.10)
