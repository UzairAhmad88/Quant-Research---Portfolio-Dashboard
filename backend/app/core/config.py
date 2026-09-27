import os
import logging
from typing import List
from pydantic import ConfigDict, field_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger("quant_api.config")

class Settings(BaseSettings):
    PROJECT_NAME: str = "Quant Research Dashboard"
    VERSION: str = "1.0.0"
    BUILD_ID: str = os.getenv("BUILD_ID", "local-build")
    API_V1_STR: str = "/api/v1"
    
    # Environment & Debug Configuration
    ENVIRONMENT: str = os.getenv("APP_ENV", os.getenv("ENVIRONMENT", "development"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes", "t")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Application Secrets & Security Keys
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-insecure-secret-key-change-in-production")
    
    # Database Configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./quant_dashboard.db"
    )
    
    # CORS Origins Configuration
    CORS_ORIGINS: List[str] = (
        [origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin.strip()]
        if os.getenv("CORS_ORIGINS")
        else [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "*",
        ]
    )
    
    # Rate Limiting Configuration
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() in ("true", "1", "yes", "t")
    RATE_LIMIT_PER_MINUTE_STANDARD: int = int(os.getenv("RATE_LIMIT_PER_MINUTE_STANDARD", "300"))
    RATE_LIMIT_PER_MINUTE_EXPENSIVE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE_EXPENSIVE", "60"))
    
    # Quantitative Resource Limits & Bounds
    MAX_CORRELATION_INSTRUMENTS: int = 20
    MAX_DATE_RANGE_YEARS: int = 30
    MAX_EXPORT_ROWS: int = 50000
    MAX_PAGINATION_LIMIT: int = 1000

    # Provider Configuration
    MARKET_DATA_PROVIDER: str = os.getenv("MARKET_DATA_PROVIDER", "yahoo_finance")
    MARKET_DATA_TIMEOUT: int = int(os.getenv("MARKET_DATA_TIMEOUT", "10"))
    MARKET_DATA_RETRY_LIMIT: int = int(os.getenv("MARKET_DATA_RETRY_LIMIT", "3"))
    MARKET_DATA_API_KEY: str = os.getenv("MARKET_DATA_API_KEY", "")
    MARKET_DATA_BASE_URL: str = os.getenv("MARKET_DATA_BASE_URL", "")

    model_config = ConfigDict(case_sensitive=True)

    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in ("production", "prod")

    def validate_production_security(self) -> None:
        """Enforces security invariants on application startup."""
        if self.is_production():
            if self.DEBUG:
                raise ValueError("SECURITY ERROR: DEBUG mode cannot be enabled in production.")
            if "dev-insecure" in self.SECRET_KEY:
                raise ValueError("SECURITY ERROR: Default SECRET_KEY detected in production. A secure secret must be configured.")
            if any("*" in origin for origin in self.CORS_ORIGINS):
                raise ValueError("SECURITY ERROR: Wildcard '*' CORS origin is not permitted in production.")

settings = Settings()
