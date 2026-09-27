from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
import re
from abc import ABC, abstractmethod


class ExportFormat(str, Enum):
    CSV = "csv"
    JSON = "json"
    PDF = "pdf"


def sanitize_filename(name: str) -> str:
    """
    Sanitizes string into a safe, deterministic filename.
    Removes path traversal components, replaces spaces and illegal characters with underscores.
    """
    # Remove null bytes and path separators
    cleaned = re.sub(r'[\x00/\\:]', '_', name)
    # Remove directory traversal sequences (e.g. .., ..., etc)
    cleaned = re.sub(r'\.{2,}', '_', cleaned)
    # Replace any characters not alphanumeric, underscore, hyphen, or dot
    cleaned = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', cleaned)
    # Collapse multiple consecutive underscores
    cleaned = re.sub(r'_+', '_', cleaned)
    return cleaned.strip('._') or "export"


class ExportMetadata(BaseModel):
    application: str = "Quant Research Dashboard"
    export_type: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    timezone: str = "UTC"
    instrument: Optional[str] = None
    symbol: Optional[str] = None
    date_range: Optional[str] = None
    provider: Optional[str] = None
    frequency: Optional[str] = None
    price_source: Optional[str] = None
    extra: Dict[str, Any] = Field(default_factory=dict)


class Exporter(ABC):
    """Abstract Base Class for format-specific exporters."""

    @abstractmethod
    def export(self, data: Any, metadata: ExportMetadata) -> bytes:
        """Serializes data and metadata into raw export bytes."""
        pass

    @abstractmethod
    def content_type(self) -> str:
        """Returns standard HTTP media type with charset."""
        pass

    def build_filename(self, prefix: str, extension: str, metadata: Optional[ExportMetadata] = None) -> str:
        symbol = metadata.symbol if metadata and metadata.symbol else None
        parts = [p for p in [symbol, prefix] if p]
        base_name = "_".join(parts)
        safe_base = sanitize_filename(base_name)
        return f"{safe_base}.{extension.lstrip('.')}"
