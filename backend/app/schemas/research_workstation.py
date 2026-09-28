from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


# --- Watchlists ---
class WatchlistItemCreate(BaseModel):
    symbol: str
    notes: Optional[str] = None


class WatchlistItemResponse(BaseModel):
    id: str
    symbol: str
    display_order: int
    notes: Optional[str] = None
    added_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WatchlistCreate(BaseModel):
    name: str
    description: Optional[str] = None
    symbols: Optional[List[str]] = []


class WatchlistResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_default: bool
    created_at: datetime
    items: List[WatchlistItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- Alerts ---
class AlertRuleCreate(BaseModel):
    symbol: str
    alert_type: str  # PRICE_ABOVE, PRICE_BELOW, CHANGE_PCT, VOLATILITY, MA_CROSSOVER, DRAWDOWN
    threshold: float
    comparator: str = ">"
    message: Optional[str] = None


class AlertRuleResponse(BaseModel):
    id: str
    symbol: str
    alert_type: str
    threshold: float
    comparator: str
    status: str
    message: Optional[str] = None
    triggered_at: Optional[datetime] = None
    triggered_value: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Feature Engineering ---
class FeatureExploreRequest(BaseModel):
    symbol: str
    feature_name: str
    window: int = 14


# --- Risk ---
class RiskAnalysisRequest(BaseModel):
    symbol: Optional[str] = "AAPL"
    portfolio_id: Optional[str] = None
    confidence_level: float = 0.95
    portfolio_value: float = 1000000.0
    benchmark_symbol: str = "SPY"


# --- Regime Detection ---
class RegimeDetectionRequest(BaseModel):
    symbol: str = "AAPL"
    sma_fast: int = 50
    sma_slow: int = 200
    vol_lookback: int = 20


# --- Monte Carlo ---
class MonteCarloRequest(BaseModel):
    symbol: str = "AAPL"
    simulations_count: int = 1000
    initial_capital: float = 100000.0
    horizon_periods: Optional[int] = None
    random_seed: Optional[int] = 42


# --- Parameter Sweep ---
class ParameterSweepRequest(BaseModel):
    symbol: str = "AAPL"
    fast_range: List[int] = [10, 20, 30, 40, 50]
    slow_range: List[int] = [50, 100, 150, 200]
    initial_capital: float = 100000.0


# --- Research Experiments & Notes ---
class ResearchExperimentCreate(BaseModel):
    id: str  # EXP-0042
    name: str
    hypothesis: str
    dataset_identifier: str
    strategy_name: str
    parameters: Dict[str, Any] = {}
    metrics: Dict[str, Any] = {}
    notes: Optional[str] = None


class ResearchNoteCreate(BaseModel):
    title: str
    research_question: str
    instruments: List[str] = []
    strategy_ref: Optional[str] = None
    backtest_ref: Optional[str] = None
    observations: Optional[str] = None
    conclusion: Optional[str] = None
    tags: List[str] = []
