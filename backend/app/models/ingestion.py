from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, DateTime, Enum as SQLEnum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.models.enums import DataFrequency, IngestionStatus

def utc_now():
    return datetime.now(timezone.utc)

class IngestionLog(Base):
    __tablename__ = "ingestion_logs"
    __table_args__ = (
        {"schema": "market_data"}
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    instrument_id = Column(String(36), ForeignKey("core.instruments.id", ondelete="SET NULL"), nullable=True, index=True)
    provider = Column(String(64), nullable=False)
    requested_start = Column(DateTime(timezone=True), nullable=False)
    requested_end = Column(DateTime(timezone=True), nullable=False)
    actual_start = Column(DateTime(timezone=True), nullable=True)
    actual_end = Column(DateTime(timezone=True), nullable=True)
    frequency = Column(SQLEnum(DataFrequency, name="datafrequency", schema="market_data"), nullable=False, default=DataFrequency.DAILY)
    rows_received = Column(Integer, nullable=False, default=0)
    rows_inserted = Column(Integer, nullable=False, default=0)
    rows_skipped = Column(Integer, nullable=False, default=0)
    rows_invalid = Column(Integer, nullable=False, default=0)
    duration_ms = Column(Integer, nullable=False, default=0)
    status = Column(SQLEnum(IngestionStatus, name="ingestionstatus", schema="market_data"), nullable=False, default=IngestionStatus.PENDING)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    instrument = relationship("Instrument", backref="ingestion_logs")
