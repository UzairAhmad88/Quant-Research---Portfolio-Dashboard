from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator


class BacktestCreate(BaseModel):
    instrument_id: str = Field(..., description="Target Instrument UUID")
    strategy_configuration_id: str = Field(..., description="Target Strategy Configuration UUID")
    start_date: Optional[datetime] = Field(default=None, description="Simulation start date (UTC)")
    end_date: Optional[datetime] = Field(default=None, description="Simulation end date (UTC)")
    initial_capital: float = Field(default=100000.0, gt=0, description="Simulation starting capital")
    execution_timing: str = Field(default="NEXT_OPEN", description="Execution timing rule ('NEXT_OPEN')")
    position_sizing: str = Field(default="FULL_CAPITAL", description="Position sizing model ('FULL_CAPITAL')")
    commission: float = Field(default=0.0, ge=0, description="Fractional commission rate (e.g. 0.001)")
    slippage: float = Field(default=0.0, ge=0, description="Fractional slippage rate (e.g. 0.0005)")
    direction: str = Field(default="LONG_ONLY", description="Trade direction ('LONG_ONLY')")

    @field_validator("execution_timing")
    @classmethod
    def validate_execution_timing(cls, v: str) -> str:
        clean = v.upper().strip()
        if clean not in ("NEXT_OPEN",):
            raise ValueError("Unsupported execution timing. Must be 'NEXT_OPEN'.")
        return clean

    @field_validator("position_sizing")
    @classmethod
    def validate_position_sizing(cls, v: str) -> str:
        clean = v.upper().strip()
        if clean not in ("FULL_CAPITAL",):
            raise ValueError("Unsupported position sizing model. Must be 'FULL_CAPITAL'.")
        return clean

    @field_validator("direction")
    @classmethod
    def validate_direction(cls, v: str) -> str:
        clean = v.upper().strip()
        if clean not in ("LONG_ONLY",):
            raise ValueError("Unsupported backtest direction. Must be 'LONG_ONLY'.")
        return clean


class TradeEventResponse(BaseModel):
    id: str
    backtest_id: str
    signal_id: Optional[str] = None
    instrument_id: str
    side: str
    signal_timestamp: Optional[datetime] = None
    execution_timestamp: datetime
    execution_reason: str
    execution_price: float
    quantity: float
    notional_value: float
    commission: float
    slippage: float
    cash_after: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PortfolioStateResponse(BaseModel):
    id: str
    backtest_id: str
    timestamp: datetime
    cash: float
    position_quantity: float
    market_price: float
    position_value: float
    portfolio_value: float
    unrealized_pnl: Optional[float] = 0.0

    model_config = ConfigDict(from_attributes=True)


class CompletedTradeResponse(BaseModel):
    id: str
    backtest_id: str
    instrument_id: str
    entry_signal_id: Optional[str] = None
    exit_signal_id: Optional[str] = None
    entry_trade_event_id: Optional[str] = None
    exit_trade_event_id: Optional[str] = None
    entry_timestamp: datetime
    exit_timestamp: datetime
    entry_price: float
    exit_price: float
    quantity: float
    entry_notional: float
    exit_notional: float
    entry_commission: float
    exit_commission: float
    entry_slippage: float
    exit_slippage: float
    total_cost: float
    gross_pnl: float
    net_pnl: float
    trade_return: float
    duration_days: float
    exit_reason: str

    model_config = ConfigDict(from_attributes=True)


class BacktestResponse(BaseModel):
    id: str
    strategy_configuration_id: str
    instrument_id: str
    symbol: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    initial_capital: float
    execution_timing: str
    position_sizing: str
    commission: float
    slippage: float
    direction: str
    status: str
    final_cash: Optional[float] = None
    final_position: Optional[float] = None
    final_portfolio_value: Optional[float] = None
    trade_count: Optional[int] = None
    completed_trade_count: Optional[int] = None
    portfolio_state_count: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BacktestListResponse(BaseModel):
    items: List[BacktestResponse]
    total: int
    limit: int
    offset: int

    model_config = ConfigDict(from_attributes=True)


class ReturnMetrics(BaseModel):
    total_return: float
    annualized_return: Optional[float] = None
    observation_count: int
    elapsed_days: float


class RiskMetrics(BaseModel):
    volatility: Optional[float] = None
    annualized_volatility: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    risk_free_rate: float = 0.0
    annualization_factor: int = 252


class DrawdownMetrics(BaseModel):
    max_drawdown: Optional[float] = 0.0
    max_drawdown_duration_days: Optional[float] = 0.0
    calmar_ratio: Optional[float] = None


class TradeSummaryInfo(BaseModel):
    trade_id: str
    net_pnl: float
    trade_return: float
    entry_timestamp: Optional[datetime] = None
    exit_timestamp: Optional[datetime] = None


class TradeMetrics(BaseModel):
    trade_count: int
    win_rate: Optional[float] = None
    average_win: Optional[float] = None
    average_loss: Optional[float] = None
    profit_factor: Optional[float] = None
    average_trade_return: Optional[float] = None
    best_trade: Optional[TradeSummaryInfo] = None
    worst_trade: Optional[TradeSummaryInfo] = None


class CostAndExposureMetrics(BaseModel):
    exposure: float
    turnover: float
    total_commission: float
    total_slippage_cost: float
    total_transaction_costs: float


class BacktestPerformanceResponse(BaseModel):
    backtest_id: str
    symbol: Optional[str] = None
    initial_capital: float
    final_portfolio_value: float
    returns: ReturnMetrics
    risk: RiskMetrics
    drawdown: DrawdownMetrics
    trading: TradeMetrics
    costs_and_exposure: CostAndExposureMetrics


class EquityPoint(BaseModel):
    timestamp: datetime
    portfolio_value: float
    cumulative_return: float
    running_peak: float
    drawdown: float
    cash: float
    position_value: float
    position_quantity: float


class BacktestEquityResponse(BaseModel):
    backtest_id: str
    initial_capital: float
    equity_series: List[EquityPoint]


class DrawdownPoint(BaseModel):
    timestamp: datetime
    portfolio_value: float
    running_peak: float
    drawdown_amount: float
    drawdown_percentage: float


class DrawdownPeriodResponse(BaseModel):
    id: str
    peak_timestamp: datetime
    trough_timestamp: datetime
    recovery_timestamp: Optional[datetime] = None
    peak_equity: float
    trough_equity: float
    drawdown_amount: float
    drawdown_percentage: float
    duration_days: float
    recovery_duration_days: Optional[float] = None
    status: str  # "RECOVERED" | "ACTIVE"


class BacktestDrawdownSeriesResponse(BaseModel):
    backtest_id: str
    initial_capital: float
    max_drawdown: float
    max_drawdown_duration_days: float
    current_drawdown: float
    current_drawdown_amount: float
    current_status: str
    drawdown_series: List[DrawdownPoint]


class BacktestDrawdownPeriodsResponse(BaseModel):
    backtest_id: str
    total_periods: int
    active_periods_count: int
    recovered_periods_count: int
    periods: List[DrawdownPeriodResponse]
