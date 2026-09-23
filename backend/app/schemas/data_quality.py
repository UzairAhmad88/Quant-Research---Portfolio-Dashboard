from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.validators.quality import Severity, QualityStatus, ErrorCode, ValidationIssue, ValidationSummary, QualityReport
from app.models.enums import DataFrequency, IngestionStatus

class DataQualityResponse(BaseModel):
    report: QualityReport

class IngestionDetailResponse(BaseModel):
    id: str
    instrument_id: Optional[str]
    provider: str
    frequency: DataFrequency
    requested_start: datetime
    requested_end: datetime
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    rows_received: int
    rows_inserted: int
    rows_skipped: int
    rows_invalid: int
    duration_ms: int
    status: IngestionStatus
    error_message: Optional[str] = None
    created_at: datetime
    quality_report: Optional[QualityReport] = None

    model_config = ConfigDict(from_attributes=True)
