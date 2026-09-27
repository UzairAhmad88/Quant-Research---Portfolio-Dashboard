from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class DashboardSummary(BaseModel):
    tracked_instruments_count: int
    portfolios_count: int
    strategy_configurations_count: int
    completed_backtests_count: int

    model_config = ConfigDict(from_attributes=True)


class DashboardSystemStatus(BaseModel):
    data_status: str  # "Good", "Good with Warnings", "No Data"
    backend_status: str = "ONLINE"
    database_connected: bool = True
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)


class MarketDataInstrumentItem(BaseModel):
    id: str
    symbol: str
    name: str
    asset_type: str
    exchange: str
    provider: Optional[str] = None
    frequency: Optional[str] = None
    latest_observation_date: Optional[datetime] = None
    latest_price: Optional[float] = None
    observation_count: int = 0
    data_quality: str = "No Data"  # "Good", "Good with Warnings", "No Data"
    freshness_label: str  # e.g., "Latest Observation: 2026-09-24" or "No Observation"
    freshness_state: Optional[str] = "UNAVAILABLE"  # "CURRENT", "RECENT", "STALE", "UNKNOWN", "UNAVAILABLE"

    model_config = ConfigDict(from_attributes=True)



class DashboardPortfolioItem(BaseModel):
    id: str
    name: str
    initial_capital: float
    positions_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardPortfolioSnapshot(BaseModel):
    active_portfolios_count: int
    total_portfolio_value: float
    total_portfolio_return_pct: float
    total_cash: float
    total_positions_count: int
    portfolios: List[DashboardPortfolioItem]

    model_config = ConfigDict(from_attributes=True)


class DashboardSignalItem(BaseModel):
    id: str
    symbol: str
    strategy_type: str
    signal_type: str  # "BUY", "SELL"
    signal_state: str  # "BULLISH", "BEARISH"
    price: float
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardStrategySnapshot(BaseModel):
    strategy_configurations_count: int
    recent_signals: List[DashboardSignalItem]

    model_config = ConfigDict(from_attributes=True)


class DashboardBacktestItem(BaseModel):
    id: str
    instrument_symbol: str
    strategy_name: str
    period: str
    status: str  # "PENDING", "RUNNING", "COMPLETED", "COMPLETED_WITH_WARNINGS", "FAILED"
    total_return_pct: Optional[float] = None
    max_drawdown_pct: Optional[float] = None
    trade_count: Optional[int] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DashboardActivityItem(BaseModel):
    id: str
    timestamp: datetime
    activity_type: str  # "MARKET_DATA_INGESTION", "PORTFOLIO_CREATED", "STRATEGY_SIGNAL", "BACKTEST_COMPLETED"
    entity_symbol_or_name: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class DashboardOverviewResponse(BaseModel):
    summary: DashboardSummary
    system_status: DashboardSystemStatus
    market_data_snapshot: List[MarketDataInstrumentItem]
    portfolio_snapshot: DashboardPortfolioSnapshot
    strategy_snapshot: DashboardStrategySnapshot
    recent_backtests: List[DashboardBacktestItem]
    recent_activity: List[DashboardActivityItem]

    model_config = ConfigDict(from_attributes=True)
