from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.models.backtest import BacktestTradeEvent, BacktestCompletedTrade, BacktestPortfolioState
from app.repositories.backtest_repository import BacktestRepository
from app.repositories.instrument_repository import InstrumentRepository
from app.repositories.signal_repository import SignalRepository
from app.repositories.market_data_repository import MarketDataRepository
from app.analytics.backtesting import run_backtest_simulation
from app.analytics.backtesting.performance_engine import PerformanceEngine
from app.analytics.backtesting.drawdown_engine import DrawdownEngine
from app.schemas.backtest import (
    BacktestCreate,
    BacktestResponse,
    BacktestListResponse,
    TradeEventResponse,
    CompletedTradeResponse,
    PortfolioStateResponse,
    BacktestPerformanceResponse,
    BacktestEquityResponse,
    BacktestDrawdownSeriesResponse,
    BacktestDrawdownPeriodsResponse,
    DrawdownPeriodResponse,
)
from app.core.exceptions import NotFoundError, ValidationError


class BacktestService:
    def __init__(self, db: Session):
        self.db = db
        self.backtest_repo = BacktestRepository(db)
        self.inst_repo = InstrumentRepository(db)
        self.signal_repo = SignalRepository(db)
        self.market_repo = MarketDataRepository(db)

    def run_backtest(self, payload: BacktestCreate) -> BacktestResponse:
        # 1. Parameter Validation
        instrument = self.inst_repo.get_by_id(payload.instrument_id)
        if not instrument:
            raise NotFoundError(f"Instrument with ID '{payload.instrument_id}' was not found.")

        config = self.signal_repo.get_configuration_by_id(payload.strategy_configuration_id)
        if not config:
            raise NotFoundError(f"Strategy Configuration with ID '{payload.strategy_configuration_id}' was not found.")

        if config.instrument_id != payload.instrument_id:
            raise ValidationError(
                f"Strategy configuration '{config.id}' is for instrument '{config.instrument_id}', "
                f"which does not match requested instrument '{payload.instrument_id}'."
            )

        if payload.start_date and payload.end_date and payload.start_date >= payload.end_date:
            raise ValidationError("Start date must be strictly before end date.")

        # 2. Create Initial Backtest Record
        backtest = self.backtest_repo.create_backtest(
            strategy_configuration_id=payload.strategy_configuration_id,
            instrument_id=payload.instrument_id,
            initial_capital=payload.initial_capital,
            start_date=payload.start_date,
            end_date=payload.end_date,
            execution_timing=payload.execution_timing,
            position_sizing=payload.position_sizing,
            commission=payload.commission,
            slippage=payload.slippage,
            direction=payload.direction
        )

        # 3. Load Validated Market Data Bars
        bars_db = self.market_repo.get_bars(
            instrument_id=payload.instrument_id,
            start_date=payload.start_date,
            end_date=payload.end_date,
            limit=10000
        )

        if len(bars_db) < 2:
            self.backtest_repo.save_simulation_results(
                backtest_id=backtest.id,
                status="COMPLETED_WITH_WARNINGS",
                final_cash=payload.initial_capital,
                final_position=0.0,
                final_portfolio_value=payload.initial_capital,
                trade_events=[],
                portfolio_states=[],
                completed_trades=[],
                error_message="Insufficient market data observations (less than 2 bars)."
            )
            return self.get_backtest_by_id(backtest.id)

        # Prepare bars payload
        bars_payload = []
        for b in bars_db:
            bars_payload.append({
                "timestamp": b.timestamp,
                "open": float(b.open),
                "high": float(b.high),
                "low": float(b.low),
                "close": float(b.close),
                "adjusted_close": float(b.adjusted_close) if b.adjusted_close is not None else float(b.close),
                "volume": float(b.volume)
            })

        # 4. Load Signals for Strategy Configuration
        signals_list, _ = self.signal_repo.get_signals(
            strategy_configuration_id=payload.strategy_configuration_id,
            start_date=payload.start_date,
            end_date=payload.end_date,
            limit=10000
        )

        signals_map: Dict[str, Dict[str, Any]] = {}
        for sig in signals_list:
            key = sig.timestamp.isoformat().replace(" ", "T").split(".")[0].replace("Z", "") if hasattr(sig.timestamp, "isoformat") else str(sig.timestamp).replace(" ", "T").split(".")[0].replace("Z", "")
            s_type = sig.signal_type.value if hasattr(sig.signal_type, "value") else str(sig.signal_type)
            s_state = sig.signal_state.value if hasattr(sig.signal_state, "value") else str(sig.signal_state)
            signals_map[key] = {
                "id": sig.id,
                "signal_type": s_type,
                "signal_state": s_state,
                "timestamp": sig.timestamp,
                "price": float(sig.price)
            }

        # 5. Run Chronological Simulation Engine
        sim_res = run_backtest_simulation(
            bars=bars_payload,
            signals=signals_map,
            initial_capital=payload.initial_capital,
            execution_timing=payload.execution_timing,
            position_sizing=payload.position_sizing,
            commission=payload.commission,
            slippage=payload.slippage,
            direction=payload.direction,
            force_close_at_end=True,
            instrument_id=payload.instrument_id
        )

        # 6. Save Simulation Results Transactionally
        saved_backtest = self.backtest_repo.save_simulation_results(
            backtest_id=backtest.id,
            status=sim_res["status"],
            final_cash=sim_res["final_cash"],
            final_position=sim_res["final_position"],
            final_portfolio_value=sim_res["final_portfolio_value"],
            trade_events=sim_res["trade_events"],
            portfolio_states=sim_res["portfolio_states"],
            completed_trades=sim_res.get("completed_trades"),
            error_message=sim_res.get("message")
        )

        return self.get_backtest_by_id(saved_backtest.id)

    def get_backtest_by_id(self, backtest_id: str) -> BacktestResponse:
        backtest = self.backtest_repo.get_backtest_by_id(backtest_id)
        if not backtest:
            raise NotFoundError(f"Backtest with ID '{backtest_id}' was not found.")

        trades_count = self.db.query(BacktestTradeEvent).filter(BacktestTradeEvent.backtest_id == backtest.id).count()
        completed_count = self.db.query(BacktestCompletedTrade).filter(BacktestCompletedTrade.backtest_id == backtest.id).count()
        states_count = self.db.query(BacktestPortfolioState).filter(BacktestPortfolioState.backtest_id == backtest.id).count()

        res = BacktestResponse.model_validate(backtest)
        if backtest.instrument:
            res.symbol = backtest.instrument.symbol
        res.trade_count = trades_count
        res.completed_trade_count = completed_count
        res.portfolio_state_count = states_count

        return res

    def list_backtests(
        self,
        instrument_id: Optional[str] = None,
        strategy_configuration_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> BacktestListResponse:
        backtests, total = self.backtest_repo.list_backtests(
            instrument_id=instrument_id,
            strategy_configuration_id=strategy_configuration_id,
            limit=limit,
            offset=offset
        )

        items = []
        for b in backtests:
            b_model = BacktestResponse.model_validate(b)
            if b.instrument:
                b_model.symbol = b.instrument.symbol
            b_model.trade_count = len(b.trade_events) if b.trade_events else 0
            b_model.completed_trade_count = len(b.completed_trades) if b.completed_trades else 0
            b_model.portfolio_state_count = len(b.portfolio_states) if b.portfolio_states else 0
            items.append(b_model)

        return BacktestListResponse(
            items=items,
            total=total,
            limit=limit,
            offset=offset
        )

    def get_trade_events(self, backtest_id: str, limit: int = 500, offset: int = 0) -> List[TradeEventResponse]:
        backtest = self.backtest_repo.get_backtest_by_id(backtest_id, include_relations=False)
        if not backtest:
            raise NotFoundError(f"Backtest with ID '{backtest_id}' was not found.")

        trades, _ = self.backtest_repo.get_trade_events(backtest_id, limit=limit, offset=offset)
        return [TradeEventResponse.model_validate(t) for t in trades]

    def get_completed_trades(self, backtest_id: str, limit: int = 500, offset: int = 0) -> List[CompletedTradeResponse]:
        backtest = self.backtest_repo.get_backtest_by_id(backtest_id, include_relations=False)
        if not backtest:
            raise NotFoundError(f"Backtest with ID '{backtest_id}' was not found.")

        trades, _ = self.backtest_repo.get_completed_trades(backtest_id, limit=limit, offset=offset)
        return [CompletedTradeResponse.model_validate(t) for t in trades]

    def get_portfolio_states(self, backtest_id: str, limit: int = 5000, offset: int = 0) -> List[PortfolioStateResponse]:
        backtest = self.backtest_repo.get_backtest_by_id(backtest_id, include_relations=False)
        if not backtest:
            raise NotFoundError(f"Backtest with ID '{backtest_id}' was not found.")

        states, _ = self.backtest_repo.get_portfolio_states(backtest_id, limit=limit, offset=offset)
        return [PortfolioStateResponse.model_validate(s) for s in states]

    def get_backtest_performance(self, backtest_id: str, risk_free_rate: float = 0.0) -> BacktestPerformanceResponse:
        backtest = self.backtest_repo.get_backtest_by_id(backtest_id, include_relations=True)
        if not backtest:
            raise NotFoundError(f"Backtest with ID '{backtest_id}' was not found.")

        states_db, _ = self.backtest_repo.get_portfolio_states(backtest_id, limit=50000)
        completed_db, _ = self.backtest_repo.get_completed_trades(backtest_id, limit=10000)
        events_db, _ = self.backtest_repo.get_trade_events(backtest_id, limit=10000)

        states_payload = [
            {
                "timestamp": s.timestamp,
                "cash": float(s.cash),
                "position_quantity": float(s.position_quantity),
                "market_price": float(s.market_price),
                "position_value": float(s.position_value),
                "portfolio_value": float(s.portfolio_value),
                "unrealized_pnl": float(s.unrealized_pnl) if s.unrealized_pnl is not None else 0.0
            }
            for s in states_db
        ]

        completed_payload = [
            {
                "id": t.id,
                "entry_timestamp": t.entry_timestamp,
                "exit_timestamp": t.exit_timestamp,
                "entry_price": float(t.entry_price),
                "exit_price": float(t.exit_price),
                "quantity": float(t.quantity),
                "entry_notional": float(t.entry_notional),
                "exit_notional": float(t.exit_notional),
                "entry_commission": float(t.entry_commission),
                "exit_commission": float(t.exit_commission),
                "entry_slippage": float(t.entry_slippage),
                "exit_slippage": float(t.exit_slippage),
                "total_cost": float(t.total_cost),
                "gross_pnl": float(t.gross_pnl),
                "net_pnl": float(t.net_pnl),
                "trade_return": float(t.trade_return),
                "duration_days": float(t.duration_days),
                "exit_reason": t.exit_reason
            }
            for t in completed_db
        ]

        events_payload = [
            {
                "id": e.id,
                "side": e.side,
                "quantity": float(e.quantity),
                "notional_value": float(e.notional_value),
                "commission": float(e.commission),
                "slippage": float(e.slippage)
            }
            for e in events_db
        ]

        metrics = PerformanceEngine.calculate_performance_metrics(
            initial_capital=float(backtest.initial_capital),
            portfolio_states=states_payload,
            completed_trades=completed_payload,
            trade_events=events_payload,
            risk_free_rate=risk_free_rate,
            annualization_factor=252
        )

        symbol = backtest.instrument.symbol if backtest.instrument else None

        return BacktestPerformanceResponse(
            backtest_id=backtest.id,
            symbol=symbol,
            initial_capital=float(backtest.initial_capital),
            final_portfolio_value=float(backtest.final_portfolio_value) if backtest.final_portfolio_value is not None else float(backtest.initial_capital),
            returns=metrics["returns"],
            risk=metrics["risk"],
            drawdown=metrics["drawdown"],
            trading=metrics["trading"],
            costs_and_exposure=metrics["costs_and_exposure"]
        )

    def get_backtest_equity(self, backtest_id: str) -> BacktestEquityResponse:
        backtest = self.backtest_repo.get_backtest_by_id(backtest_id, include_relations=False)
        if not backtest:
            raise NotFoundError(f"Backtest with ID '{backtest_id}' was not found.")

        states_db, _ = self.backtest_repo.get_portfolio_states(backtest_id, limit=50000)

        states_payload = [
            {
                "timestamp": s.timestamp,
                "cash": float(s.cash),
                "position_quantity": float(s.position_quantity),
                "market_price": float(s.market_price),
                "position_value": float(s.position_value),
                "portfolio_value": float(s.portfolio_value),
                "unrealized_pnl": float(s.unrealized_pnl) if s.unrealized_pnl is not None else 0.0
            }
            for s in states_db
        ]

        metrics = PerformanceEngine.calculate_performance_metrics(
            initial_capital=float(backtest.initial_capital),
            portfolio_states=states_payload,
            completed_trades=[]
        )

        return BacktestEquityResponse(
            backtest_id=backtest.id,
            initial_capital=float(backtest.initial_capital),
            equity_series=metrics["equity_series"]
        )

    def get_backtest_drawdown_series(self, backtest_id: str) -> BacktestDrawdownSeriesResponse:
        backtest = self.backtest_repo.get_backtest_by_id(backtest_id, include_relations=False)
        if not backtest:
            raise NotFoundError(f"Backtest with ID '{backtest_id}' was not found.")

        states_db, _ = self.backtest_repo.get_portfolio_states(backtest_id, limit=50000)
        states_payload = [
            {
                "timestamp": s.timestamp,
                "portfolio_value": float(s.portfolio_value)
            }
            for s in states_db
        ]

        res = DrawdownEngine.calculate_drawdown_series(
            initial_capital=float(backtest.initial_capital),
            portfolio_states=states_payload
        )

        return BacktestDrawdownSeriesResponse(
            backtest_id=backtest.id,
            initial_capital=float(backtest.initial_capital),
            max_drawdown=res["max_drawdown"],
            max_drawdown_duration_days=res["max_drawdown_duration_days"],
            current_drawdown=res["current_drawdown"],
            current_drawdown_amount=res["current_drawdown_amount"],
            current_status=res["current_status"],
            drawdown_series=res["drawdown_series"]
        )

    def get_backtest_drawdown_periods(self, backtest_id: str) -> BacktestDrawdownPeriodsResponse:
        backtest = self.backtest_repo.get_backtest_by_id(backtest_id, include_relations=False)
        if not backtest:
            raise NotFoundError(f"Backtest with ID '{backtest_id}' was not found.")

        states_db, _ = self.backtest_repo.get_portfolio_states(backtest_id, limit=50000)
        states_payload = [
            {
                "timestamp": s.timestamp,
                "portfolio_value": float(s.portfolio_value)
            }
            for s in states_db
        ]

        raw_periods = DrawdownEngine.detect_drawdown_periods(
            initial_capital=float(backtest.initial_capital),
            portfolio_states=states_payload
        )

        periods_res = [DrawdownPeriodResponse.model_validate(p) for p in raw_periods]
        active_count = sum(1 for p in periods_res if p.status == "ACTIVE")
        recovered_count = sum(1 for p in periods_res if p.status == "RECOVERED")

        return BacktestDrawdownPeriodsResponse(
            backtest_id=backtest.id,
            total_periods=len(periods_res),
            active_periods_count=active_count,
            recovered_periods_count=recovered_count,
            periods=periods_res
        )
