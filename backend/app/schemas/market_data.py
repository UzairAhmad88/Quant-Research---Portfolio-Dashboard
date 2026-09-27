from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.models.enums import DataFrequency, IngestionStatus

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
    instrument_id: Optional[str] = None
    frequency: DataFrequency = DataFrequency.DAILY
    provider: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = Field(default=50, ge=1, le=5000)
    offset: int = Field(default=0, ge=0)

ALLOWED_PROVIDERS = {"yahoo_finance", "yahoo", "YAHOO", "ABSTRACT"}

class MarketDataFetchRequest(BaseModel):
    instrument_id: Optional[str] = Field(default=None, max_length=64, description="Existing Instrument UUID")
    symbol: Optional[str] = Field(default=None, max_length=32, description="Ticker symbol (e.g. AAPL, BTC-USD)")
    start_date: Optional[datetime] = Field(default=None, description="Start of historical window")
    end_date: Optional[datetime] = Field(default=None, description="End of historical window")
    frequency: DataFrequency = Field(default=DataFrequency.DAILY)
    provider: str = Field(default="yahoo_finance", max_length=32, description="Market data provider name")
    force_refresh: bool = Field(default=False, description="Re-fetch requested window regardless of existing DB cache")

    @model_validator(mode="after")
    def validate_request(self) -> "MarketDataFetchRequest":
        if not self.instrument_id and not self.symbol:
            raise ValueError("Either instrument_id or symbol must be provided")
        if self.provider.strip().lower() not in [p.lower() for p in ALLOWED_PROVIDERS]:
            raise ValueError(f"Provider '{self.provider}' is not in the trusted allowlist ({', '.join(sorted(ALLOWED_PROVIDERS))})")
        if self.start_date and self.end_date:
            if self.start_date > self.end_date:
                raise ValueError("start_date cannot be after end_date")
            if (self.end_date - self.start_date).days > 365 * 35:
                raise ValueError("Requested historical date range exceeds maximum allowed limit of 35 years.")
        return self

class IngestionSummary(BaseModel):
    ingestion_id: str
    instrument_id: str
    symbol: str
    provider: str
    frequency: DataFrequency
    requested_start: datetime
    requested_end: datetime
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    rows_received: int
    rows_inserted: int
    rows_skipped: int
    rows_invalid: int
    duration_ms: int
    status: IngestionStatus
    warnings: List[str] = Field(default_factory=list)

class MarketDataFetchResponse(BaseModel):
    message: str
    summary: IngestionSummary

class InstrumentSearchResult(BaseModel):
    symbol: str
    name: str
    asset_type: str
    exchange: str
    currency: str
    provider_symbol: str
    existing_id: Optional[str] = None

class CoverageResponse(BaseModel):
    instrument_id: str
    symbol: str
    total_bars: int
    min_timestamp: Optional[datetime] = None
    max_timestamp: Optional[datetime] = None
    requested_start: Optional[datetime] = None
    requested_end: Optional[datetime] = None
    missing_start: Optional[datetime] = None
    missing_end: Optional[datetime] = None
    has_missing_range: bool = False

class IngestionLogResponse(BaseModel):
    id: str
    instrument_id: Optional[str]
    provider: str
    requested_start: datetime
    requested_end: datetime
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    frequency: DataFrequency
    rows_received: int
    rows_inserted: int
    rows_skipped: int
    rows_invalid: int
    duration_ms: int
    status: IngestionStatus
    error_message: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProviderCapabilitiesResponse(BaseModel):
    provider_name: str
    historical: bool = True
    latest: bool = True
    intraday: bool = False
    streaming: bool = False
    supported_frequencies: List[str] = Field(default_factory=lambda: ["DAILY"])
    delayed_data: bool = True
    real_time_data: bool = False

    model_config = ConfigDict(from_attributes=True)

class LatestMarketDataResponse(BaseModel):
    instrument_id: str
    symbol: str
    name: str
    asset_type: str
    exchange: str
    currency: str
    price: float
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    adjusted_close: Optional[float] = None
    volume: Optional[float] = None
    previous_close: Optional[float] = None
    change: Optional[float] = None
    change_pct: Optional[float] = None
    market_timestamp: datetime
    received_at: datetime
    frequency: DataFrequency = DataFrequency.DAILY
    provider: str
    provider_symbol: Optional[str] = None
    freshness: str = "CURRENT"  # CURRENT, RECENT, STALE, UNKNOWN, UNAVAILABLE
    quality: str = "GOOD"       # GOOD, GOOD_WITH_WARNINGS, INVALID, NO_DATA
    is_cached: bool = False
    warning: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

