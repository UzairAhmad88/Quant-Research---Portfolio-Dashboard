from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from app.schemas.backtest import (
    ReturnMetrics,
    RiskMetrics,
    DrawdownMetrics,
    TradeMetrics,
    CostAndExposureMetrics,
    DrawdownPeriodResponse,
)


class ReportExecutiveSummary(BaseModel):
    symbol: Optional[str] = None
    instrument_name: Optional[str] = None
    strategy_name: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    initial_capital: float
    final_portfolio_value: float
    total_return: float
    annualized_return: Optional[float] = None
    annualized_volatility: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    trade_count: int
    win_rate: Optional[float] = None


class ReportConfigurationSnapshot(BaseModel):
    backtest_id: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    instrument_id: str
    symbol: Optional[str] = None
    asset_type: Optional[str] = None
    currency: Optional[str] = None
    initial_capital: float
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    data_frequency: str
    price_source: str


class ReportStrategyConfiguration(BaseModel):
    strategy_configuration_id: str
    strategy_type: str
    ma_type: Optional[str] = None
    fast_window: Optional[int] = None
    slow_window: Optional[int] = None
    price_source: str
    direction: str


class ReportSignalsSummary(BaseModel):
    total_signals: int
    buy_signals: int
    sell_signals: int
    first_signal_timestamp: Optional[datetime] = None
    last_signal_timestamp: Optional[datetime] = None


class ReportMarketDataProvenance(BaseModel):
    instrument_id: str
    symbol: Optional[str] = None
    provider: str
    provider_symbol: Optional[str] = None
    frequency: str
    price_source: str
    requested_start: Optional[datetime] = None
    requested_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    observation_count: int
    latest_observation_timestamp: Optional[datetime] = None
    data_quality_status: str


class ReportExecutionAssumptions(BaseModel):
    execution_model: str
    position_direction: str
    position_sizing: str
    fractional_quantity_allowed: bool
    initial_capital: float
    forced_close_at_end: bool
    forced_close_price_source: str


class ReportCostAssumptions(BaseModel):
    commission_rate: float
    slippage_rate: float
    commission_type: str
    slippage_type: str


class ReportPerformanceSummary(BaseModel):
    returns: ReturnMetrics
    risk: RiskMetrics
    drawdown: DrawdownMetrics
    trading: TradeMetrics
    costs_and_exposure: CostAndExposureMetrics


class ReportEquitySummary(BaseModel):
    initial_capital: float
    final_portfolio_value: float
    total_return: float
    running_peak: float
    cumulative_return: float
    observation_count: int


class ReportDrawdownSummary(BaseModel):
    max_drawdown_percentage: float
    current_drawdown_percentage: float
    current_drawdown_amount: float
    running_peak: float
    current_status: str
    period_count: int
    active_period_count: int
    longest_duration_days: int
    periods: List[DrawdownPeriodResponse]


class ReportAccountingSummary(BaseModel):
    initial_cash: float
    final_cash: float
    final_position_quantity: float
    final_position_value: float
    final_portfolio_value: float
    realized_pnl: float
    unrealized_pnl: float
    total_commission: float
    total_slippage: float
    total_transaction_costs: float


class ReportDataQuality(BaseModel):
    overall_status: str
    validation_status: str
    warnings: List[str]
    coverage_ratio: float
    observation_count: int


class ReportReproducibility(BaseModel):
    backtest_id: str
    strategy_configuration_id: str
    instrument_id: str
    symbol: Optional[str] = None
    provider: str
    data_frequency: str
    price_source: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    execution_timing: str
    position_sizing: str
    commission: float
    slippage: float
    initial_capital: float
    created_at: datetime
    completed_at: Optional[datetime] = None
    configuration_hash: str


class BacktestReportResponse(BaseModel):
    report_version: str = "1.0"
    generated_at: datetime
    backtest_id: str
    configuration_hash: str
    status: str
    warnings: List[str] = Field(default_factory=list)

    executive_summary: ReportExecutiveSummary
    configuration: ReportConfigurationSnapshot
    strategy: ReportStrategyConfiguration
    signals_summary: ReportSignalsSummary
    market_data: ReportMarketDataProvenance
    execution_assumptions: ReportExecutionAssumptions
    cost_assumptions: ReportCostAssumptions
    performance: ReportPerformanceSummary
    equity_summary: ReportEquitySummary
    drawdown_summary: ReportDrawdownSummary
    accounting: ReportAccountingSummary
    data_quality: ReportDataQuality
    methodology: List[str]
    limitations: List[str]
    reproducibility: ReportReproducibility
