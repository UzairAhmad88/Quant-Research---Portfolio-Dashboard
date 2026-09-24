from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class VolatilitySummary(BaseModel):
    daily_volatility: Optional[float] = Field(default=None, description="Sample standard deviation of daily returns")
    annualized_volatility: Optional[float] = Field(default=None, description="Daily volatility scaled by sqrt(annualization_factor)")
    upside_volatility: Optional[float] = Field(default=None, description="Sample standard deviation of positive returns (r > 0)")
    downside_volatility: Optional[float] = Field(default=None, description="Sample standard deviation of negative returns (r < 0)")
    observation_count: int = Field(default=0, description="Total valid return observations")
    annualization_factor: int = Field(default=252, description="252 for equities/ETFs/indices, 365 for crypto")


class RollingVolatilityPoint(BaseModel):
    timestamp: datetime = Field(..., description="UTC timestamp of the observation")
    rolling_volatility: Optional[float] = Field(default=None, description="Rolling standard deviation over window N")


class ReturnHistogramBin(BaseModel):
    bin_start: float
    bin_end: float
    bin_center: float
    count: int
    frequency_pct: float


class ReturnDistributionSummary(BaseModel):
    mean: float
    median: float
    min: float
    max: float
    std_dev: float
    positive_observations: int
    negative_observations: int
    zero_observations: int
    total_observations: int


class ReturnDistributionResponse(BaseModel):
    summary: ReturnDistributionSummary
    histogram: List[ReturnHistogramBin] = Field(default_factory=list)


class SingleVolatilityResponse(BaseModel):
    instrument_id: str
    symbol: str
    name: Optional[str] = None
    asset_type: str
    price_source: str
    return_type: str
    rolling_window: int
    annualized: bool
    quality_status: str
    quality_warning: Optional[str] = None
    is_sufficient: bool = True
    message: Optional[str] = None
    summary: VolatilitySummary
    rolling_series: List[RollingVolatilityPoint] = Field(default_factory=list)
    distribution: ReturnDistributionResponse

    model_config = ConfigDict(from_attributes=True)


class InstrumentVolatilityItem(BaseModel):
    instrument_id: str
    symbol: str
    name: Optional[str] = None
    asset_type: str
    observation_count: int
    daily_volatility: Optional[float]
    annualized_volatility: Optional[float]
    upside_volatility: Optional[float]
    downside_volatility: Optional[float]
    annualization_factor: int
    is_sufficient: bool = True
    message: Optional[str] = None


class MultiVolatilityResponse(BaseModel):
    return_type: str
    price_source: str
    instruments: List[InstrumentVolatilityItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
