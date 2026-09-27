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


@router.get("/{portfolio_id}/export", status_code=status.HTTP_200_OK, summary="Export portfolio holdings, summary, or analytics in CSV or JSON format")
def export_portfolio_data(
    portfolio_id: str,
    data_type: str = Query("holdings", description="Export data type: 'holdings', 'summary', or 'performance'"),
    format: str = Query("csv", description="Export format: 'csv' or 'json'"),
    start_date: Optional[datetime] = Query(None, description="Start date filter (ISO format)"),
    end_date: Optional[datetime] = Query(None, description="End date filter (ISO format)"),
    price_source: str = Query("adjusted", description="Price source: 'adjusted' or 'close'"),
    db: Session = Depends(get_db),
):
    from app.export import ExportService, ExportMetadata

    analytics_service = PortfolioAnalyticsService(db)
    analytics = analytics_service.calculate_analytics(
        portfolio_id=portfolio_id,
        start_date=start_date,
        end_date=end_date,
        price_source=price_source,
    )

    metadata = ExportMetadata(
        export_type=f"PORTFOLIO_{data_type.upper()}",
        date_range=f"{start_date.isoformat() if start_date else 'START'}_{end_date.isoformat() if end_date else 'END'}",
        price_source=price_source,
        extra={
            "portfolio_id": portfolio_id,
            "portfolio_name": analytics.portfolio_name,
            "base_currency": analytics.base_currency,
            "total_value": analytics.summary.current_portfolio_value,
        }
    )

    fmt_lower = format.lower().strip()
    if fmt_lower == "json":
        if data_type == "holdings":
            data = [h.model_dump(mode="json") for h in analytics.holdings]
        elif data_type == "performance":
            data = [p.model_dump(mode="json") for p in analytics.performance_history]
        else:
            data = analytics.model_dump(mode="json")
    else:
        if data_type == "performance":
            headers = ["timestamp", "portfolio_value", "invested_value", "cumulative_return"]
            rows = [
                [p.timestamp, p.portfolio_value, p.invested_value, p.cumulative_return]
                for p in analytics.performance_history
            ]
        elif data_type == "summary":
            headers = ["metric", "value"]
            s = analytics.summary
            rows = [
                ["Portfolio Name", analytics.portfolio_name],
                ["Base Currency", analytics.base_currency],
                ["Initial Capital", s.initial_capital],
                ["Cash", s.cash],
                ["Current Invested Value", s.current_invested_value],
                ["Current Portfolio Value", s.current_portfolio_value],
                ["Total P&L", s.total_pnl],
                ["Total Return %", s.total_return_percent],
                ["Annualized Return %", s.annualized_return_percent if s.annualized_return_percent is not None else ""],
                ["Annualized Volatility %", s.annualized_volatility_percent if s.annualized_volatility_percent is not None else ""],
                ["Sharpe Ratio", s.sharpe_ratio if s.sharpe_ratio is not None else ""],
                ["Max Drawdown %", s.max_drawdown_percent if s.max_drawdown_percent is not None else ""],
            ]
        else:
            # Default Holdings CSV according to specification:
            # Instrument, Symbol, Quantity, Entry Price, Entry Date, Target Weight, Current Price, Position Value, Weight, P&L
            headers = ["instrument", "symbol", "quantity", "entry_price", "target_weight", "current_price", "position_value", "weight", "pnl"]
            rows = [
                [
                    h.instrument_id,
                    h.symbol,
                    h.quantity,
                    h.entry_price,
                    h.target_weight if h.target_weight is not None else "",
                    h.current_price,
                    h.current_value,
                    h.total_weight,
                    h.pnl_amount,
                ]
                for h in analytics.holdings
            ]
        data = {"headers": headers, "rows": rows}

    export_service = ExportService()
    prefix = f"portfolio_{portfolio_id[:8]}_{data_type}"
    return export_service.create_export_response(
        data=data,
        metadata=metadata,
        format_str=format,
        filename_prefix=prefix
    )

