from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class CrossoverEvent(BaseModel):
    timestamp: datetime = Field(..., description="UTC timestamp of the crossover event")
    event_type: str = Field(..., description="'BULLISH' or 'BEARISH'")
    signal: str = Field(..., description="'BUY' or 'SELL'")
    price: float = Field(..., description="Observation price at crossover")
    fast_ma: float = Field(..., description="Fast Moving Average value at crossover")
    slow_ma: float = Field(..., description="Slow Moving Average value at crossover")


class StrategyObservation(BaseModel):
    timestamp: datetime = Field(..., description="UTC timestamp of observation")
    price: float = Field(..., description="Asset price")
    fast_ma: Optional[float] = Field(default=None, description="Fast Moving Average value")
    slow_ma: Optional[float] = Field(default=None, description="Slow Moving Average value")
    signal: str = Field(..., description="'BUY', 'SELL', or 'HOLD'")


class StrategySummary(BaseModel):
    instrument_id: str
    symbol: str
    name: Optional[str] = None
    asset_type: str
    price_source: str
    ma_type: str
    fast_window: int
    slow_window: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    observation_count: int
    current_signal: str = Field(..., description="Current research strategy state ('BUY', 'SELL', or 'HOLD')")
    latest_signal_event: Optional[str] = Field(default=None, description="Most recent signal event ('BUY' or 'SELL')")
    last_crossover: Optional[datetime] = Field(default=None, description="Timestamp of most recent crossover")
    bullish_crossover_count: int = Field(default=0, description="Total count of bullish crossovers")
    bearish_crossover_count: int = Field(default=0, description="Total count of bearish crossovers")


class MovingAverageStrategyResponse(BaseModel):
    summary: StrategySummary
    crossovers: List[CrossoverEvent] = Field(default_factory=list)
    series: List[StrategyObservation] = Field(default_factory=list)
    quality_status: str
    quality_warning: Optional[str] = None
    is_sufficient: bool = True
    message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
