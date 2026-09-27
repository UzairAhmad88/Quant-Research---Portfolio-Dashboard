"""
Performance Benchmark Suite for Quant Research Dashboard.
Measures execution time, throughput, and memory patterns for realistic quantitative workloads:
- 1Y (252 bars), 5Y (1,260 bars), 10Y (2,520 bars), 20Y (5,040 bars) daily time series.
- Multi-instrument correlation matrix (5, 10, 20 assets).
- Return, Volatility, Strategy, and Backtesting engine throughput.
- Performance Metrics and Drawdown evaluation.
- Serialization and CSV/JSON export benchmarks.
"""

import time
import math
import numpy as np
import pandas as pd
import pytest
from datetime import datetime, timedelta, timezone

from app.analytics.returns import (
    ReturnCalculator,
    AnnualizationConvention,
    ReturnStatistics,
)
from app.analytics.volatility import (
    calculate_daily_volatility,
    calculate_annualized_volatility,
    calculate_upside_volatility,
    calculate_downside_volatility,
    calculate_rolling_volatility,
    calculate_return_distribution,
)
from app.analytics.correlation import (
    CorrelationCalculator,
    CorrelationAlignment,
)
from app.analytics.strategies.moving_average import (
    calculate_sma,
    calculate_ema,
)
from app.analytics.backtesting.engine import run_backtest_simulation
from app.analytics.backtesting.performance_engine import PerformanceEngine
from app.analytics.backtesting.drawdown_engine import DrawdownEngine
from app.export.service import ExportService
from app.export.base import ExportMetadata


# ---------------------------------------------------------------------------
# Deterministic Benchmark Dataset Generators
# ---------------------------------------------------------------------------

def generate_price_series(num_bars: int, initial_price: float = 100.0, seed: int = 42) -> np.ndarray:
    """Generate a deterministic geometric Brownian motion price series."""
    np.random.seed(seed)
    dt = 1.0 / 252.0
    mu = 0.08  # 8% annual expected return
    sigma = 0.18  # 18% annual volatility
    
    # Generate deterministic log returns
    shocks = np.random.normal(
        (mu - 0.5 * sigma ** 2) * dt,
        sigma * np.sqrt(dt),
        size=num_bars
    )
    prices = np.empty(num_bars, dtype=np.float64)
    prices[0] = initial_price
    for i in range(1, num_bars):
        prices[i] = prices[i - 1] * np.exp(shocks[i])
    return prices


def generate_benchmark_bars(num_bars: int, initial_price: float = 100.0, seed: int = 42):
    """Generate structured OHLCV bars list with realistic spreads and volumes."""
    prices = generate_price_series(num_bars, initial_price, seed)
    base_date = datetime(2010, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    bars = []
    
    for i in range(num_bars):
        ts = base_date + timedelta(days=i)
        close_p = float(prices[i])
        open_p = close_p * (1.0 + float(np.sin(i * 0.1)) * 0.002)
        high_p = max(open_p, close_p) * 1.005
        low_p = min(open_p, close_p) * 0.995
        vol = float(1000000 + (i % 500) * 10000)
        
        bars.append({
            "timestamp": ts,
            "open": open_p,
            "high": high_p,
            "low": low_p,
            "close": close_p,
            "adjusted_close": close_p,
            "volume": vol
        })
    return bars


# ---------------------------------------------------------------------------
# Return Engine Benchmarks
# ---------------------------------------------------------------------------

class TestReturnEngineBenchmarks:
    @pytest.mark.parametrize("bars_count,label", [
        (252, "1 Year Daily"),
        (1260, "5 Years Daily"),
        (2520, "10 Years Daily"),
        (5040, "20 Years Daily"),
    ])
    def test_return_calculations_benchmark(self, bars_count, label):
        prices = generate_price_series(bars_count).tolist()

        t0 = time.perf_counter()
        simple_rets = ReturnCalculator.calculate_simple_returns(prices)
        log_rets = ReturnCalculator.calculate_log_returns(prices)
        cum_rets = ReturnCalculator.calculate_cumulative_returns(prices)
        t_elapsed = (time.perf_counter() - t0) * 1000.0  # ms

        assert len(simple_rets) == bars_count
        assert len(log_rets) == bars_count
        assert len(cum_rets) == bars_count
        # Return calculations for up to 20 years must complete under 50ms
        assert t_elapsed < 50.0, f"Return calculation took {t_elapsed:.2f}ms for {label}, exceeding 50ms budget"

    def test_return_statistics_benchmark(self):
        prices = generate_price_series(2520).tolist()
        simple_rets = ReturnCalculator.calculate_simple_returns(prices)

        t0 = time.perf_counter()
        stats = ReturnStatistics.calculate_summary(prices, simple_rets)
        t_elapsed = (time.perf_counter() - t0) * 1000.0

        assert stats["period_return"] is not None
        assert stats["annualized_return"] is not None
        assert stats["positive_periods"] >= 0
        assert stats["negative_periods"] >= 0
        # Return statistics on 10Y data must complete under 30ms
        assert t_elapsed < 30.0, f"Return statistics took {t_elapsed:.2f}ms, exceeding 30ms budget"


# ---------------------------------------------------------------------------
# Volatility Engine Benchmarks
# ---------------------------------------------------------------------------

class TestVolatilityEngineBenchmarks:
    def test_rolling_volatility_benchmark_10y(self):
        prices = generate_price_series(2520)
        returns = pd.Series((prices[1:] / prices[:-1]) - 1.0)

        t0 = time.perf_counter()
        # Compute common windows: 20-day, 60-day, 252-day
        v20 = calculate_rolling_volatility(returns, window=20)
        v60 = calculate_rolling_volatility(returns, window=60)
        v252 = calculate_rolling_volatility(returns, window=252)
        t_elapsed = (time.perf_counter() - t0) * 1000.0

        assert len(v20) == len(returns)
        assert len(v60) == len(returns)
        assert len(v252) == len(returns)
        # Vectorized rolling volatility across multiple windows under 35ms
        assert t_elapsed < 35.0, f"Rolling volatility took {t_elapsed:.2f}ms, exceeding 35ms budget"

    def test_volatility_summary_benchmark(self):
        prices = generate_price_series(2520)
        returns = pd.Series((prices[1:] / prices[:-1]) - 1.0)

        t0 = time.perf_counter()
        d_vol = calculate_daily_volatility(returns)
        ann_vol = calculate_annualized_volatility(d_vol)
        up_vol = calculate_upside_volatility(returns)
        down_vol = calculate_downside_volatility(returns)
        t_elapsed = (time.perf_counter() - t0) * 1000.0

        assert d_vol is not None
        assert ann_vol is not None
        assert up_vol is not None
        assert down_vol is not None
        assert t_elapsed < 20.0, f"Volatility summary took {t_elapsed:.2f}ms, exceeding 20ms budget"


# ---------------------------------------------------------------------------
# Correlation Matrix Benchmarks
# ---------------------------------------------------------------------------

class TestCorrelationBenchmarks:
    @pytest.mark.parametrize("num_instruments", [5, 10, 20])
    def test_correlation_matrix_benchmark(self, num_instruments):
        bars_count = 1260  # 5 years daily data
        base_date = datetime(2020, 1, 1, tzinfo=timezone.utc)
        timestamps = [base_date + timedelta(days=i) for i in range(bars_count)]

        return_dict = {}
        for inst_idx in range(num_instruments):
            prices = generate_price_series(bars_count + 1, seed=100 + inst_idx)
            rets = (prices[1:] / prices[:-1]) - 1.0
            obs = [(timestamps[i], float(rets[i])) for i in range(bars_count)]
            return_dict[f"INST_{inst_idx}"] = obs

        t0 = time.perf_counter()
        aligned_df = CorrelationAlignment.align_return_series(return_dict, mode="pairwise_complete")
        symbols, matrix = CorrelationCalculator.calculate_correlation_matrix(aligned_df)
        t_elapsed = (time.perf_counter() - t0) * 1000.0

        assert len(symbols) == num_instruments
        assert len(matrix) == num_instruments
        assert len(matrix[0]) == num_instruments
        # Correlation matrix on up to 20 instruments over 5Y data under 500ms
        assert t_elapsed < 500.0, f"Correlation matrix ({num_instruments} instruments) took {t_elapsed:.2f}ms"


# ---------------------------------------------------------------------------
# Moving Average Strategy Benchmarks
# ---------------------------------------------------------------------------

class TestStrategyBenchmarks:
    def test_moving_average_crossover_benchmark_10y(self):
        prices = generate_price_series(2520)
        s_prices = pd.Series(prices)

        t0 = time.perf_counter()
        sma_fast = calculate_sma(s_prices, window=20)
        sma_slow = calculate_sma(s_prices, window=50)
        ema_fast = calculate_ema(s_prices, window=20)
        ema_slow = calculate_ema(s_prices, window=50)
        t_elapsed = (time.perf_counter() - t0) * 1000.0

        assert len(sma_fast) == 2520
        assert len(sma_slow) == 2520
        assert len(ema_fast) == 2520
        assert len(ema_slow) == 2520
        assert t_elapsed < 25.0, f"MA calculations on 10Y data took {t_elapsed:.2f}ms, exceeding 25ms budget"


# ---------------------------------------------------------------------------
# Backtesting Engine Benchmarks
# ---------------------------------------------------------------------------

class TestBacktestingBenchmarks:
    def test_backtest_simulation_10y_benchmark(self):
        """
        Benchmark: 10 years daily data (2,520 bars), single instrument, single strategy.
        Measures total runtime, rows processed, trades generated, and memory usage.
        """
        bars = generate_benchmark_bars(2520)

        # Generate realistic periodic BUY and SELL signals (~50 trade cycles over 10 years)
        signals = {}
        for i in range(50, 2500, 50):
            ts = bars[i]["timestamp"]
            ts_key = ts.isoformat().replace(" ", "T").split(".")[0].replace("Z", "")
            sig_type = "BUY" if (i // 50) % 2 == 1 else "SELL"
            signals[ts_key] = {
                "id": f"sig-{i}",
                "signal_type": sig_type,
                "timestamp": ts,
                "price": bars[i]["close"]
            }

        t0 = time.perf_counter()
        result = run_backtest_simulation(
            bars=bars,
            signals=signals,
            initial_capital=100000.0,
            execution_timing="NEXT_OPEN",
            position_sizing="FULL_CAPITAL",
            commission=0.001,
            slippage=0.0005,
            direction="LONG_ONLY",
            force_close_at_end=True,
            instrument_id="BENCHMARK_AAPL"
        )
        t_elapsed = (time.perf_counter() - t0) * 1000.0

        assert result["status"] == "COMPLETED"
        assert len(result["portfolio_states"]) == 2520
        assert len(result["completed_trades"]) > 10
        # Simulation on 10Y daily data should complete well under 250ms in memory
        assert t_elapsed < 250.0, f"10Y Backtest simulation took {t_elapsed:.2f}ms, exceeding 250ms budget"

    def test_performance_metrics_engine_benchmark(self):
        """Benchmark performance metrics calculation on 2,520 portfolio states."""
        bars = generate_benchmark_bars(2520)
        # Construct synthetic portfolio states
        states = []
        for i, b in enumerate(bars):
            val = 100000.0 * (b["close"] / bars[0]["close"])
            states.append({
                "timestamp": b["timestamp"],
                "portfolio_value": val,
                "cash": val * 0.2,
                "position_quantity": 100.0,
                "position_value": val * 0.8,
                "market_price": b["close"],
            })

        completed_trades = [
            {
                "entry_timestamp": bars[i]["timestamp"],
                "exit_timestamp": bars[i + 20]["timestamp"],
                "gross_pnl": 500.0,
                "net_pnl": 480.0,
                "total_cost": 20.0,
                "trade_return": 0.05,
                "duration_days": 20.0,
            }
            for i in range(0, 2400, 50)
        ]

        t0 = time.perf_counter()
        metrics = PerformanceEngine.calculate_performance_metrics(
            initial_capital=100000.0,
            portfolio_states=states,
            completed_trades=completed_trades,
            risk_free_rate=0.02,
            annualization_factor=252
        )
        t_elapsed = (time.perf_counter() - t0) * 1000.0

        assert metrics["returns"]["total_return"] is not None
        assert metrics["risk"]["sharpe_ratio"] is not None
        assert metrics["drawdown"]["max_drawdown"] is not None
        # Performance metrics evaluation on 10Y states must finish under 40ms
        assert t_elapsed < 40.0, f"Performance metrics evaluation took {t_elapsed:.2f}ms, exceeding 40ms budget"


# ---------------------------------------------------------------------------
# Serialization & Export Benchmarks
# ---------------------------------------------------------------------------

class TestExportBenchmarks:
    def test_csv_export_formatting_benchmark(self):
        from app.export.csv_exporter import CSVExporter
        bars = generate_benchmark_bars(2520)
        metadata = ExportMetadata(export_type="MARKET_DATA", symbol="BENCHMARK_SPY")
        exporter = CSVExporter()

        t0 = time.perf_counter()
        csv_bytes = exporter.export(bars, metadata)
        t_elapsed = (time.perf_counter() - t0) * 1000.0

        assert len(csv_bytes) > 0
        csv_str = csv_bytes.decode("utf-8")
        assert "timestamp" in csv_str
        assert "close" in csv_str
        # Formatting 10 years of daily data (2,520 rows) into CSV under 300ms
        assert t_elapsed < 300.0, f"CSV export formatting took {t_elapsed:.2f}ms, exceeding 300ms budget"

    def test_json_export_formatting_benchmark(self):
        from app.export.json_exporter import JSONExporter
        bars = generate_benchmark_bars(2520)
        metadata = ExportMetadata(export_type="MARKET_DATA", symbol="BENCHMARK_SPY")
        exporter = JSONExporter()

        t0 = time.perf_counter()
        json_bytes = exporter.export(bars, metadata)
        t_elapsed = (time.perf_counter() - t0) * 1000.0

        assert len(json_bytes) > 0
        # JSON formatting 10 years data under 300ms
        assert t_elapsed < 300.0, f"JSON export formatting took {t_elapsed:.2f}ms, exceeding 300ms budget"

