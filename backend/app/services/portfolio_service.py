from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.portfolio import Portfolio, PortfolioHolding
from app.repositories.portfolio_repository import PortfolioRepository
from app.repositories.instrument_repository import InstrumentRepository
from app.schemas.portfolio import (
    PortfolioCreate,
    PortfolioUpdate,
    PortfolioHoldingCreate,
    PortfolioHoldingUpdate,
    PortfolioResponse,
    PortfolioHoldingResponse,
)
from app.core.exceptions import NotFoundError, ValidationError

class PortfolioService:
    def __init__(self, db: Session):
        self.db = db
        self.portfolio_repo = PortfolioRepository(db)
        self.inst_repo = InstrumentRepository(db)

    def create_portfolio(self, data: PortfolioCreate) -> PortfolioResponse:
        if data.initial_capital <= 0:
            raise ValidationError("Initial capital must be greater than zero.")

        # Validate initial holdings if provided in payload
        if data.holdings:
            self._validate_holdings_payload(data.initial_capital, data.holdings)

        portfolio = self.portfolio_repo.create_portfolio(data)

        # Add initial holdings if any
        if data.holdings:
            for holding_data in data.holdings:
                inst = self.inst_repo.get_by_id(holding_data.instrument_id)
                if not inst:
                    raise NotFoundError(f"Instrument '{holding_data.instrument_id}' not found.")
                self.portfolio_repo.add_holding(portfolio.id, holding_data)

        updated_portfolio = self.portfolio_repo.get_portfolio(portfolio.id)
        return self._to_portfolio_response(updated_portfolio)

    def get_portfolio(self, portfolio_id: str) -> PortfolioResponse:
        portfolio = self.portfolio_repo.get_portfolio(portfolio_id)
        if not portfolio or not portfolio.is_active:
            raise NotFoundError(f"Portfolio '{portfolio_id}' was not found.")
        return self._to_portfolio_response(portfolio)

    def list_portfolios(self, active_only: bool = True) -> List[PortfolioResponse]:
        portfolios = self.portfolio_repo.list_portfolios(active_only=active_only)
        return [self._to_portfolio_response(p) for p in portfolios]

    def update_portfolio(self, portfolio_id: str, data: PortfolioUpdate) -> PortfolioResponse:
        portfolio = self.portfolio_repo.get_portfolio(portfolio_id)
        if not portfolio or not portfolio.is_active:
            raise NotFoundError(f"Portfolio '{portfolio_id}' was not found.")

        if data.initial_capital is not None:
            if data.initial_capital <= 0:
                raise ValidationError("Initial capital must be greater than zero.")
            # Check existing holdings against new capital
            current_invested = sum(h.quantity * h.entry_price for h in portfolio.holdings if h.is_active)
            if data.initial_capital < current_invested:
                raise ValidationError(
                    f"New initial capital ({data.initial_capital}) cannot be less than current invested capital ({current_invested})."
                )

        updated = self.portfolio_repo.update_portfolio(portfolio_id, data)
        return self._to_portfolio_response(updated)

    def deactivate_portfolio(self, portfolio_id: str) -> bool:
        portfolio = self.portfolio_repo.get_portfolio(portfolio_id)
        if not portfolio or not portfolio.is_active:
            raise NotFoundError(f"Portfolio '{portfolio_id}' was not found.")
        return self.portfolio_repo.deactivate_portfolio(portfolio_id)

    def add_holding(self, portfolio_id: str, data: PortfolioHoldingCreate) -> PortfolioHoldingResponse:
        portfolio = self.portfolio_repo.get_portfolio(portfolio_id)
        if not portfolio or not portfolio.is_active:
            raise NotFoundError(f"Portfolio '{portfolio_id}' was not found.")

        # 1. Validate instrument
        inst = self.inst_repo.get_by_id(data.instrument_id)
        if not inst:
            raise NotFoundError(f"Instrument '{data.instrument_id}' was not found.")

        # 2. Check duplicate active holding
        existing = self.portfolio_repo.get_active_holding_by_instrument(portfolio_id, data.instrument_id)
        if existing:
            raise ValidationError(
                f"Instrument '{inst.symbol}' already exists as an active holding in this portfolio."
            )

        # 3. Check values
        if data.quantity <= 0:
            raise ValidationError("Holding quantity must be greater than zero.")
        if data.entry_price <= 0:
            raise ValidationError("Entry price must be greater than zero.")

        # 4. Check capital constraint: cash >= 0
        current_invested = sum(h.quantity * h.entry_price for h in portfolio.holdings if h.is_active)
        new_holding_value = data.quantity * data.entry_price
        if current_invested + new_holding_value > portfolio.initial_capital:
            raise ValidationError(
                f"Adding this holding requires ${new_holding_value:.2f}, but remaining cash is only ${(portfolio.initial_capital - current_invested):.2f}."
            )

        # 5. Check target weights sum <= 100%
        if data.target_weight is not None:
            current_target_weight_sum = sum(
                (h.target_weight or 0.0) for h in portfolio.holdings if h.is_active
            )
            if current_target_weight_sum + data.target_weight > 100.0 and current_target_weight_sum + data.target_weight > 1.0001:
                # normalize if 0-1 vs 0-100%
                val = data.target_weight if data.target_weight > 1.0 else data.target_weight * 100.0
                curr_val = sum(
                    ((h.target_weight if (h.target_weight and h.target_weight > 1.0) else (h.target_weight or 0.0) * 100.0))
                    for h in portfolio.holdings if h.is_active
                )
                if curr_val + val > 100.0001:
                    raise ValidationError("Total target weight across holdings cannot exceed 100%.")

        holding = self.portfolio_repo.add_holding(portfolio_id, data)
        updated_holding = self.portfolio_repo.get_holding(holding.id)
        return self._to_holding_response(updated_holding)

    def update_holding(self, portfolio_id: str, holding_id: str, data: PortfolioHoldingUpdate) -> PortfolioHoldingResponse:
        portfolio = self.portfolio_repo.get_portfolio(portfolio_id)
        if not portfolio or not portfolio.is_active:
            raise NotFoundError(f"Portfolio '{portfolio_id}' was not found.")

        holding = self.portfolio_repo.get_holding(holding_id)
        if not holding or holding.portfolio_id != portfolio_id or not holding.is_active:
            raise NotFoundError(f"Holding '{holding_id}' was not found in portfolio.")

        new_qty = data.quantity if data.quantity is not None else holding.quantity
        new_price = data.entry_price if data.entry_price is not None else holding.entry_price

        if new_qty <= 0:
            raise ValidationError("Quantity must be greater than zero.")
        if new_price <= 0:
            raise ValidationError("Entry price must be greater than zero.")

        # Recalculate cash constraint
        other_invested = sum(
            h.quantity * h.entry_price
            for h in portfolio.holdings
            if h.is_active and h.id != holding_id
        )
        if other_invested + (new_qty * new_price) > portfolio.initial_capital:
            raise ValidationError("Updated holding value exceeds total initial capital.")

        updated = self.portfolio_repo.update_holding(holding_id, data)
        return self._to_holding_response(updated)

    def remove_holding(self, portfolio_id: str, holding_id: str) -> bool:
        portfolio = self.portfolio_repo.get_portfolio(portfolio_id)
        if not portfolio or not portfolio.is_active:
            raise NotFoundError(f"Portfolio '{portfolio_id}' was not found.")

        holding = self.portfolio_repo.get_holding(holding_id)
        if not holding or holding.portfolio_id != portfolio_id or not holding.is_active:
            raise NotFoundError(f"Holding '{holding_id}' was not found in portfolio.")

        return self.portfolio_repo.deactivate_holding(holding_id)

    # Helper validation methods
    def _validate_holdings_payload(self, initial_capital: float, holdings: List[PortfolioHoldingCreate]):
        seen_insts = set()
        total_invested = 0.0
        for h in holdings:
            if h.instrument_id in seen_insts:
                raise ValidationError(f"Duplicate instrument ID '{h.instrument_id}' in holdings list.")
            seen_insts.add(h.instrument_id)
            if h.quantity <= 0:
                raise ValidationError("Holding quantity must be greater than zero.")
            if h.entry_price <= 0:
                raise ValidationError("Entry price must be greater than zero.")
            total_invested += h.quantity * h.entry_price

        if total_invested > initial_capital:
            raise ValidationError(
                f"Total invested holdings value (${total_invested:.2f}) exceeds initial capital (${initial_capital:.2f})."
            )

    def _to_portfolio_response(self, p: Portfolio) -> PortfolioResponse:
        active_holdings = [h for h in (p.holdings or []) if h.is_active]
        invested_value = sum(h.quantity * h.entry_price for h in active_holdings)
        cash = max(0.0, p.initial_capital - invested_value)

        holdings_resp = [self._to_holding_response(h) for h in active_holdings]
        return PortfolioResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            base_currency=p.base_currency,
            initial_capital=p.initial_capital,
            created_at=p.created_at,
            updated_at=p.updated_at,
            is_active=p.is_active,
            holdings=holdings_resp,
            invested_value=invested_value,
            cash=cash,
        )

    def _to_holding_response(self, h: PortfolioHolding) -> PortfolioHoldingResponse:
        initial_value = h.quantity * h.entry_price
        symbol = h.instrument.symbol if h.instrument else "UNKNOWN"
        name = h.instrument.name if h.instrument else "Unknown"
        asset_type = h.instrument.asset_type.value if h.instrument else "equity"

        return PortfolioHoldingResponse(
            id=h.id,
            portfolio_id=h.portfolio_id,
            instrument_id=h.instrument_id,
            symbol=symbol,
            name=name,
            asset_type=asset_type,
            quantity=h.quantity,
            entry_price=h.entry_price,
            entry_date=h.entry_date,
            target_weight=h.target_weight,
            initial_value=initial_value,
            is_active=h.is_active,
            created_at=h.created_at,
            updated_at=h.updated_at,
        )
