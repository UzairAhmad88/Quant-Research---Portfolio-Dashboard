from enum import Enum
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field

class Severity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class QualityStatus(str, Enum):
    GOOD = "GOOD"
    GOOD_WITH_WARNINGS = "GOOD_WITH_WARNINGS"
    INVALID = "INVALID"
    NO_DATA = "NO_DATA"

class ErrorCode(str, Enum):
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
    INVALID_TYPE = "INVALID_TYPE"
    INVALID_TIMESTAMP = "INVALID_TIMESTAMP"
    INVALID_OHLC_RELATIONSHIP = "INVALID_OHLC_RELATIONSHIP"
    NEGATIVE_PRICE = "NEGATIVE_PRICE"
    NEGATIVE_VOLUME = "NEGATIVE_VOLUME"
    DUPLICATE_RECORD = "DUPLICATE_RECORD"
    OUT_OF_ORDER_TIMESTAMP = "OUT_OF_ORDER_TIMESTAMP"
    POTENTIAL_MISSING_SESSION = "POTENTIAL_MISSING_SESSION"
    SUSPICIOUS_PRICE_JUMP = "SUSPICIOUS_PRICE_JUMP"
    SUSPICIOUS_VOLUME_SPIKE = "SUSPICIOUS_VOLUME_SPIKE"
    ZERO_VOLUME_EQUITY = "ZERO_VOLUME_EQUITY"
    REPEATED_IDENTICAL_BAR = "REPEATED_IDENTICAL_BAR"
    PROVIDER_METADATA_MISSING = "PROVIDER_METADATA_MISSING"

class ValidationIssue(BaseModel):
    severity: Severity
    code: ErrorCode
    message: str
    timestamp: Optional[datetime] = None
    field: Optional[str] = None
    record_reference: Optional[str] = None

class ValidationSummary(BaseModel):
    total_records: int = 0
    valid_records: int = 0
    invalid_records: int = 0
    warning_count: int = 0
    error_count: int = 0
    critical_count: int = 0
    duplicate_records: int = 0
    potential_missing_sessions: int = 0

def utc_now_naive():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class QualityReport(BaseModel):
    status: QualityStatus
    summary: ValidationSummary
    issues: List[ValidationIssue] = Field(default_factory=list)
    instrument_id: Optional[str] = None
    symbol: Optional[str] = None
    asset_type: Optional[str] = None
    provider: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    generated_at: datetime = Field(default_factory=utc_now_naive)
