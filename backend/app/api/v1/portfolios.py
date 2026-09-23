from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.portfolio_service import PortfolioService
from app.services.portfolio_analytics_service import PortfolioAnalyticsService
from app.schemas.portfolio import (
    PortfolioCreate,
    PortfolioUpdate,
    PortfolioResponse,
    PortfolioHoldingCreate,
    PortfolioHoldingUpdate,
    PortfolioHoldingResponse,
    PortfolioAnalyticsResponse,
)

router = APIRouter(prefix="/portfolios", tags=["portfolios"])

@router.get("", response_model=List[PortfolioResponse])
def list_portfolios(
    active_only: bool = Query(True, description="Filter for active portfolios"),
    db: Session = Depends(get_db),
):
    service = PortfolioService(db)
    return service.list_portfolios(active_only=active_only)

@router.post("", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
def create_portfolio(
    payload: PortfolioCreate,
    db: Session = Depends(get_db),
):
    service = PortfolioService(db)
    return service.create_portfolio(payload)

@router.get("/{portfolio_id}", response_model=PortfolioResponse)
def get_portfolio(
    portfolio_id: str,
    db: Session = Depends(get_db),
):
    service = PortfolioService(db)
    return service.get_portfolio(portfolio_id)

@router.patch("/{portfolio_id}", response_model=PortfolioResponse)
def update_portfolio(
    portfolio_id: str,
    payload: PortfolioUpdate,
    db: Session = Depends(get_db),
):
    service = PortfolioService(db)
    return service.update_portfolio(portfolio_id, payload)

@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_portfolio(
    portfolio_id: str,
    db: Session = Depends(get_db),
):
    service = PortfolioService(db)
    service.deactivate_portfolio(portfolio_id)
    return None

@router.post("/{portfolio_id}/holdings", response_model=PortfolioHoldingResponse, status_code=status.HTTP_201_CREATED)
def add_holding(
    portfolio_id: str,
    payload: PortfolioHoldingCreate,
    db: Session = Depends(get_db),
):
    service = PortfolioService(db)
    return service.add_holding(portfolio_id, payload)

@router.patch("/{portfolio_id}/holdings/{holding_id}", response_model=PortfolioHoldingResponse)
def update_holding(
    portfolio_id: str,
    holding_id: str,
    payload: PortfolioHoldingUpdate,
    db: Session = Depends(get_db),
):
    service = PortfolioService(db)
    return service.update_holding(portfolio_id, holding_id, payload)

@router.delete("/{portfolio_id}/holdings/{holding_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_holding(
    portfolio_id: str,
    holding_id: str,
    db: Session = Depends(get_db),
):
    service = PortfolioService(db)
    service.remove_holding(portfolio_id, holding_id)
    return None

@router.get("/{portfolio_id}/analytics", response_model=PortfolioAnalyticsResponse)
def get_portfolio_analytics(
    portfolio_id: str,
    start_date: Optional[datetime] = Query(None, description="Start date filter (ISO format)"),
    end_date: Optional[datetime] = Query(None, description="End date filter (ISO format)"),
    price_source: str = Query("adjusted", description="Price source: 'adjusted' or 'close'"),
    db: Session = Depends(get_db),
):
    analytics_service = PortfolioAnalyticsService(db)
    return analytics_service.calculate_analytics(
        portfolio_id=portfolio_id,
        start_date=start_date,
        end_date=end_date,
        price_source=price_source,
    )
