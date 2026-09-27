import json
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
from typing import Any
from pydantic import BaseModel

from app.export.base import Exporter, ExportMetadata


class CustomJSONEncoder(json.JSONEncoder):
    """
    JSON encoder preserving ISO 8601 UTC timestamps, enum values, Decimals, and Pydantic models.
    """
    def default(self, obj: Any) -> Any:
        if isinstance(obj, BaseModel):
            return obj.model_dump(mode="json")
        if isinstance(obj, (datetime, date)):
            if isinstance(obj, datetime):
                return obj.strftime("%Y-%m-%dT%H:%M:%SZ") if obj.tzinfo else f"{obj.isoformat()}Z"
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, Enum):
            return obj.value
        return super().default(obj)


class JSONExporter(Exporter):
    """
    Structured JSON exporter producing machine-readable research payloads.
    Wraps payload in standard { metadata: ..., data: ... } envelope.
    """

    def content_type(self) -> str:
        return "application/json; charset=utf-8"

    def export(self, data: Any, metadata: ExportMetadata) -> bytes:
        payload = {
            "metadata": metadata.model_dump(mode="json"),
            "data": data.model_dump(mode="json") if isinstance(data, BaseModel) else data
        }
        is_large = isinstance(data, list) and len(data) > 100
        indent = None if is_large else 2
        json_str = json.dumps(payload, cls=CustomJSONEncoder, indent=indent)
        return json_str.encode("utf-8")
