import io
import csv
import math
from datetime import datetime, date
from typing import Any, List, Dict, Union
import pandas as pd

from app.export.base import Exporter, ExportMetadata


class CSVExporter(Exporter):
    """
    Standardized CSV exporter for tabular research and market data.
    Enforces UTF-8 encoding, consistent delimiters, ISO UTC timestamps,
    empty strings for null values (never zeroes), and no currency symbols.
    """

    def content_type(self) -> str:
        return "text/csv; charset=utf-8"

    def export(self, data: Any, metadata: ExportMetadata) -> bytes:
        """
        Accepts data as either:
        1. Dict with 'headers' (List[str]) and 'rows' (List[List[Any]])
        2. pandas.DataFrame
        3. List of dicts
        """
        output = io.StringIO()
        writer = csv.writer(output, lineterminator="\n")

        if isinstance(data, pd.DataFrame):
            # Format DataFrame cleanly
            csv_str = data.to_csv(index=False, date_format="%Y-%m-%dT%H:%M:%SZ")
            return csv_str.encode("utf-8")

        elif isinstance(data, dict) and "headers" in data and "rows" in data:
            headers: List[str] = data["headers"]
            rows: List[List[Any]] = data["rows"]

            writer.writerow(headers)
            for row in rows:
                formatted_row = [self._format_cell(val) for val in row]
                writer.writerow(formatted_row)

        elif isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
            # List of dicts
            headers = list(data[0].keys())
            writer.writerow(headers)
            fmt = self._format_cell
            for item in data:
                writer.writerow([fmt(item.get(h)) for h in headers])

        else:
            # Fallback empty or direct string
            writer.writerow(["No data"])

        return output.getvalue().encode("utf-8")

    def _format_cell(self, val: Any) -> str:
        if val is None:
            return ""
        t = type(val)
        if t is float:
            if math.isnan(val):
                return ""
            return str(val) if 1e-4 <= abs(val) < 1e8 or val == 0.0 else f"{val:.6g}"
        if t is int:
            return str(val)
        if t is str:
            # Formula injection defense (OWASP CSV Injection): prepend single quote to trigger characters
            if val and val[0] in ("=", "+", "-", "@", "\t", "\r"):
                return f"'{val}"
            return val
        if t is bool:
            return "true" if val else "false"
        if isinstance(val, (datetime, date)):
            if isinstance(val, datetime):
                # Ensure UTC representation
                return val.strftime("%Y-%m-%dT%H:%M:%SZ") if val.tzinfo else f"{val.isoformat()}Z"
            return val.isoformat()
        return str(val)
