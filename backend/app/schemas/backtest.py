from datetime import date
from pydantic import BaseModel, Field

class MovingAverageBacktestRequest(BaseModel):
    symbol: str
    start_date: date
    end_date: date
    initial_capital: float = Field(gt=0)
    short_window: int = Field(gt=0)
    long_window: int = Field(gt=0)
    moving_average_type: str = "SMA"
    commission_rate: float = Field(default=0.0, ge=0)
    slippage_rate: float = Field(default=0.0, ge=0)
