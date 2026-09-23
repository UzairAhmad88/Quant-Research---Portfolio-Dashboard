from typing import Generic, TypeVar, List
from pydantic import BaseModel, Field

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T] = Field(..., description="Page dataset items")
    total: int = Field(..., ge=0, description="Total matching dataset count")
    limit: int = Field(..., ge=1, description="Page item limit")
    offset: int = Field(..., ge=0, description="Page offset cursor")
