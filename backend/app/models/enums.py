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

class ExecutionTiming(str, Enum):
    NEXT_OPEN = "NEXT_OPEN"

class PositionSizingType(str, Enum):
    FULL_CAPITAL = "FULL_CAPITAL"

class BacktestDirection(str, Enum):
    LONG_ONLY = "LONG_ONLY"

class BacktestStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    COMPLETED_WITH_WARNINGS = "COMPLETED_WITH_WARNINGS"
    FAILED = "FAILED"

class ExecutionReason(str, Enum):
    SIGNAL = "SIGNAL"
    FORCED_END = "FORCED_END"

class DataFreshness(str, Enum):
    CURRENT = "CURRENT"
    RECENT = "RECENT"
    STALE = "STALE"
    UNKNOWN = "UNKNOWN"
    UNAVAILABLE = "UNAVAILABLE"



