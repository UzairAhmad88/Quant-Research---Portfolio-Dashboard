from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, field_validator


class StrategyConfigurationResponse(BaseModel):
    id: str
    strategy_type: str
    instrument_id: str
    configuration_hash: str
    ma_type: Optional[str] = None
    fast_window: Optional[int] = None
    slow_window: Optional[int] = None
    price_source: Optional[str] = None
    configuration_json: Dict[str, Any]
    active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SignalEventResponse(BaseModel):
    id: str
    strategy_configuration_id: str
    instrument_id: str
    strategy_type: str = "MOVING_AVERAGE"
    timestamp: datetime
    signal_type: str = Field(..., description="'BUY' or 'SELL'")
    signal_state: str = Field(..., description="'BULLISH', 'BEARISH', or 'NEUTRAL'")
    price: float = Field(..., description="Execution baseline price at signal timestamp")
    source: str = Field(default="STRATEGY_ENGINE", description="Origin of signal generation")
    metadata: Optional[Dict[str, Any]] = Field(default=None, validation_alias="metadata_json")
    created_at: datetime
    configuration: Optional[StrategyConfigurationResponse] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @field_validator("strategy_type", mode="before")
    @classmethod
    def extract_strategy_type(cls, v, info):
        if isinstance(v, str) and v:
            return v
        # Attempt to read strategy_type from configuration if available
        config = getattr(info.data.get("configuration"), "strategy_type", None) if info.data else None
        return config or "MOVING_AVERAGE"


class SignalListResponse(BaseModel):
    items: List[SignalEventResponse]
    total: int
    limit: int
    offset: int

    model_config = ConfigDict(from_attributes=True)
