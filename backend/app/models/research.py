from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.db.session import Base
import uuid


class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    items = relationship("WatchlistItem", back_populates="watchlist", cascade="all, delete-orphan")


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    watchlist_id = Column(String(36), ForeignKey("watchlists.id"), nullable=False)
    symbol = Column(String(20), nullable=False)
    display_order = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    added_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    watchlist = relationship("Watchlist", back_populates="items")


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String(20), nullable=False)
    alert_type = Column(String(50), nullable=False)  # PRICE_ABOVE, PRICE_BELOW, CHANGE_PCT, VOLATILITY, MA_CROSSOVER, DRAWDOWN
    threshold = Column(Float, nullable=False)
    comparator = Column(String(10), nullable=False)  # >, <, >=, <=, CROSSES_ABOVE, CROSSES_BELOW
    status = Column(String(20), default="ACTIVE")  # ACTIVE, TRIGGERED, ACKNOWLEDGED, DISABLED
    message = Column(Text, nullable=True)
    triggered_at = Column(DateTime, nullable=True)
    triggered_value = Column(Float, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class ResearchExperiment(Base):
    __tablename__ = "research_experiments"

    id = Column(String(50), primary_key=True)  # e.g. EXP-0042
    name = Column(String(150), nullable=False)
    hypothesis = Column(Text, nullable=False)
    dataset_identifier = Column(String(100), nullable=False)
    strategy_name = Column(String(100), nullable=False)
    parameters = Column(JSON, nullable=False, default={})
    metrics = Column(JSON, nullable=False, default={})
    fingerprint = Column(String(64), nullable=True)
    status = Column(String(30), default="COMPLETED")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ResearchNote(Base):
    __tablename__ = "research_notes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    research_question = Column(Text, nullable=False)
    instruments = Column(JSON, default=[])
    strategy_ref = Column(String(100), nullable=True)
    backtest_ref = Column(String(100), nullable=True)
    observations = Column(Text, nullable=True)
    conclusion = Column(Text, nullable=True)
    tags = Column(JSON, default=[])
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
