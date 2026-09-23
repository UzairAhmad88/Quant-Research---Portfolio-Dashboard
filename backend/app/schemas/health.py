from typing import Generic, TypeVar, Optional, Any, Dict
from pydantic import BaseModel, Field

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    error: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class HealthData(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
    environment: str = "development"
    dbConnected: bool = False
    timestamp: str
