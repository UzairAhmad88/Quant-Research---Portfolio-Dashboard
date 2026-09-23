from enum import Enum

class AssetType(str, Enum):
    EQUITY = "EQUITY"
    ETF = "ETF"
    INDEX = "INDEX"
    CRYPTO = "CRYPTO"

class DataFrequency(str, Enum):
    DAILY = "DAILY"
    HOURLY = "HOURLY"
    MINUTE = "MINUTE"

class IngestionStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    COMPLETED_WITH_WARNINGS = "COMPLETED_WITH_WARNINGS"
    FAILED = "FAILED"

