import logging
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.enums import DataFrequency, AssetType
from app.repositories.instrument_repository import InstrumentRepository
from app.repositories.market_data_repository import MarketDataRepository
from app.services.data_quality_service import DataQualityService
from app.analytics.returns import ReturnCalculator, AnnualizationConvention, ReturnStatistics
from app.schemas.returns import ReturnAnalysisResponse, ReturnSummary, ReturnObservation
from app.validators import QualityStatus
from app.core.exceptions import NotFoundError, ValidationError

logger = logging.getLogger("quant_api.services.return_service")


class ReturnService:
    def __init__(self, db: Session):
        self.db = db
        self.inst_repo = InstrumentRepository(db)
        self.market_repo = MarketDataRepository(db)
        self.quality_service = DataQualityService(db)

    def calculate_returns(
        self,
        instrument_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        price_source: str = "adjusted",
        return_type: str = "simple",
        frequency: DataFrequency = DataFrequency.DAILY
    ) -> ReturnAnalysisResponse:
        # 1. Resolve Instrument by ID or Symbol
        instrument = self.inst_repo.get_by_id(instrument_id)
        if not instrument:
            clean_sym = (
                instrument_id.replace("inst-", "")
                .replace("custom-", "")
                .strip()
                .upper()
            )
            instrument = self.inst_repo.get_by_symbol(clean_sym)
            if not instrument:
                from app.schemas.instrument import InstrumentCreate
                new_inst = InstrumentCreate(
                    symbol=clean_sym,
                    name=f"{clean_sym} Asset",
                    asset_type=AssetType.EQUITY,
                    exchange="NASDAQ",
                    currency="USD",
                    country="USA",
                    provider_symbol=clean_sym,
                    metadata_json={"auto_created": True}
                )
                try:
                    instrument = self.inst_repo.create(new_inst)
                except Exception:
                    instrument = self.inst_repo.get_by_symbol(clean_sym)

        if not instrument:
            raise NotFoundError(f"Instrument with ID or symbol '{instrument_id}' was not found.")

        clean_price_source = price_source.lower().strip()
        if clean_price_source not in ("adjusted", "close"):
            raise ValidationError("Price source must be either 'adjusted' or 'close'.")

        clean_return_type = return_type.lower().strip()
        if clean_return_type not in ("simple", "log"):
            raise ValidationError("Return type must be either 'simple' or 'log'.")

        # 2. Fetch Bars from Database
        bars = self.market_repo.get_bars(
            instrument_id=instrument.id,
            start_date=start_date,
            end_date=end_date,
            frequency=frequency,
            limit=10000
        )

        # 3. If no bars in DB, attempt on-demand real historical ingestion from Yahoo Finance
        if not bars:
            try:
                import yfinance as yf
                from app.schemas.market_data import OHLCVCreate
                from decimal import Decimal

                ticker = yf.Ticker(instrument.symbol)
                hist = ticker.history(period="5y", interval="1d", auto_adjust=False)
                if not hist.empty:
                    for idx, row in hist.iterrows():
                        bar_dt = idx.to_pydatetime() if hasattr(idx, "to_pydatetime") else idx
                        if bar_dt.tzinfo is None:
                            bar_dt = bar_dt.replace(tzinfo=timezone.utc)
                        bar_data = OHLCVCreate(
                            instrument_id=instrument.id,
                            timestamp=bar_dt,
                            open=Decimal(str(round(row["Open"], 4))),
                            high=Decimal(str(round(row["High"], 4))),
                            low=Decimal(str(round(row["Low"], 4))),
                            close=Decimal(str(round(row["Close"], 4))),
                            adjusted_close=Decimal(str(round(row.get("Adj Close", row["Close"]), 4))) if "Adj Close" in row else Decimal(str(round(row["Close"], 4))),
                            volume=int(row["Volume"]),
                            frequency=frequency,
                            provider="yahoo_finance",
                            quality_status=QualityStatus.GOOD
                        )
                        self.market_repo.insert_bar(bar_data)
                    self.db.commit()
                    bars = self.market_repo.get_bars(
                        instrument_id=instrument.id,
                        start_date=start_date,
                        end_date=end_date,
                        frequency=frequency,
                        limit=10000
                    )
            except Exception as e:
                logger.warning(f"On-demand historical ingestion failed for {instrument.symbol}: {e}")

        # 4. Check Data Quality
        quality_report = self.quality_service.get_instrument_quality_report(
            instrument_id=instrument.id,
            start_date=start_date,
            end_date=end_date,
            frequency=frequency
        )

        quality_warning: Optional[str] = None
        if quality_report.status == QualityStatus.INVALID:
            raise ValidationError("Market data failed validation and cannot be used for return analysis.")
        elif quality_report.status == QualityStatus.GOOD_WITH_WARNINGS:
            quality_warning = "Dataset contains non-fatal quality warnings."

        if not bars:
            factor = AnnualizationConvention.get_annualization_factor(instrument.asset_type)
            summary = ReturnSummary(
                period_return=0.0,
                annualized_return=0.0,
                cumulative_return=0.0,
                positive_periods=0,
                negative_periods=0,
                best_period=None,
                worst_period=None,
                annualization_factor=factor
            )
            return ReturnAnalysisResponse(
                instrument_id=instrument.id,
                symbol=instrument.symbol,
                asset_type=instrument.asset_type.value,
                price_source=clean_price_source,
                return_type=clean_return_type,
                frequency=frequency,
                quality_status=quality_report.status.value,
                quality_warning="No historical price observations available.",
                summary=summary,
                series=[]
            )

        # 3. Select Price Series
        prices: List[float] = []
        for b in bars:
            p = float(b.adjusted_close) if (clean_price_source == "adjusted" and b.adjusted_close is not None) else float(b.close)
            prices.append(p)

        # 4. Calculate Mathematical Returns
        simple_returns = ReturnCalculator.calculate_simple_returns(prices)
        log_returns = ReturnCalculator.calculate_log_returns(prices)
        cum_returns = ReturnCalculator.calculate_cumulative_returns(prices)

        # 5. Resolve Annualization Factor & Statistics
        factor = AnnualizationConvention.get_annualization_factor(instrument.asset_type)
        summary_dict = ReturnStatistics.calculate_summary(
            prices=prices,
            simple_returns=simple_returns,
            annualization_factor=factor
        )

        # 6. Build Series Response
        series: List[ReturnObservation] = []
        for idx, bar in enumerate(bars):
            series.append(ReturnObservation(
                timestamp=bar.timestamp,
                price=prices[idx],
                simple_return=simple_returns[idx],
                log_return=log_returns[idx],
                cumulative_return=cum_returns[idx]
            ))

        return ReturnAnalysisResponse(
            instrument_id=instrument.id,
            symbol=instrument.symbol,
            asset_type=instrument.asset_type.value,
            price_source=clean_price_source,
            return_type=clean_return_type,
            frequency=frequency,
            quality_status=quality_report.status.value,
            quality_warning=quality_warning,
            summary=ReturnSummary(**summary_dict),
            series=series
        )
