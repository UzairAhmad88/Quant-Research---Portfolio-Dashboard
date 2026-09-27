from sqlalchemy import Column, String, Integer, Boolean, JSON, Numeric, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.models.base import BaseModel


class Backtest(BaseModel):
    """
    Backtest entity representing a completed or running historical simulation.
    """
    __tablename__ = "backtests"
    __table_args__ = (
        CheckConstraint("initial_capital > 0", name="ck_backtests_capital_positive"),
        {"schema": "backtesting"}
    )

    strategy_configuration_id = Column(
        String(36),
        ForeignKey("strategy.strategy_configurations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    instrument_id = Column(
        String(36),
        ForeignKey("core.instruments.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    initial_capital = Column(Numeric(18, 4), nullable=False, default=100000.0)
    execution_timing = Column(String(32), nullable=False, default="NEXT_OPEN")
    position_sizing = Column(String(32), nullable=False, default="FULL_CAPITAL")
    commission = Column(Numeric(18, 8), nullable=False, default=0.0)
    slippage = Column(Numeric(18, 8), nullable=False, default=0.0)
    direction = Column(String(32), nullable=False, default="LONG_ONLY")
    status = Column(String(32), nullable=False, default="PENDING", index=True)

    final_cash = Column(Numeric(18, 8), nullable=True)
    final_position = Column(Numeric(18, 8), nullable=True)
    final_portfolio_value = Column(Numeric(18, 8), nullable=True)
    error_message = Column(String(512), nullable=True)

    instrument = relationship("Instrument")
    strategy_configuration = relationship("StrategyConfiguration")
    trade_events = relationship("BacktestTradeEvent", back_populates="backtest", cascade="all, delete-orphan")
    completed_trades = relationship("BacktestCompletedTrade", back_populates="backtest", cascade="all, delete-orphan")
    portfolio_states = relationship("BacktestPortfolioState", back_populates="backtest", cascade="all, delete-orphan")


class BacktestTradeEvent(BaseModel):
    """
    Simulated trade execution event generated during backtest simulation.
    """
    __tablename__ = "trade_events"
    __table_args__ = (
        CheckConstraint("execution_price > 0", name="ck_trades_price_positive"),
        CheckConstraint("quantity > 0", name="ck_trades_qty_positive"),
        {"schema": "backtesting"}
    )

    backtest_id = Column(
        String(36),
        ForeignKey("backtesting.backtests.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    signal_id = Column(
        String(36),
        ForeignKey("strategy.signal_events.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    instrument_id = Column(
        String(36),
        ForeignKey("core.instruments.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    side = Column(String(16), nullable=False)
    signal_timestamp = Column(DateTime(timezone=True), nullable=True)
    execution_timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    execution_reason = Column(String(32), nullable=False, default="SIGNAL")
    execution_price = Column(Numeric(18, 8), nullable=False)
    quantity = Column(Numeric(18, 8), nullable=False)
    notional_value = Column(Numeric(18, 8), nullable=False)
    commission = Column(Numeric(18, 8), nullable=False, default=0.0)
    slippage = Column(Numeric(18, 8), nullable=False, default=0.0)
    cash_after = Column(Numeric(18, 8), nullable=False)

    backtest = relationship("Backtest", back_populates="trade_events")


class BacktestCompletedTrade(BaseModel):
    """
    Completed round-trip trade linking an entry execution and an exit execution.
    """
    __tablename__ = "completed_trades"
    __table_args__ = (
        {"schema": "backtesting"}
    )

    backtest_id = Column(
        String(36),
        ForeignKey("backtesting.backtests.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    instrument_id = Column(
        String(36),
        ForeignKey("core.instruments.id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    entry_signal_id = Column(
        String(36),
        ForeignKey("strategy.signal_events.id", ondelete="SET NULL"),
        nullable=True
    )
    exit_signal_id = Column(
        String(36),
        ForeignKey("strategy.signal_events.id", ondelete="SET NULL"),
        nullable=True
    )
    entry_trade_event_id = Column(
        String(36),
        ForeignKey("backtesting.trade_events.id", ondelete="SET NULL"),
        nullable=True
    )
    exit_trade_event_id = Column(
        String(36),
        ForeignKey("backtesting.trade_events.id", ondelete="SET NULL"),
        nullable=True
    )
    entry_timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    exit_timestamp = Column(DateTime(timezone=True), nullable=False)
    entry_price = Column(Numeric(18, 8), nullable=False)
    exit_price = Column(Numeric(18, 8), nullable=False)
    quantity = Column(Numeric(18, 8), nullable=False)
    entry_notional = Column(Numeric(18, 8), nullable=False)
    exit_notional = Column(Numeric(18, 8), nullable=False)
    entry_commission = Column(Numeric(18, 8), nullable=False, default=0.0)
    exit_commission = Column(Numeric(18, 8), nullable=False, default=0.0)
    entry_slippage = Column(Numeric(18, 8), nullable=False, default=0.0)
    exit_slippage = Column(Numeric(18, 8), nullable=False, default=0.0)
    total_cost = Column(Numeric(18, 8), nullable=False, default=0.0)
    gross_pnl = Column(Numeric(18, 8), nullable=False)
    net_pnl = Column(Numeric(18, 8), nullable=False)
    trade_return = Column(Numeric(18, 8), nullable=False)
    duration_days = Column(Numeric(18, 4), nullable=False, default=0.0)
    exit_reason = Column(String(32), nullable=False, default="SIGNAL")

    backtest = relationship("Backtest", back_populates="completed_trades")
    instrument = relationship("Instrument")


class BacktestPortfolioState(BaseModel):
    """
    Daily/periodic valuation and position state snapshot during backtest timeline.
    """
    __tablename__ = "portfolio_states"
    __table_args__ = (
        {"schema": "backtesting"}
    )

    backtest_id = Column(
        String(36),
        ForeignKey("backtesting.backtests.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    cash = Column(Numeric(18, 8), nullable=False)
    position_quantity = Column(Numeric(18, 8), nullable=False)
    market_price = Column(Numeric(18, 8), nullable=False)
    position_value = Column(Numeric(18, 8), nullable=False)
    portfolio_value = Column(Numeric(18, 8), nullable=False)
    unrealized_pnl = Column(Numeric(18, 8), nullable=True, default=0.0)

    backtest = relationship("Backtest", back_populates="portfolio_states")
