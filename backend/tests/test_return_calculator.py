import pytest
import math
from app.models.enums import AssetType
from app.analytics.returns import (
    ReturnCalculator,
    AnnualizationConvention,
    ReturnStatistics
)

def test_simple_returns_calculation():
    prices = [100.0, 105.0, 99.75, 100.0]
    rets = ReturnCalculator.calculate_simple_returns(prices)

    assert len(rets) == 4
    assert rets[0] is None
    assert pytest.approx(rets[1], 1e-5) == 0.05       # (105 / 100) - 1 = +5%
    assert pytest.approx(rets[2], 1e-5) == -0.05      # (99.75 / 105) - 1 = -5%
    assert pytest.approx(rets[3], abs=1e-4) == 0.002506   # (100 / 99.75) - 1



def test_log_returns_calculation():
    prices = [100.0, 110.0]
    rets = ReturnCalculator.calculate_log_returns(prices)

    assert len(rets) == 2
    assert rets[0] is None
    assert pytest.approx(rets[1], 1e-5) == math.log(1.10)

def test_cumulative_returns_compounding():
    # 100 -> 110 (+10%) -> 104.5 (-5%) -> Cumulative return should be +4.5% (0.045)
    prices = [100.0, 110.0, 104.5]
    cum_rets = ReturnCalculator.calculate_cumulative_returns(prices)

    assert len(cum_rets) == 3
    assert cum_rets[0] == 0.0
    assert pytest.approx(cum_rets[1], 1e-5) == 0.10
    assert pytest.approx(cum_rets[2], 1e-5) == 0.045

def test_period_return():
    ret = ReturnCalculator.calculate_period_return(100.0, 125.0)
    assert pytest.approx(ret, 1e-5) == 0.25

def test_annualized_return_equity_vs_crypto():
    # 253 daily bars (252 period bars) with +10% period return in 1 trading year
    cagr_equity = ReturnCalculator.calculate_annualized_return(
        period_return=0.10,
        num_bars=253,
        annualization_factor=252
    )
    assert pytest.approx(cagr_equity, 1e-4) == 0.10

    # Crypto: 366 daily bars (365 period bars) with +10% period return in 1 calendar year
    cagr_crypto = ReturnCalculator.calculate_annualized_return(
        period_return=0.10,
        num_bars=366,
        annualization_factor=365
    )
    assert pytest.approx(cagr_crypto, 1e-4) == 0.10

def test_annualization_convention_factors():
    assert AnnualizationConvention.get_annualization_factor(AssetType.EQUITY) == 252
    assert AnnualizationConvention.get_annualization_factor(AssetType.ETF) == 252
    assert AnnualizationConvention.get_annualization_factor(AssetType.INDEX) == 252
    assert AnnualizationConvention.get_annualization_factor(AssetType.CRYPTO) == 365

def test_return_statistics_summary():
    prices = [100.0, 110.0, 104.5, 115.0]
    simple_rets = ReturnCalculator.calculate_simple_returns(prices)

    stats = ReturnStatistics.calculate_summary(prices, simple_rets, annualization_factor=252)

    assert pytest.approx(stats["period_return"], 1e-5) == 0.15
    assert stats["positive_periods"] == 2 # 100->110 (+10%), 104.5->115 (+10.04%)
    assert stats["negative_periods"] == 1 # 110->104.5 (-5%)
    assert stats["annualization_factor"] == 252
    assert stats["best_period"] is not None and stats["best_period"] > 0
    assert stats["worst_period"] is not None and stats["worst_period"] < 0
