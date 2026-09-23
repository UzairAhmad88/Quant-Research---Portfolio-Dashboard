from fastapi import APIRouter, status
from app.core.exceptions import AppException

returns_router = APIRouter()
portfolio_router = APIRouter()
correlation_router = APIRouter()
volatility_router = APIRouter()
strategies_router = APIRouter()
backtesting_router = APIRouter()

@returns_router.get("", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def get_returns_placeholder():
    raise AppException(
        message="Return Calculator module API is scaffolded and scheduled for Step 05.",
        code="NOT_IMPLEMENTED",
        status_code=status.HTTP_501_NOT_IMPLEMENTED
    )

@portfolio_router.get("", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def get_portfolio_placeholder():
    raise AppException(
        message="Portfolio Analytics module API is scaffolded and scheduled for Step 06.",
        code="NOT_IMPLEMENTED",
        status_code=status.HTTP_501_NOT_IMPLEMENTED
    )

@correlation_router.get("", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def get_correlation_placeholder():
    raise AppException(
        message="Correlation Matrix module API is scaffolded and scheduled for Step 07.",
        code="NOT_IMPLEMENTED",
        status_code=status.HTTP_501_NOT_IMPLEMENTED
    )

@volatility_router.get("", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def get_volatility_placeholder():
    raise AppException(
        message="Volatility Analytics module API is scaffolded and scheduled for Step 08.",
        code="NOT_IMPLEMENTED",
        status_code=status.HTTP_501_NOT_IMPLEMENTED
    )

@strategies_router.get("", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def get_strategies_placeholder():
    raise AppException(
        message="Quantitative Strategies module API is scaffolded and scheduled for Step 09.",
        code="NOT_IMPLEMENTED",
        status_code=status.HTTP_501_NOT_IMPLEMENTED
    )

@backtesting_router.get("", status_code=status.HTTP_501_NOT_IMPLEMENTED)
def get_backtesting_placeholder():
    raise AppException(
        message="Backtesting Engine module API is scaffolded and scheduled for Step 10.",
        code="NOT_IMPLEMENTED",
        status_code=status.HTTP_501_NOT_IMPLEMENTED
    )
