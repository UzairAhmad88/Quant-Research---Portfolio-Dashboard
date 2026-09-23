from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.portfolio import Portfolio, PortfolioHolding
from app.schemas.portfolio import (
    PortfolioCreate,
    PortfolioUpdate,
    PortfolioHoldingCreate,
    PortfolioHoldingUpdate,
)

class PortfolioRepository:
    def __init__(self, db: Session):
        self.db = db

    # Portfolio CRUD
    def create_portfolio(self, data: PortfolioCreate) -> Portfolio:
        portfolio = Portfolio(
            name=data.name,
            description=data.description,
            base_currency=data.base_currency,
            initial_capital=data.initial_capital,
            is_active=True,
        )
        self.db.add(portfolio)
        self.db.commit()
        self.db.refresh(portfolio)
        return portfolio

    def get_portfolio(self, portfolio_id: str, include_holdings: bool = True) -> Optional[Portfolio]:
        query = self.db.query(Portfolio)
        if include_holdings:
            query = query.options(joinedload(Portfolio.holdings).joinedload(PortfolioHolding.instrument))
        return query.filter(Portfolio.id == portfolio_id).first()

    def list_portfolios(self, active_only: bool = True) -> List[Portfolio]:
        query = self.db.query(Portfolio).options(
            joinedload(Portfolio.holdings).joinedload(PortfolioHolding.instrument)
        )
        if active_only:
            query = query.filter(Portfolio.is_active.is_(True))
        return query.order_by(Portfolio.created_at.desc()).all()

    def update_portfolio(self, portfolio_id: str, data: PortfolioUpdate) -> Optional[Portfolio]:
        portfolio = self.get_portfolio(portfolio_id, include_holdings=False)
        if not portfolio:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(portfolio, key, value)

        self.db.commit()
        self.db.refresh(portfolio)
        return self.get_portfolio(portfolio_id)

    def deactivate_portfolio(self, portfolio_id: str) -> bool:
        portfolio = self.get_portfolio(portfolio_id, include_holdings=False)
        if not portfolio:
            return False
        portfolio.is_active = False
        self.db.commit()
        return True

    # Holding CRUD
    def add_holding(self, portfolio_id: str, data: PortfolioHoldingCreate) -> PortfolioHolding:
        holding = PortfolioHolding(
            portfolio_id=portfolio_id,
            instrument_id=data.instrument_id,
            quantity=data.quantity,
            entry_price=data.entry_price,
            entry_date=data.entry_date,
            target_weight=data.target_weight,
            is_active=True,
        )
        self.db.add(holding)
        self.db.commit()
        self.db.refresh(holding)
        return holding

    def get_holding(self, holding_id: str) -> Optional[PortfolioHolding]:
        return (
            self.db.query(PortfolioHolding)
            .options(joinedload(PortfolioHolding.instrument))
            .filter(PortfolioHolding.id == holding_id)
            .first()
        )

    def get_active_holding_by_instrument(
        self, portfolio_id: str, instrument_id: str
    ) -> Optional[PortfolioHolding]:
        return (
            self.db.query(PortfolioHolding)
            .filter(
                PortfolioHolding.portfolio_id == portfolio_id,
                PortfolioHolding.instrument_id == instrument_id,
                PortfolioHolding.is_active.is_(True),
            )
            .first()
        )

    def list_holdings(self, portfolio_id: str, active_only: bool = True) -> List[PortfolioHolding]:
        query = self.db.query(PortfolioHolding).options(joinedload(PortfolioHolding.instrument)).filter(
            PortfolioHolding.portfolio_id == portfolio_id
        )
        if active_only:
            query = query.filter(PortfolioHolding.is_active.is_(True))
        return query.all()

    def update_holding(self, holding_id: str, data: PortfolioHoldingUpdate) -> Optional[PortfolioHolding]:
        holding = self.get_holding(holding_id)
        if not holding:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(holding, key, value)

        self.db.commit()
        self.db.refresh(holding)
        return holding

    def deactivate_holding(self, holding_id: str) -> bool:
        holding = self.get_holding(holding_id)
        if not holding:
            return False
        holding.is_active = False
        self.db.commit()
        return True
