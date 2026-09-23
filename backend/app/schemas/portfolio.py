from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

class PortfolioHoldingCreate(BaseModel):
    instrument_id: str = Field(..., description="UUID of target Instrument")
    quantity: float = Field(..., gt=0, description="Position quantity (> 0)")
    entry_price: float = Field(..., gt=0, description="Entry cost price per unit (> 0)")
    entry_date: Optional[datetime] = Field(default=None, description="Date of position entry")
    target_weight: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Target allocation weight (0 to 100 or 0.0 to 1.0)")

class PortfolioHoldingUpdate(BaseModel):
    quantity: Optional[float] = Field(default=None, gt=0)
    entry_price: Optional[float] = Field(default=None, gt=0)
    target_weight: Optional[float] = Field(default=None, ge=0.0, le=100.0)

class PortfolioHoldingResponse(BaseModel):
    id: str
    portfolio_id: str
    instrument_id: str
    symbol: str
    name: str
    asset_type: str
    quantity: float
    entry_price: float
    entry_date: Optional[datetime] = None
    target_weight: Optional[float] = None
    initial_value: float
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PortfolioCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128, description="Unique portfolio name")
    description: Optional[str] = Field(default=None, max_length=512)
    base_currency: str = Field(default="USD", max_length=16)
    initial_capital: float = Field(default=100000.0, gt=0, description="Initial total portfolio capital (> 0)")
    holdings: Optional[List[PortfolioHoldingCreate]] = Field(default=None, description="Initial holdings list")

class PortfolioUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=128)
    description: Optional[str] = Field(default=None, max_length=512)
    initial_capital: Optional[float] = Field(default=None, gt=0)
    is_active: Optional[bool] = None

class PortfolioResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    base_currency: str
    initial_capital: float
    is_active: bool
    holdings: List[PortfolioHoldingResponse] = Field(default_factory=list)
    invested_value: float = 0.0
    cash: float = 0.0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class HoldingAnalyticsItem(BaseModel):
    holding_id: str
    instrument_id: str
    symbol: str
    name: str
    asset_type: str
    quantity: float
    entry_price: float
    current_price: float
    initial_value: float
    current_value: float
    invested_weight: float
    total_weight: float
    target_weight: Optional[float] = None
    pnl_amount: float
    pnl_percent: float
    contribution_percent: float

class AllocationItem(BaseModel):
    label: str
    symbol: Optional[str] = None
    value: float
    weight: float
    color: Optional[str] = None

class PerformancePoint(BaseModel):
    timestamp: datetime
    portfolio_value: float
    invested_value: float
    cumulative_return: float

class PortfolioSummaryItem(BaseModel):
    initial_capital: float
    initial_invested_value: float
    cash: float
    current_invested_value: float
    current_portfolio_value: float
    total_pnl: float
    total_return: float

class PortfolioAnalyticsResponse(BaseModel):
    portfolio_id: str
    name: str
    base_currency: str
    price_source: str
    quality_status: str
    quality_warnings: List[str] = Field(default_factory=list)
    summary: PortfolioSummaryItem
    holdings: List[HoldingAnalyticsItem] = Field(default_factory=list)
    allocation: List[AllocationItem] = Field(default_factory=list)
    performance_series: List[PerformancePoint] = Field(default_factory=list)
