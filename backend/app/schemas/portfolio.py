from pydantic import BaseModel, Field

class PortfolioHolding(BaseModel):
    symbol: str
    weight: float = Field(ge=0, le=1)

class PortfolioRequest(BaseModel):
    holdings: list[PortfolioHolding]
