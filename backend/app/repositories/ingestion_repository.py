from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.ingestion import IngestionLog
from app.models.enums import IngestionStatus, DataFrequency
from datetime import datetime, timezone

def utc_now():
    return datetime.now(timezone.utc)

class IngestionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_log(
        self,
        instrument_id: Optional[str],
        provider: str,
        requested_start: datetime,
        requested_end: datetime,
        frequency: DataFrequency = DataFrequency.DAILY
    ) -> IngestionLog:
        log = IngestionLog(
            instrument_id=instrument_id,
            provider=provider,
            requested_start=requested_start,
            requested_end=requested_end,
            frequency=frequency,
            status=IngestionStatus.RUNNING,
            created_at=utc_now()
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def update_log(
        self,
        log_id: str,
        status: IngestionStatus,
        rows_received: int = 0,
        rows_inserted: int = 0,
        rows_skipped: int = 0,
        rows_invalid: int = 0,
        actual_start: Optional[datetime] = None,
        actual_end: Optional[datetime] = None,
        duration_ms: int = 0,
        error_message: Optional[str] = None
    ) -> Optional[IngestionLog]:
        log = self.db.query(IngestionLog).filter(IngestionLog.id == log_id).first()
        if not log:
            return None
        
        log.status = status
        log.rows_received = rows_received
        log.rows_inserted = rows_inserted
        log.rows_skipped = rows_skipped
        log.rows_invalid = rows_invalid
        log.actual_start = actual_start
        log.actual_end = actual_end
        log.duration_ms = duration_ms
        log.error_message = error_message
        
        self.db.commit()
        self.db.refresh(log)
        return log

    def get_by_id(self, log_id: str) -> Optional[IngestionLog]:
        return self.db.query(IngestionLog).filter(IngestionLog.id == log_id).first()

    def get_recent_logs(self, instrument_id: Optional[str] = None, limit: int = 20) -> List[IngestionLog]:
        query = self.db.query(IngestionLog)
        if instrument_id:
            query = query.filter(IngestionLog.instrument_id == instrument_id)
        return query.order_by(IngestionLog.created_at.desc()).limit(limit).all()
