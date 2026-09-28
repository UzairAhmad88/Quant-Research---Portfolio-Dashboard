import pytest
import pandas as pd
import numpy as np
from app.analytics.features.feature_engine import FeatureEngine
from app.analytics.risk.risk_engine import RiskEngine
from app.analytics.regime.regime_engine import MarketRegimeEngine
from app.analytics.backtesting.monte_carlo import MonteCarloEngine
from app.analytics.strategies.parameter_lab import ParameterLabEngine
from app.analytics.learning.glossary import GLOSSARY_CATALOG


@pytest.fixture
def sample_price_df():
    np.random.seed(42)
    returns = np.random.normal(0.001, 0.015, 100)
    prices = 100 * np.cumprod(1 + returns)
    dates = pd.date_range(start="2026-01-01", periods=100, freq="D")
    return pd.DataFrame({
        "open": prices * 0.995,
        "high": prices * 1.01,
        "low": prices * 0.99,
        "close": prices,
        "volume": np.random.randint(1000, 5000, 100),
    }, index=dates)


def test_feature_engine_compute_all(sample_price_df):
    featured = FeatureEngine.compute_all_features(sample_price_df)
    assert "rsi_14" in featured.columns
    assert "sma_20" in featured.columns
    assert "volatility_20" in featured.columns
    assert "bb_pct_b" in featured.columns
    valid_rsi = featured["rsi_14"].dropna()
    assert (valid_rsi >= 0).all() and (valid_rsi <= 100).all()


def test_feature_engine_exploration(sample_price_df):
    res = FeatureEngine.explore_feature(sample_price_df, "rsi_14", window=14)
    assert "statistics" in res
    assert "mean" in res["statistics"]
    assert "distribution" in res
    assert "forward_return_correlation" in res["statistics"]


def test_risk_engine_metrics(sample_price_df):
    returns = sample_price_df["close"].pct_change().dropna()
    benchmark_returns = returns * 0.8 + np.random.normal(0, 0.005, len(returns))
    
    res = RiskEngine.calculate_portfolio_risk(
        returns=returns,
        benchmark_returns=benchmark_returns,
        confidence_level=0.95,
        portfolio_value=1_000_000.0,
    )
    
    assert res["var"]["historical_dollars"] > 0
    assert res["var"]["parametric_dollars"] > 0
    assert "sharpe_ratio" in res["ratios"]
    assert "beta" in res["benchmark_analytics"]


def test_regime_engine_detection(sample_price_df):
    res = MarketRegimeEngine.detect_regimes_rule_based(sample_price_df, sma_fast=10, sma_slow=30, vol_lookback=10)
    assert "regime_summary" in res
    assert len(res["time_series"]) > 0


def test_monte_carlo_simulation(sample_price_df):
    returns = sample_price_df["close"].pct_change().dropna().tolist()
    res = MonteCarloEngine.run_simulation(
        returns=returns,
        initial_capital=100_000.0,
        simulations_count=200,
        horizon_periods=30,
        random_seed=42,
    )
    assert res["simulation_count"] == 200
    assert res["terminal_value"]["p5_worst_case"] <= res["terminal_value"]["p95_best_case"]
    assert len(res["confidence_curves"]) > 0


def test_parameter_lab_sweep(sample_price_df):
    res = ParameterLabEngine.run_sma_parameter_sweep(
        df=sample_price_df,
        fast_range=[5, 10],
        slow_range=[20, 30],
        initial_capital=100_000.0,
    )
    assert res["tested_combinations_count"] == 4
    assert res["best_combination"]["fast_window"] in [5, 10]


def test_glossary_catalog():
    assert "sharpe_ratio" in GLOSSARY_CATALOG
    assert "sortino_ratio" in GLOSSARY_CATALOG
    assert "value_at_risk" in GLOSSARY_CATALOG
    assert "formula" in GLOSSARY_CATALOG["sharpe_ratio"]
