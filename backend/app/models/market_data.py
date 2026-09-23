from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column, String, Numeric, Enum as SQLEnum, ForeignKey,
    UniqueConstraint, CheckConstraint, Index, DateTime
)
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import DataFrequency

def utc_now():
    return datetime.now(timezone.utc)

class OHLCV(Base):
    __tablename__ = "ohlcv"
    __table_args__ = (
        UniqueConstraint("instrument_id", "timestamp", "frequency", "provider", name="uq_ohlcv_inst_ts_freq_prov"),
        CheckConstraint("open > 0", name="ck_ohlcv_open_positive"),
        CheckConstraint("high > 0", name="ck_ohlcv_high_positive"),
        CheckConstraint("low > 0", name="ck_ohlcv_low_positive"),
        CheckConstraint("close > 0", name="ck_ohlcv_close_positive"),
        CheckConstraint("volume >= 0", name="ck_ohlcv_volume_nonnegative"),
        CheckConstraint("high >= low", name="ck_ohlcv_high_gte_low"),
        Index("idx_ohlcv_inst_freq_ts_desc", "instrument_id", "frequency", "timestamp"),
        {"schema": "market_data"}
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    instrument_id = Column(String(36), ForeignKey("core.instruments.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    frequency = Column(SQLEnum(DataFrequency, name="datafrequency", schema="market_data"), nullable=False, index=True)
    open = Column(Numeric(18, 8), nullable=False)
    high = Column(Numeric(18, 8), nullable=False)
    low = Column(Numeric(18, 8), nullable=False)
    close = Column(Numeric(18, 8), nullable=False)
    adjusted_close = Column(Numeric(18, 8), nullable=True)
    volume = Column(Numeric(24, 8), nullable=False)
    provider = Column(String(64), nullable=False, default="ABSTRACT")
    provider_symbol = Column(String(64), nullable=True)
    retrieved_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    instrument = relationship("Instrument", backref="ohlcv_series")
