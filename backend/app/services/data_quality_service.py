from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.enums import DataFrequency, AssetType
from app.repositories.instrument_repository import InstrumentRepository
from app.repositories.market_data_repository import MarketDataRepository
from app.repositories.ingestion_repository import IngestionRepository
from app.validators import ValidationPipeline, QualityReport, QualityStatus, ValidationSummary, ValidationIssue, Severity, ErrorCode
from app.core.exceptions import NotFoundError

class DataQualityService:
    def __init__(self, db: Session):
        self.db = db
        self.inst_repo = InstrumentRepository(db)
        self.market_repo = MarketDataRepository(db)
        self.ingest_repo = IngestionRepository(db)
        self.pipeline = ValidationPipeline()

    def get_instrument_quality_report(
        self,
        instrument_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        frequency: DataFrequency = DataFrequency.DAILY
    ) -> QualityReport:
        instrument = self.inst_repo.get_by_id(instrument_id)
        if not instrument:
            raise NotFoundError(f"Instrument with ID '{instrument_id}' not found.")

        bars = self.market_repo.get_bars(
            instrument_id=instrument_id,
            start_date=start_date,
            end_date=end_date,
            frequency=frequency,
            limit=10000
        )

        if not bars:
            return QualityReport(
                status=QualityStatus.NO_DATA,
                summary=ValidationSummary(
                    total_records=0,
                    valid_records=0,
                    invalid_records=0,
                    warning_count=0,
                    error_count=0,
                    critical_count=0,
                    duplicate_records=0,
                    potential_missing_sessions=0
                ),
                issues=[ValidationIssue(
                    severity=Severity.INFO,
                    code=ErrorCode.MISSING_REQUIRED_FIELD,
                    message=f"No stored market data observations found for symbol '{instrument.symbol}'."
                )],
                instrument_id=instrument.id,
                symbol=instrument.symbol,
                asset_type=instrument.asset_type.value,
                provider="DATABASE",
                start_date=start_date,
                end_date=end_date
            )

        dict_bars: List[Dict[str, Any]] = []
        for b in bars:
            dict_bars.append({
                "timestamp": b.timestamp,
                "open": float(b.open),
                "high": float(b.high),
                "low": float(b.low),
                "close": float(b.close),
                "adjusted_close": float(b.adjusted_close) if b.adjusted_close is not None else None,
                "volume": float(b.volume)
            })

        _, report = self.pipeline.validate_dataset(
            bars=dict_bars,
            asset_type=instrument.asset_type,
            existing_timestamps=set(),
            instrument_id=instrument.id,
            symbol=instrument.symbol,
            provider="DATABASE",
            requested_start=start_date,
            requested_end=end_date
        )

        return report

    def get_ingestion_detail(self, instrument_id: str, ingestion_id: str):
        instrument = self.inst_repo.get_by_id(instrument_id)
        if not instrument:
            raise NotFoundError(f"Instrument with ID '{instrument_id}' not found.")

        log = self.ingest_repo.get_by_id(ingestion_id)
        if not log or log.instrument_id != instrument_id:
            raise NotFoundError(f"Ingestion log with ID '{ingestion_id}' not found for instrument '{instrument_id}'.")

        # Evaluate quality report for the stored window covered by this ingestion
        report = self.get_instrument_quality_report(
            instrument_id=instrument_id,
            start_date=log.requested_start,
            end_date=log.requested_end,
            frequency=log.frequency
        )

        return log, report
