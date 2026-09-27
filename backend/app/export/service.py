from typing import Any, Dict
from fastapi import Response
from app.core.exceptions import ValidationError
from app.export.base import ExportFormat, ExportMetadata, Exporter, sanitize_filename
from app.export.csv_exporter import CSVExporter
from app.export.json_exporter import JSONExporter
from app.export.pdf_exporter import PDFExporter


class ExportService:
    """
    Centralized Export Service coordinating format selection, data serialization,
    filename sanitization, and HTTP attachment response building.
    """

    def __init__(self):
        self._exporters: Dict[ExportFormat, Exporter] = {
            ExportFormat.CSV: CSVExporter(),
            ExportFormat.JSON: JSONExporter(),
            ExportFormat.PDF: PDFExporter(),
        }

    def get_exporter(self, format_str: str) -> tuple[ExportFormat, Exporter]:
        normalized = format_str.lower().strip()
        try:
            fmt = ExportFormat(normalized)
        except ValueError:
            valid_options = ", ".join([f.value for f in ExportFormat])
            raise ValidationError(
                f"Unsupported export format '{format_str}'. Supported formats: {valid_options}"
            )
        return fmt, self._exporters[fmt]

    def create_export_response(
        self,
        data: Any,
        metadata: ExportMetadata,
        format_str: str,
        filename_prefix: str,
    ) -> Response:
        fmt, exporter = self.get_exporter(format_str)

        # Enforce PDF only for allowed report types
        if fmt == ExportFormat.PDF and metadata.export_type != "BACKTEST_REPORT":
            raise ValidationError(
                f"PDF format is only available for Backtest Research Reports. For '{metadata.export_type}', use 'csv' or 'json'."
            )

        content_bytes = exporter.export(data, metadata)
        filename = exporter.build_filename(prefix=filename_prefix, extension=fmt.value, metadata=metadata)

        return Response(
            content=content_bytes,
            media_type=exporter.content_type(),
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            }
        )
