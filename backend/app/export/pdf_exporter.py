from typing import Any
from app.export.base import Exporter, ExportMetadata
from app.core.exceptions import ValidationError
from app.schemas.report import BacktestReportResponse
from app.analytics.backtesting.report_pdf_generator import generate_backtest_pdf_report


class PDFExporter(Exporter):
    """
    Standardized PDF exporter producing institutional publication-grade research reports.
    """

    def content_type(self) -> str:
        return "application/pdf"

    def export(self, data: Any, metadata: ExportMetadata) -> bytes:
        if isinstance(data, BacktestReportResponse):
            return generate_backtest_pdf_report(data)
        elif isinstance(data, bytes):
            return data
        else:
            raise ValidationError(
                f"PDF generation is not currently supported for dataset type '{metadata.export_type}'. Supported formats: CSV, JSON."
            )
