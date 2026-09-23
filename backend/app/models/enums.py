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
