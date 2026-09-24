from fastapi import APIRouter
from app.api.v1 import (
    health,
    instruments,
    market_data,
    returns,
    portfolios,
    correlation,
    volatility,
    strategies,
    signals,
    placeholders,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(instruments.router, prefix="/instruments", tags=["Instruments"])
api_router.include_router(market_data.router, prefix="/market-data", tags=["Market Data"])
api_router.include_router(returns.router, prefix="/returns", tags=["Returns"])
api_router.include_router(portfolios.router, tags=["Portfolios"])
api_router.include_router(correlation.router, tags=["Correlation"])
api_router.include_router(volatility.router, tags=["Volatility"])
api_router.include_router(strategies.router, tags=["Strategies"])
api_router.include_router(signals.router, tags=["Signals"])

api_router.include_router(placeholders.backtesting_router, prefix="/backtesting", tags=["Backtesting"])


