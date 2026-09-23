from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.models.enums import DataFrequency

class OHLCVBase(BaseModel):
    instrument_id: str = Field(..., description="UUID of parent Instrument")
    timestamp: datetime = Field(..., description="UTC bar timestamp")
    frequency: DataFrequency = Field(default=DataFrequency.DAILY)
    open: float = Field(..., gt=0, description="Opening price (> 0)")
    high: float = Field(..., gt=0, description="High price (> 0)")
    low: float = Field(..., gt=0, description="Low price (> 0)")
    close: float = Field(..., gt=0, description="Closing price (> 0)")
    adjusted_close: Optional[float] = Field(default=None, gt=0)
    volume: float = Field(..., ge=0, description="Volume (>= 0)")
    provider: str = Field(default="ABSTRACT", max_length=64)
    provider_symbol: Optional[str] = Field(default=None, max_length=64)

    @model_validator(mode="after")
    def validate_high_gte_low(self) -> "OHLCVBase":
        if self.high < self.low:
            raise ValueError(f"High price ({self.high}) cannot be less than low price ({self.low})")
        return self

class OHLCVCreate(OHLCVBase):
    pass

class OHLCVBulkCreate(BaseModel):
    bars: List[OHLCVCreate]

class OHLCVResponse(OHLCVBase):
    id: str
    retrieved_at: datetime

    model_config = ConfigDict(from_attributes=True)

class OHLCVFilter(BaseModel):
    instrument_id: str
    frequency: DataFrequency = DataFrequency.DAILY
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = Field(default=1000, ge=1, le=10000)
