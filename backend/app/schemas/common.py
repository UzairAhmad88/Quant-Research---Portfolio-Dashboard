from typing import Any
from pydantic import BaseModel

class APIResponse(BaseModel):
    success: bool = True
    data: Any = None
    error: Any = None
    metadata: dict[str, Any] = {}
