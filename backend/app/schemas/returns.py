from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import DataFrequency

class ReturnObservation(BaseModel):
    timestamp: datetime = Field(..., description="UTC observation timestamp")
    price: float = Field(..., description="Price used for return calculation")
    simple_return: Optional[float] = Field(default=None, description="Simple percentage return R_t")
    log_return: Optional[float] = Field(default=None, description="Logarithmic return r_t")
    cumulative_return: float = Field(..., description="Compounded cumulative simple return C_t")

class ReturnSummary(BaseModel):
    period_return: float = Field(..., description="Total return across selected window")
    annualized_return: float = Field(..., description="CAGR annualized return")
    cumulative_return: float = Field(..., description="Final cumulative return value")
    positive_periods: int = Field(..., description="Count of positive return periods")
    negative_periods: int = Field(..., description="Count of negative return periods")
    best_period: Optional[float] = Field(default=None, description="Maximum single-period return")
    worst_period: Optional[float] = Field(default=None, description="Minimum single-period return")
    annualization_factor: int = Field(default=252, description="Annualization trading/calendar days factor")

class ReturnAnalysisResponse(BaseModel):
    instrument_id: str
    symbol: str
    asset_type: str
    price_source: str = Field(..., description="'adjusted' or 'close'")
    return_type: str = Field(..., description="'simple' or 'log'")
    frequency: DataFrequency = Field(default=DataFrequency.DAILY)
    quality_status: str
    quality_warning: Optional[str] = None
    summary: ReturnSummary
    series: List[ReturnObservation] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
