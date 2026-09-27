from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from app.models.backtest import Backtest, BacktestTradeEvent, BacktestCompletedTrade, BacktestPortfolioState


class BacktestRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_backtest(
        self,
        strategy_configuration_id: str,
        instrument_id: str,
        initial_capital: float = 100000.0,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        execution_timing: str = "NEXT_OPEN",
        position_sizing: str = "FULL_CAPITAL",
        commission: float = 0.0,
        slippage: float = 0.0,
        direction: str = "LONG_ONLY"
    ) -> Backtest:
        backtest = Backtest(
            strategy_configuration_id=strategy_configuration_id,
            instrument_id=instrument_id,
            start_date=start_date,
            end_date=end_date,
            initial_capital=initial_capital,
            execution_timing=execution_timing,
            position_sizing=position_sizing,
            commission=commission,
            slippage=slippage,
            direction=direction,
            status="PENDING"
        )
        self.db.add(backtest)
        self.db.commit()
        self.db.refresh(backtest)
        return backtest

    def save_simulation_results(
        self,
        backtest_id: str,
        status: str,
        final_cash: float,
        final_position: float,
        final_portfolio_value: float,
        trade_events: List[Dict[str, Any]],
        portfolio_states: List[Dict[str, Any]],
        completed_trades: Optional[List[Dict[str, Any]]] = None,
        error_message: Optional[str] = None
    ) -> Optional[Backtest]:
        backtest = self.db.query(Backtest).filter(Backtest.id == backtest_id).first()
        if not backtest:
            return None

        backtest.status = status
        backtest.final_cash = final_cash
        backtest.final_position = final_position
        backtest.final_portfolio_value = final_portfolio_value
        backtest.error_message = error_message

        # Bulk save trade events
        trade_objs = []
        for t in trade_events:
            trade_objs.append(
                BacktestTradeEvent(
                    backtest_id=backtest_id,
                    signal_id=t.get("signal_id"),
                    instrument_id=backtest.instrument_id,
                    side=t["side"],
                    signal_timestamp=t.get("signal_timestamp"),
                    execution_timestamp=t["execution_timestamp"],
                    execution_reason=t.get("execution_reason", "SIGNAL"),
                    execution_price=t["execution_price"],
                    quantity=t["quantity"],
                    notional_value=t["notional_value"],
                    commission=t.get("commission", 0.0),
                    slippage=t.get("slippage", 0.0),
                    cash_after=t["cash_after"]
                )
            )

        if trade_objs:
            self.db.bulk_save_objects(trade_objs)

        # Bulk save completed trades
        completed_objs = []
        if completed_trades:
            for ct in completed_trades:
                completed_objs.append(
                    BacktestCompletedTrade(
                        backtest_id=backtest_id,
                        instrument_id=backtest.instrument_id,
                        entry_signal_id=ct.get("entry_signal_id"),
                        exit_signal_id=ct.get("exit_signal_id"),
                        entry_trade_event_id=ct.get("entry_trade_event_id"),
                        exit_trade_event_id=ct.get("exit_trade_event_id"),
                        entry_timestamp=ct["entry_timestamp"],
                        exit_timestamp=ct["exit_timestamp"],
                        entry_price=ct["entry_price"],
                        exit_price=ct["exit_price"],
                        quantity=ct["quantity"],
                        entry_notional=ct["entry_notional"],
                        exit_notional=ct["exit_notional"],
                        entry_commission=ct.get("entry_commission", 0.0),
                        exit_commission=ct.get("exit_commission", 0.0),
                        entry_slippage=ct.get("entry_slippage", 0.0),
                        exit_slippage=ct.get("exit_slippage", 0.0),
                        total_cost=ct.get("total_cost", 0.0),
                        gross_pnl=ct["gross_pnl"],
                        net_pnl=ct["net_pnl"],
                        trade_return=ct.get("trade_return", 0.0),
                        duration_days=ct.get("duration_days", 0.0),
                        exit_reason=ct.get("exit_reason", "SIGNAL")
                    )
                )

        if completed_objs:
            self.db.bulk_save_objects(completed_objs)

        # Bulk save portfolio states
        state_objs = []
        for s in portfolio_states:
            state_objs.append(
                BacktestPortfolioState(
                    backtest_id=backtest_id,
                    timestamp=s["timestamp"],
                    cash=s["cash"],
                    position_quantity=s["position_quantity"],
                    market_price=s["market_price"],
                    position_value=s["position_value"],
                    portfolio_value=s["portfolio_value"],
                    unrealized_pnl=s.get("unrealized_pnl", 0.0)
                )
            )

        if state_objs:
            self.db.bulk_save_objects(state_objs)

        self.db.commit()
        self.db.refresh(backtest)
        return backtest

    def get_backtest_by_id(self, backtest_id: str, include_relations: bool = True) -> Optional[Backtest]:
        query = self.db.query(Backtest)
        if include_relations:
            query = query.options(
                joinedload(Backtest.instrument),
                joinedload(Backtest.strategy_configuration)
            )
        return query.filter(Backtest.id == backtest_id).first()

    def list_backtests(
        self,
        instrument_id: Optional[str] = None,
        strategy_configuration_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Backtest], int]:
        query = self.db.query(Backtest).options(
            joinedload(Backtest.instrument),
            joinedload(Backtest.strategy_configuration)
        )
        if instrument_id:
            query = query.filter(Backtest.instrument_id == instrument_id)
        if strategy_configuration_id:
            query = query.filter(Backtest.strategy_configuration_id == strategy_configuration_id)

        total_count = query.count()
        backtests = query.order_by(Backtest.created_at.desc()).offset(offset).limit(limit).all()
        return backtests, total_count

    def get_trade_events(self, backtest_id: str, limit: int = 500, offset: int = 0) -> Tuple[List[BacktestTradeEvent], int]:
        query = self.db.query(BacktestTradeEvent).filter(BacktestTradeEvent.backtest_id == backtest_id)
        total_count = query.count()
        trades = query.order_by(BacktestTradeEvent.execution_timestamp.asc()).offset(offset).limit(limit).all()
        return trades, total_count

    def get_completed_trades(self, backtest_id: str, limit: int = 500, offset: int = 0) -> Tuple[List[BacktestCompletedTrade], int]:
        query = self.db.query(BacktestCompletedTrade).filter(BacktestCompletedTrade.backtest_id == backtest_id)
        total_count = query.count()
        trades = query.order_by(BacktestCompletedTrade.entry_timestamp.asc()).offset(offset).limit(limit).all()
        return trades, total_count

    def get_portfolio_states(self, backtest_id: str, limit: int = 5000, offset: int = 0) -> Tuple[List[BacktestPortfolioState], int]:
        query = self.db.query(BacktestPortfolioState).filter(BacktestPortfolioState.backtest_id == backtest_id)
        total_count = query.count()
        states = query.order_by(BacktestPortfolioState.timestamp.asc()).offset(offset).limit(limit).all()
        return states, total_count
