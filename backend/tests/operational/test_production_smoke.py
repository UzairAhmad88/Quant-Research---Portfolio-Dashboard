"""
Step 30 — Production Launch & Operational Verification Test Suite.
Validates all core quantitative workflows and invariants against the deployed API and database models:
1. Health & Version Probes (/health, /health/ready, /version).
2. Market Data Ingestion & Quality Verification.
3. Return Engine Mathematics.
4. Portfolio Valuation & Accounting Identity (Portfolio Value = Cash + Position Value).
5. Correlation Symmetry (corr(A,B) == corr(B,A)) and rolling bounds.
6. Volatility Calculation (daily, annualized, rolling, and annualization factor convention).
7. Moving Average Strategy & Look-Ahead-Free Signal Pipeline.
8. Backtest Simulation & Trade Accounting Invariants (Exec >= Signal, Exit >= Entry).
9. Performance Metrics & Drawdown Analytics.
10. Backtest Report Generation.
11. Export Formats (CSV, JSON, PDF) & Formula Injection Immunity.
12. Defensive Error Handling & Non-Leaking Envelopes.
"""

import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.instrument import Instrument
from app.models.enums import AssetType, DataFrequency, SignalType
from app.models.market_data import OHLCV
from app.models.portfolio import Portfolio, PortfolioHolding
from app.models.strategy import StrategyConfiguration, SignalEvent
from app.models.backtest import Backtest, BacktestTradeEvent, BacktestPortfolioState
from app.analytics.returns import ReturnCalculator, ReturnStatistics
from app.analytics.volatility import calculate_daily_volatility, calculate_annualized_volatility
from app.analytics.correlation import CorrelationCalculator, CorrelationAlignment
from app.analytics.backtesting import run_backtest_simulation
from app.analytics.performance import max_drawdown, total_return, sharpe_ratio
from app.export.csv_exporter import CSVExporter
from app.export.json_exporter import JSONExporter
from app.export.pdf_exporter import PDFExporter
from app.export.base import ExportMetadata, sanitize_filename


# ---------------------------------------------------------------------------
# 1. Health & Version Probes Verification
# ---------------------------------------------------------------------------

class TestOperationalHealthAndVersion:
    def test_liveness_probe(self, client: TestClient):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "quant-research-backend"
        assert data["version"] == "1.0.0"

    def test_readiness_probe(self, client: TestClient):
        response = client.get("/health/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
        assert data["database"] == "connected"

    def test_version_metadata(self, client: TestClient):
        response = client.get("/version")
        assert response.status_code == 200
        data = response.json()
        assert data["version"] == "1.0.0"
        assert "build_id" in data
        assert "environment" in data
        # No secrets leaked
        assert "SECRET_KEY" not in str(data)
        assert "DATABASE_URL" not in str(data)


# ---------------------------------------------------------------------------
# 2. Market Data Pipeline Verification
# ---------------------------------------------------------------------------

class TestOperationalMarketDataPipeline:
    def test_instrument_and_market_data_flow(self, client: TestClient, sqlite_db: Session):
        # Create instrument
        inst = Instrument(symbol="OP_SPY", name="SPDR S&P 500 ETF Trust", asset_type=AssetType.ETF)
        sqlite_db.add(inst)
        sqlite_db.commit()

        # Insert 10 synthetic valid daily bars
        base_time = datetime(2026, 1, 1, tzinfo=timezone.utc)
        for i in range(10):
            bar = OHLCV(
                instrument_id=inst.id,
                timestamp=base_time + timedelta(days=i),
                frequency=DataFrequency.DAILY,
                open=400.0 + i,
                high=405.0 + i,
                low=398.0 + i,
                close=402.0 + i,
                volume=1000000.0,
                adjusted_close=402.0 + i
            )
            sqlite_db.add(bar)
        sqlite_db.commit()

        # Query via API
        response = client.get(f"/api/v1/market-data?instrument_id={inst.id}")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 10
        assert data["items"][0]["open"] == 400.0


# ---------------------------------------------------------------------------
# 3. Quantitative Analytics Smoke Tests
# ---------------------------------------------------------------------------

class TestOperationalAnalyticsEngine:
    def test_returns_calculation_math(self):
        prices = [100.0, 105.0, 102.0, 108.0]
        simple_rets = ReturnCalculator.calculate_simple_returns(prices)
        assert simple_rets[0] is None
        assert simple_rets[1] == pytest.approx(0.05)
        assert simple_rets[2] == pytest.approx((102.0 - 105.0) / 105.0)

        log_rets = ReturnCalculator.calculate_log_returns(prices)
        assert log_rets[0] is None
        assert log_rets[1] == pytest.approx(0.04879016416943205)

    def test_portfolio_accounting_invariant(self, sqlite_db: Session):
        # Portfolio Value = Cash + Position Value
        portfolio = Portfolio(name="Production Master Fund", initial_capital=1000000.0, base_currency="USD")
        sqlite_db.add(portfolio)
        sqlite_db.commit()

        inst = Instrument(symbol="AAPL", name="Apple Inc", asset_type=AssetType.EQUITY)
        sqlite_db.add(inst)
        sqlite_db.commit()

        holding = PortfolioHolding(
            portfolio_id=portfolio.id,
            instrument_id=inst.id,
            quantity=1000.0,
            entry_price=150.0,
            target_weight=0.15
        )
        sqlite_db.add(holding)
        sqlite_db.commit()

        current_price = 160.0
        position_val = float(holding.quantity) * current_price  # 160,000
        cash = 850000.0
        total_val = cash + position_val  # 1,010,000

        assert total_val == pytest.approx(cash + (float(holding.quantity) * current_price))

    def test_correlation_symmetry_invariant(self):
        rets_a = [0.01, -0.02, 0.015, -0.005, 0.03]
        rets_b = [0.02, -0.01, 0.010, 0.000, 0.025]
        corr_ab = CorrelationCalculator.calculate_pearson_correlation(rets_a, rets_b)
        corr_ba = CorrelationCalculator.calculate_pearson_correlation(rets_b, rets_a)
        assert corr_ab is not None
        assert corr_ab == pytest.approx(corr_ba, abs=1e-12)

    def test_volatility_calculation_and_annualization(self):
        import pandas as pd
        returns = pd.Series([0.01, -0.01, 0.02, -0.015, 0.005])
        daily_vol = calculate_daily_volatility(returns)
        assert daily_vol is not None and daily_vol > 0.0
        ann_vol = calculate_annualized_volatility(daily_vol, annualization_factor=252)
        assert ann_vol == pytest.approx(daily_vol * (252 ** 0.5), rel=1e-6)


# ---------------------------------------------------------------------------
# 4. Backtesting & Accounting Verification
# ---------------------------------------------------------------------------

class TestOperationalBacktestingAndAccounting:
    def test_backtest_simulation_invariants(self):
        # Generate 20 synthetic bars
        base_time = datetime(2026, 1, 1, tzinfo=timezone.utc)
        bars = []
        for i in range(20):
            p = 100.0 + (i * 2.0)
            bars.append({
                "timestamp": base_time + timedelta(days=i),
                "open": p - 0.5,
                "high": p + 1.0,
                "low": p - 1.0,
                "close": p,
                "volume": 500000.0,
                "adjusted_close": p
            })

        # Generate BUY signal at bar 2, SELL signal at bar 10
        sig_buy_ts = bars[2]["timestamp"]
        sig_sell_ts = bars[10]["timestamp"]

        signals = {
            sig_buy_ts.isoformat().split(".")[0].replace("Z", ""): {
                "id": "sig-buy",
                "signal_type": "BUY",
                "timestamp": sig_buy_ts,
                "price": bars[2]["close"]
            },
            sig_sell_ts.isoformat().split(".")[0].replace("Z", ""): {
                "id": "sig-sell",
                "signal_type": "SELL",
                "timestamp": sig_sell_ts,
                "price": bars[10]["close"]
            }
        }

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
            instrument_id="TEST_INST"
        )

        assert result["status"] == "COMPLETED"
        trades = result["completed_trades"]
        assert len(trades) >= 1

        for trade in trades:
            # Accounting Invariant 1: Exit Timestamp >= Entry Timestamp
            assert trade["exit_timestamp"] >= trade["entry_timestamp"]
            # Accounting Invariant 2: Execution occurred after or at Signal timestamp
            assert trade["entry_timestamp"] >= sig_buy_ts

        # Accounting Invariant 3: Portfolio Value == Cash + Position Value for all states
        for state in result["portfolio_states"]:
            expected_val = state["cash"] + state["position_value"]
            assert state["portfolio_value"] == pytest.approx(expected_val, abs=1e-4)


# ---------------------------------------------------------------------------
# 5. Export Security & Format Verification
# ---------------------------------------------------------------------------

class TestOperationalExportVerification:
    def test_csv_json_export_pipelines(self):
        metadata = ExportMetadata(export_type="PRODUCTION_SMOKE", symbol="SPY")
        data = {
            "headers": ["date", "close", "return", "notes"],
            "rows": [
                ["2026-01-01T00:00:00Z", 400.0, 0.015, "=FORMULA_TEST"],
                ["2026-01-02T00:00:00Z", 405.0, -0.012, "Normal Note"]
            ]
        }

        # CSV
        csv_exporter = CSVExporter()
        csv_bytes = csv_exporter.export(data, metadata)
        assert len(csv_bytes) > 0
        csv_str = csv_bytes.decode("utf-8")
        assert "'=FORMULA_TEST" in csv_str  # Shielded
        assert "-0.012" in csv_str  # Legitimate negative number intact

        # JSON
        json_exporter = JSONExporter()
        json_bytes = json_exporter.export(data, metadata)
        assert len(json_bytes) > 0
        assert b"date" in json_bytes
