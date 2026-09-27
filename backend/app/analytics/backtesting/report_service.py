import hashlib
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.backtest import Backtest
from app.repositories.backtest_repository import BacktestRepository
from app.repositories.instrument_repository import InstrumentRepository
from app.repositories.signal_repository import SignalRepository
from app.repositories.market_data_repository import MarketDataRepository
from app.services.backtest_service import BacktestService
from app.analytics.backtesting.drawdown_engine import DrawdownEngine
from app.core.exceptions import NotFoundError
from app.schemas.report import (
    BacktestReportResponse,
    ReportExecutiveSummary,
    ReportConfigurationSnapshot,
    ReportStrategyConfiguration,
    ReportSignalsSummary,
    ReportMarketDataProvenance,
    ReportExecutionAssumptions,
    ReportCostAssumptions,
    ReportPerformanceSummary,
    ReportEquitySummary,
    ReportDrawdownSummary,
    ReportAccountingSummary,
    ReportDataQuality,
    ReportReproducibility,
)


def compute_configuration_fingerprint(
    backtest: Backtest,
    strategy_type: str = "MOVING_AVERAGE",
    fast_window: Optional[int] = None,
    slow_window: Optional[int] = None,
    ma_type: Optional[str] = None
) -> str:
    """
    Computes a deterministic sha256 configuration hash over core experimental parameters.
    """
    raw_dict = {
        "backtest_id": str(backtest.id),
        "instrument_id": str(backtest.instrument_id),
        "strategy_configuration_id": str(backtest.strategy_configuration_id),
        "strategy_type": strategy_type,
        "start_date": backtest.start_date.isoformat() if backtest.start_date else None,
        "end_date": backtest.end_date.isoformat() if backtest.end_date else None,
        "initial_capital": float(backtest.initial_capital),
        "execution_timing": str(backtest.execution_timing),
        "position_sizing": str(backtest.position_sizing),
        "commission": float(backtest.commission),
        "slippage": float(backtest.slippage),
        "direction": str(backtest.direction),
        "fast_window": fast_window,
        "slow_window": slow_window,
        "ma_type": ma_type,
    }
    encoded = json.dumps(raw_dict, sort_keys=True).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


STANDARD_METHODOLOGY = [
    "Chronological Next-Open Execution Model: Strategy crossover signals generated on bar Close are executed at the Open price of the immediately succeeding trading bar.",
    "Cost-Aware Trade Accounting: Transaction costs (commission rate + execution slippage) are deducted directly from available portfolio cash at trade entry and exit.",
    "Full-Capital Position Allocation: Position sizing utilizes maximum available portfolio cash at trade execution.",
    "Mark-to-Market Portfolio Valuation: Portfolio value is computed as Cash + (Position Quantity * Market Close Price) after each bar.",
    "Decoupled Performance Evaluation: Quantitative return, risk, and drawdown metrics are derived server-side from authoritative portfolio state histories."
]

STANDARD_LIMITATIONS = [
    "Historical Backtesting Disclaimer: Past performance results do not guarantee or predict future investment returns.",
    "Execution Model Simplification: Fills are simulated at official Open prices; intra-bar order book depth and market impact are not modeled.",
    "Liquidity Assumptions: Full order execution is assumed without volume constraints or partial fill logic.",
    "Corporate Actions & Provider Adjustments: Dividend and stock split adjustments depend on provider historical data quality.",
    "Parameter Overfitting Warning: Strategy parameters (e.g. MA windows) selected over a specific period may experience performance degradation in out-of-sample regimes."
]


class ReportService:
    def __init__(self, db: Session):
        self.db = db
        self.backtest_repo = BacktestRepository(db)
        self.inst_repo = InstrumentRepository(db)
        self.signal_repo = SignalRepository(db)
        self.market_repo = MarketDataRepository(db)

    def generate_report(self, backtest_id: str) -> BacktestReportResponse:
        """
        Aggregates authoritative backtest records into a structured research report DTO.
        """
        backtest = self.backtest_repo.get_backtest_by_id(backtest_id)
        if not backtest:
            raise NotFoundError(f"Backtest with ID '{backtest_id}' was not found.")

        # 1. Fetch metadata
        instrument = self.inst_repo.get_by_id(backtest.instrument_id)
        config = self.signal_repo.get_configuration_by_id(backtest.strategy_configuration_id)

        symbol = instrument.symbol if instrument else "UNKNOWN"
        inst_name = instrument.name if instrument else None
        asset_type = instrument.asset_type if instrument else "EQUITY"
        currency = instrument.currency if instrument else "USD"

        fast_win = config.fast_window if config else None
        slow_win = config.slow_window if config else None
        ma_type = config.ma_type if config else "SMA"
        price_src = config.price_source if config else "adjusted"

        config_hash = compute_configuration_fingerprint(
            backtest=backtest,
            strategy_type="MOVING_AVERAGE",
            fast_window=fast_win,
            slow_window=slow_win,
            ma_type=ma_type
        )

        # 2. Fetch trade events and portfolio states
        trades, _ = self.backtest_repo.get_trade_events(backtest.id, limit=10000)
        completed_trades, _ = self.backtest_repo.get_completed_trades(backtest.id, limit=10000)
        states, _ = self.backtest_repo.get_portfolio_states(backtest.id, limit=10000)
        bars_db = self.market_repo.get_bars(
            instrument_id=backtest.instrument_id,
            start_date=backtest.start_date,
            end_date=backtest.end_date,
            limit=10000
        )

        # 3. Compute Quantitative Metrics using BacktestService & DrawdownEngine
        backtest_service = BacktestService(self.db)
        perf = backtest_service.get_backtest_performance(backtest.id, risk_free_rate=0.0)

        # Drawdown analysis
        states_dicts = [
            {"timestamp": s.timestamp, "portfolio_value": float(s.portfolio_value)}
            for s in states
        ]
        drawdown_series = DrawdownEngine.calculate_drawdown_series(
            initial_capital=float(backtest.initial_capital),
            portfolio_states=states_dicts
        )["drawdown_series"]

        drawdown_periods_res = backtest_service.get_backtest_drawdown_periods(backtest.id)

        latest_dd = drawdown_series[-1] if drawdown_series else None
        current_dd_pct = float(latest_dd["drawdown_percentage"]) if latest_dd else 0.0
        current_dd_amt = float(latest_dd["drawdown_amount"]) if latest_dd else 0.0
        running_peak = float(latest_dd["running_peak"]) if latest_dd else float(backtest.initial_capital)
        current_status = "AT_PEAK" if abs(current_dd_pct) < 1e-6 else "IN_DRAWDOWN"

        active_periods_count = sum(1 for p in drawdown_periods_res.periods if p.status == "ACTIVE")
        longest_duration = max([p.duration_days for p in drawdown_periods_res.periods], default=0)

        # Signals summary
        signals_in_db, _ = self.signal_repo.get_signals(
            strategy_configuration_id=backtest.strategy_configuration_id,
            limit=10000
        )
        buy_signals = sum(1 for s in signals_in_db if s.signal_type == "BUY")
        sell_signals = sum(1 for s in signals_in_db if s.signal_type == "SELL")
        first_sig_ts = signals_in_db[0].timestamp if signals_in_db else None
        last_sig_ts = signals_in_db[-1].timestamp if signals_in_db else None

        # Market data provenance
        obs_count = len(bars_db)
        actual_start = bars_db[0].timestamp if bars_db else None
        actual_end = bars_db[-1].timestamp if bars_db else None
        data_quality_status = "GOOD"
        warnings_list: List[str] = []

        if backtest.error_message:
            warnings_list.append(backtest.error_message)
        if backtest.status == "COMPLETED_WITH_WARNINGS":
            data_quality_status = "GOOD_WITH_WARNINGS"

        # Accounting summary
        latest_state = states[-1] if states else None
        final_cash = float(latest_state.cash) if latest_state else float(backtest.initial_capital)
        final_pos_qty = float(latest_state.position_quantity) if latest_state else 0.0
        final_pos_val = float(latest_state.position_value) if latest_state else 0.0
        final_port_val = float(latest_state.portfolio_value) if latest_state else float(backtest.initial_capital)

        realized_pnl = sum(float(t.net_pnl) for t in completed_trades)
        unrealized_pnl = float(latest_state.unrealized_pnl) if latest_state else 0.0

        # Construct DTO Sub-objects
        exec_summary = ReportExecutiveSummary(
            symbol=symbol,
            instrument_name=inst_name,
            strategy_name=f"Moving Average Crossover ({ma_type} {fast_win}/{slow_win})",
            start_date=backtest.start_date,
            end_date=backtest.end_date,
            initial_capital=float(backtest.initial_capital),
            final_portfolio_value=final_port_val,
            total_return=perf.returns.total_return,
            annualized_return=perf.returns.annualized_return,
            annualized_volatility=perf.risk.annualized_volatility,
            sharpe_ratio=perf.risk.sharpe_ratio,
            sortino_ratio=perf.risk.sortino_ratio,
            max_drawdown=perf.drawdown.max_drawdown,
            trade_count=perf.trading.trade_count,
            win_rate=perf.trading.win_rate
        )

        config_snapshot = ReportConfigurationSnapshot(
            backtest_id=str(backtest.id),
            created_at=backtest.created_at,
            completed_at=backtest.updated_at if backtest.status != "PENDING" else None,
            status=backtest.status,
            instrument_id=str(backtest.instrument_id),
            symbol=symbol,
            asset_type=asset_type,
            currency=currency,
            initial_capital=float(backtest.initial_capital),
            start_date=backtest.start_date,
            end_date=backtest.end_date,
            data_frequency="DAILY",
            price_source=price_src
        )

        strat_config = ReportStrategyConfiguration(
            strategy_configuration_id=str(backtest.strategy_configuration_id),
            strategy_type="MOVING_AVERAGE",
            ma_type=ma_type,
            fast_window=fast_win,
            slow_window=slow_win,
            price_source=price_src,
            direction=str(backtest.direction)
        )

        signals_summary = ReportSignalsSummary(
            total_signals=len(signals_in_db),
            buy_signals=buy_signals,
            sell_signals=sell_signals,
            first_signal_timestamp=first_sig_ts,
            last_signal_timestamp=last_sig_ts
        )

        market_provenance = ReportMarketDataProvenance(
            instrument_id=str(backtest.instrument_id),
            symbol=symbol,
            provider="yahoo_finance",
            provider_symbol=instrument.provider_symbol if instrument else symbol,
            frequency="DAILY",
            price_source=price_src,
            requested_start=backtest.start_date,
            requested_end=backtest.end_date,
            actual_start=actual_start,
            actual_end=actual_end,
            observation_count=obs_count,
            latest_observation_timestamp=actual_end,
            data_quality_status=data_quality_status
        )

        exec_assumptions = ReportExecutionAssumptions(
            execution_model=str(backtest.execution_timing),
            position_direction=str(backtest.direction),
            position_sizing=str(backtest.position_sizing),
            fractional_quantity_allowed=True,
            initial_capital=float(backtest.initial_capital),
            forced_close_at_end=True,
            forced_close_price_source=price_src
        )

        cost_assumptions = ReportCostAssumptions(
            commission_rate=float(backtest.commission),
            slippage_rate=float(backtest.slippage),
            commission_type="PERCENTAGE",
            slippage_type="PERCENTAGE"
        )

        perf_summary = ReportPerformanceSummary(
            returns=perf.returns,
            risk=perf.risk,
            drawdown=perf.drawdown,
            trading=perf.trading,
            costs_and_exposure=perf.costs_and_exposure
        )

        equity_summary = ReportEquitySummary(
            initial_capital=float(backtest.initial_capital),
            final_portfolio_value=final_port_val,
            total_return=perf.returns.total_return,
            running_peak=running_peak,
            cumulative_return=perf.returns.total_return,
            observation_count=len(states)
        )

        drawdown_summary = ReportDrawdownSummary(
            max_drawdown_percentage=perf.drawdown.max_drawdown or 0.0,
            current_drawdown_percentage=current_dd_pct,
            current_drawdown_amount=current_dd_amt,
            running_peak=running_peak,
            current_status=current_status,
            period_count=len(drawdown_periods_res.periods),
            active_period_count=active_periods_count,
            longest_duration_days=longest_duration,
            periods=drawdown_periods_res.periods
        )

        accounting_summary = ReportAccountingSummary(
            initial_cash=float(backtest.initial_capital),
            final_cash=final_cash,
            final_position_quantity=final_pos_qty,
            final_position_value=final_pos_val,
            final_portfolio_value=final_port_val,
            realized_pnl=realized_pnl,
            unrealized_pnl=unrealized_pnl,
            total_commission=perf.costs_and_exposure.total_commission,
            total_slippage=perf.costs_and_exposure.total_slippage_cost,
            total_transaction_costs=perf.costs_and_exposure.total_transaction_costs
        )

        data_quality = ReportDataQuality(
            overall_status=data_quality_status,
            validation_status="VALIDATED",
            warnings=warnings_list,
            coverage_ratio=1.0 if obs_count > 0 else 0.0,
            observation_count=obs_count
        )

        reproducibility = ReportReproducibility(
            backtest_id=str(backtest.id),
            strategy_configuration_id=str(backtest.strategy_configuration_id),
            instrument_id=str(backtest.instrument_id),
            symbol=symbol,
            provider="yahoo_finance",
            data_frequency="DAILY",
            price_source=price_src,
            start_date=backtest.start_date,
            end_date=backtest.end_date,
            execution_timing=str(backtest.execution_timing),
            position_sizing=str(backtest.position_sizing),
            commission=float(backtest.commission),
            slippage=float(backtest.slippage),
            initial_capital=float(backtest.initial_capital),
            created_at=backtest.created_at,
            completed_at=backtest.updated_at if backtest.status != "PENDING" else None,
            configuration_hash=config_hash
        )

        return BacktestReportResponse(
            report_version="1.0",
            generated_at=datetime.now(timezone.utc),
            backtest_id=str(backtest.id),
            configuration_hash=config_hash,
            status=backtest.status,
            warnings=warnings_list,
            executive_summary=exec_summary,
            configuration=config_snapshot,
            strategy=strat_config,
            signals_summary=signals_summary,
            market_data=market_provenance,
            execution_assumptions=exec_assumptions,
            cost_assumptions=cost_assumptions,
            performance=perf_summary,
            equity_summary=equity_summary,
            drawdown_summary=drawdown_summary,
            accounting=accounting_summary,
            data_quality=data_quality,
            methodology=STANDARD_METHODOLOGY,
            limitations=STANDARD_LIMITATIONS,
            reproducibility=reproducibility
        )
