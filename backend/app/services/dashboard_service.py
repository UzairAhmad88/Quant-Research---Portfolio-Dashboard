from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.instrument import Instrument
from app.models.portfolio import Portfolio, PortfolioHolding
from app.models.strategy import StrategyConfiguration, SignalEvent
from app.models.backtest import Backtest, BacktestCompletedTrade
from app.models.ingestion import IngestionLog
from app.models.market_data import OHLCV
from app.repositories.instrument_repository import InstrumentRepository
from app.repositories.market_data_repository import MarketDataRepository
from app.repositories.portfolio_repository import PortfolioRepository
from app.repositories.signal_repository import SignalRepository
from app.repositories.backtest_repository import BacktestRepository
from app.repositories.ingestion_repository import IngestionRepository
from app.analytics.market_data.freshness_policy import FreshnessPolicy
from app.schemas.dashboard import (

    DashboardOverviewResponse,
    DashboardSummary,
    DashboardSystemStatus,
    MarketDataInstrumentItem,
    DashboardPortfolioItem,
    DashboardPortfolioSnapshot,
    DashboardSignalItem,
    DashboardStrategySnapshot,
    DashboardBacktestItem,
    DashboardActivityItem,
)


class DashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.instrument_repo = InstrumentRepository(db)
        self.market_data_repo = MarketDataRepository(db)
        self.portfolio_repo = PortfolioRepository(db)
        self.signal_repo = SignalRepository(db)
        self.backtest_repo = BacktestRepository(db)
        self.ingestion_repo = IngestionRepository(db)

    def get_dashboard_overview(self) -> DashboardOverviewResponse:
        now = datetime.now(timezone.utc)

        # 1. Summary Counts
        tracked_instruments_count = self.db.query(Instrument).filter(Instrument.active.is_(True)).count()
        portfolios_count = self.db.query(Portfolio).filter(Portfolio.is_active.is_(True)).count()
        strategy_configurations_count = self.db.query(StrategyConfiguration).filter(StrategyConfiguration.active.is_(True)).count()
        completed_backtests_count = (
            self.db.query(Backtest)
            .filter(Backtest.status.in_(["COMPLETED", "COMPLETED_WITH_WARNINGS"]))
            .count()
        )

        summary = DashboardSummary(
            tracked_instruments_count=tracked_instruments_count,
            portfolios_count=portfolios_count,
            strategy_configurations_count=strategy_configurations_count,
            completed_backtests_count=completed_backtests_count,
        )

        # 2. Market Data Snapshot (Recent 5 instruments) - Batched queries
        instruments = self.instrument_repo.list_instruments(limit=5)
        inst_ids = [inst.id for inst in instruments]
        counts_map = self.market_data_repo.get_observation_counts_batch(inst_ids)
        latest_bars_map = self.market_data_repo.get_latest_bars_batch(inst_ids)

        market_data_items: List[MarketDataInstrumentItem] = []
        overall_quality_has_warnings = False
        has_any_observations = False

        for inst in instruments:
            bar_count = counts_map.get(inst.id, 0)
            latest_bar = latest_bars_map.get(inst.id)

            if bar_count > 0:
                has_any_observations = True

            if bar_count >= 100:
                quality = "Good"
            elif bar_count > 0:
                quality = "Good with Warnings"
                overall_quality_has_warnings = True
            else:
                quality = "No Data"

            latest_date = latest_bar.timestamp if latest_bar else None
            freshness_state = (
                FreshnessPolicy.evaluate_freshness(latest_date, asset_type=inst.asset_type).value
                if latest_date
                else "UNAVAILABLE"
            )
            freshness = (
                f"Latest Observation: {latest_date.strftime('%Y-%m-%d')}"
                if latest_date
                else "No Observation"
            )

            market_data_items.append(
                MarketDataInstrumentItem(
                    id=inst.id,
                    symbol=inst.symbol,
                    name=inst.name,
                    asset_type=inst.asset_type.value if hasattr(inst.asset_type, "value") else str(inst.asset_type),
                    exchange=inst.exchange,
                    provider=latest_bar.provider if latest_bar else "YAHOO",
                    frequency=latest_bar.frequency.value if latest_bar and hasattr(latest_bar.frequency, "value") else "DAILY",
                    latest_observation_date=latest_date,
                    latest_price=float(latest_bar.close) if latest_bar else None,
                    observation_count=bar_count,
                    data_quality=quality,
                    freshness_label=freshness,
                    freshness_state=freshness_state,
                )
            )


        if not has_any_observations:
            data_status = "No Data"
        elif overall_quality_has_warnings:
            data_status = "Good with Warnings"
        else:
            data_status = "Good"

        system_status = DashboardSystemStatus(
            data_status=data_status,
            backend_status="ONLINE",
            database_connected=True,
            last_updated=now,
        )

        # 3. Portfolio Snapshot
        portfolios = self.portfolio_repo.list_portfolios(active_only=True)
        portfolio_items: List[DashboardPortfolioItem] = []
        total_val = 0.0
        total_initial = 0.0
        total_positions = 0

        for p in portfolios[:5]:
            positions_count = len([h for h in p.holdings if h.is_active])
            total_positions += positions_count
            total_initial += float(p.initial_capital)
            total_val += float(p.initial_capital)  # Baseline capital evaluation

            portfolio_items.append(
                DashboardPortfolioItem(
                    id=p.id,
                    name=p.name,
                    initial_capital=float(p.initial_capital),
                    positions_count=positions_count,
                    created_at=p.created_at,
                )
            )

        total_return_pct = (
            ((total_val - total_initial) / total_initial) * 100.0 if total_initial > 0 else 0.0
        )

        portfolio_snapshot = DashboardPortfolioSnapshot(
            active_portfolios_count=len(portfolios),
            total_portfolio_value=total_val,
            total_portfolio_return_pct=total_return_pct,
            total_cash=total_val,
            total_positions_count=total_positions,
            portfolios=portfolio_items,
        )

        # 4. Strategy Snapshot & Recent Signals
        recent_signals_raw, _ = self.signal_repo.get_signals(limit=10)
        recent_signal_items: List[DashboardSignalItem] = []

        # Batch map instrument IDs to symbols
        inst_ids = {s.instrument_id for s in recent_signals_raw}
        inst_map = {}
        if inst_ids:
            inst_rows = self.db.query(Instrument).filter(Instrument.id.in_(inst_ids)).all()
            inst_map = {i.id: i.symbol for i in inst_rows}

        for sig in recent_signals_raw:
            recent_signal_items.append(
                DashboardSignalItem(
                    id=sig.id,
                    symbol=inst_map.get(sig.instrument_id, "UNKNOWN"),
                    strategy_type=sig.configuration.strategy_type if sig.configuration else "MOVING_AVERAGE",
                    signal_type=sig.signal_type,
                    signal_state=sig.signal_state,
                    price=float(sig.price),
                    timestamp=sig.timestamp,
                )
            )

        strategy_snapshot = DashboardStrategySnapshot(
            strategy_configurations_count=strategy_configurations_count,
            recent_signals=recent_signal_items,
        )

        # 5. Recent Backtests Snapshot
        backtests_raw, _ = self.backtest_repo.list_backtests(limit=5)
        recent_backtest_items: List[DashboardBacktestItem] = []

        for b in backtests_raw:
            symbol = b.instrument.symbol if b.instrument else "UNKNOWN"
            strategy_name = (
                f"{b.strategy_configuration.strategy_type} ({b.strategy_configuration.ma_type or 'SMA'})"
                if b.strategy_configuration
                else "Moving Average Crossover"
            )

            period_str = "Full History"
            if b.start_date and b.end_date:
                period_str = f"{b.start_date.strftime('%Y-%m-%d')} → {b.end_date.strftime('%Y-%m-%d')}"

            # Calculate total return % and trade count if completed
            tot_ret: Optional[float] = None
            if b.final_portfolio_value is not None and b.initial_capital > 0:
                tot_ret = ((float(b.final_portfolio_value) - float(b.initial_capital)) / float(b.initial_capital)) * 100.0

            # Count completed trades for trade_count
            trade_count = (
                self.db.query(func.count(BacktestCompletedTrade.id))
                .filter(BacktestCompletedTrade.backtest_id == b.id)
                .scalar()
                or 0
            )

            recent_backtest_items.append(
                DashboardBacktestItem(
                    id=b.id,
                    instrument_symbol=symbol,
                    strategy_name=strategy_name,
                    period=period_str,
                    status=b.status,
                    total_return_pct=tot_ret,
                    max_drawdown_pct=None,  # Drawdown computed dynamically in report/analytics engine
                    trade_count=trade_count,
                    completed_at=b.updated_at,
                )
            )

        # 6. Recent Activity Log (aggregated from actual system events)
        activities: List[DashboardActivityItem] = []

        # (a) Recent Ingestion Logs
        recent_logs = self.ingestion_repo.get_recent_logs(limit=5)
        for log in recent_logs:
            inst_sym = inst_map.get(log.instrument_id, "Market Data") if log.instrument_id else "Market Data"
            activities.append(
                DashboardActivityItem(
                    id=f"act-ingest-{log.id}",
                    timestamp=log.created_at,
                    activity_type="MARKET_DATA_INGESTION",
                    entity_symbol_or_name=inst_sym,
                    status=log.status.value if hasattr(log.status, "value") else str(log.status),
                )
            )

        # (b) Recent Backtests
        for b in backtests_raw:
            symbol = b.instrument.symbol if b.instrument else "Backtest"
            activities.append(
                DashboardActivityItem(
                    id=f"act-bt-{b.id}",
                    timestamp=b.created_at,
                    activity_type="BACKTEST_RUN",
                    entity_symbol_or_name=f"{symbol} Backtest",
                    status=b.status,
                )
            )

        # (c) Recent Portfolios
        for p in portfolios[:3]:
            activities.append(
                DashboardActivityItem(
                    id=f"act-port-{p.id}",
                    timestamp=p.created_at,
                    activity_type="PORTFOLIO_CREATED",
                    entity_symbol_or_name=p.name,
                    status="ACTIVE",
                )
            )

        # Sort activities descending by timestamp
        activities.sort(key=lambda a: a.timestamp, reverse=True)
        recent_activities = activities[:8]

        return DashboardOverviewResponse(
            summary=summary,
            system_status=system_status,
            market_data_snapshot=market_data_items,
            portfolio_snapshot=portfolio_snapshot,
            strategy_snapshot=strategy_snapshot,
            recent_backtests=recent_backtest_items,
            recent_activity=recent_activities,
        )
