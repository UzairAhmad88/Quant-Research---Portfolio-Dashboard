from datetime import datetime
import uuid
from sqlalchemy import Column, DateTime, String
from app.db.base import Base

class BaseModel(Base):
    """
    Abstract Base Model providing UUID primary keys and standard audit timestamps.
    """
    __abstract__ = True

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
