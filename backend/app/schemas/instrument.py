from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import AssetType

class InstrumentBase(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=32, description="Canonical ticker symbol (e.g. AAPL)")
    name: str = Field(..., min_length=1, max_length=255, description="Full instrument name")
    asset_type: AssetType = Field(..., description="Asset class category")
    exchange: str = Field(default="UNKNOWN", max_length=64, description="Primary exchange or listing venue")
    currency: str = Field(default="USD", max_length=16, description="Trading currency")
    country: Optional[str] = Field(default=None, max_length=64)
    provider_symbol: Optional[str] = Field(default=None, max_length=64)
    active: bool = Field(default=True)
    metadata_json: Optional[Dict[str, Any]] = Field(default=None)

class InstrumentCreate(InstrumentBase):
    pass

class InstrumentUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=255)
    exchange: Optional[str] = Field(default=None, max_length=64)
    currency: Optional[str] = Field(default=None, max_length=16)
    country: Optional[str] = Field(default=None, max_length=64)
    provider_symbol: Optional[str] = Field(default=None, max_length=64)
    active: Optional[bool] = Field(default=None)
    metadata_json: Optional[Dict[str, Any]] = Field(default=None)

class InstrumentResponse(InstrumentBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InstrumentFilter(BaseModel):
    symbol: Optional[str] = None
    asset_type: Optional[AssetType] = None
    active_only: bool = True
    limit: int = Field(default=50, ge=1, le=500)
    offset: int = Field(default=0, ge=0)
