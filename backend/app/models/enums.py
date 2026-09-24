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

class SignalType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class SignalState(str, Enum):
    BULLISH = "BULLISH"
    BEARISH = "BEARISH"
    NEUTRAL = "NEUTRAL"

class SignalSource(str, Enum):
    STRATEGY_ENGINE = "STRATEGY_ENGINE"
    MANUAL = "MANUAL"
    EXTERNAL = "EXTERNAL"
    MODEL = "MODEL"

class StrategyType(str, Enum):
    MOVING_AVERAGE = "MOVING_AVERAGE"


