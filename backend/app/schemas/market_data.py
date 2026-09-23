from datetime import date
from pydantic import BaseModel, Field

class MarketDataRequest(BaseModel):
    symbol: str = Field(min_length=1)
    start_date: date
    end_date: date
    interval: str = "1d"
