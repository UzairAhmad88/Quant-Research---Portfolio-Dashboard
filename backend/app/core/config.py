import os
from typing import List
from pydantic import ConfigDict
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Quant Research Dashboard"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment Configuration
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Database Configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:password@localhost:5432/quant_dashboard"
    )
    
    # CORS Origins Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    
    # Provider Placeholder Config
    MARKET_DATA_API_KEY: str = os.getenv("MARKET_DATA_API_KEY", "")
    MARKET_DATA_BASE_URL: str = os.getenv("MARKET_DATA_BASE_URL", "")

    model_config = ConfigDict(case_sensitive=True)

settings = Settings()
