from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Numeric, Text, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base

def utc_now():
    return datetime.now(timezone.utc)

class Portfolio(Base):
    __tablename__ = "portfolios"
    __table_args__ = (
        CheckConstraint("initial_capital > 0", name="ck_portfolios_initial_capital_positive"),
        {"schema": "core"}
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    base_currency = Column(String(16), nullable=False, default="USD")
    initial_capital = Column(Numeric(precision=18, scale=4), nullable=False, default=100000.0)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)

    holdings = relationship("PortfolioHolding", back_populates="portfolio", cascade="all, delete-orphan")


class PortfolioHolding(Base):
    __tablename__ = "portfolio_holdings"
    __table_args__ = (
        UniqueConstraint("portfolio_id", "instrument_id", name="uq_portfolio_holding_inst"),
        CheckConstraint("quantity > 0", name="ck_holding_quantity_positive"),
        CheckConstraint("entry_price > 0", name="ck_holding_entry_price_positive"),
        {"schema": "core"}
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    portfolio_id = Column(String(36), ForeignKey("core.portfolios.id", ondelete="CASCADE"), nullable=False, index=True)
    instrument_id = Column(String(36), ForeignKey("core.instruments.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Numeric(precision=18, scale=8), nullable=False)
    entry_price = Column(Numeric(precision=18, scale=8), nullable=False)
    entry_date = Column(DateTime(timezone=True), nullable=True)
    target_weight = Column(Numeric(precision=8, scale=4), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)

    portfolio = relationship("Portfolio", back_populates="holdings")
    instrument = relationship("Instrument")
