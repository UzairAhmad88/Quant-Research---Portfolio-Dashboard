from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Boolean, Enum as SQLEnum, UniqueConstraint, DateTime, JSON
from app.db.base import Base
from app.models.enums import AssetType

def utc_now():
    return datetime.now(timezone.utc)

class Instrument(Base):
    __tablename__ = "instruments"
    __table_args__ = (
        UniqueConstraint("symbol", "exchange", "asset_type", name="uq_instrument_symbol_exchange_asset"),
        {"schema": "core"}
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol = Column(String(32), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    asset_type = Column(SQLEnum(AssetType, name="assettype", schema="core"), nullable=False, index=True)
    exchange = Column(String(64), nullable=False, default="UNKNOWN")
    currency = Column(String(16), nullable=False, default="USD")
    country = Column(String(64), nullable=True)
    provider_symbol = Column(String(64), nullable=True)
    active = Column(Boolean, nullable=False, default=True)
    metadata_json = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)
