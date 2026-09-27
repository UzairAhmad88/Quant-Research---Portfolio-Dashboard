from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any, Tuple
import time
import logging
from sqlalchemy.orm import Session
from app.models.enums import DataFrequency, IngestionStatus, AssetType, DataFreshness
from app.models.instrument import Instrument
from app.schemas.market_data import (
    MarketDataFetchRequest,
    IngestionSummary,
    OHLCVCreate,
    OHLCVResponse,
    InstrumentSearchResult,
    CoverageResponse,
    LatestMarketDataResponse,
    ProviderCapabilitiesResponse,
)
from app.models.ingestion import IngestionLog
from app.repositories.instrument_repository import InstrumentRepository
from app.repositories.market_data_repository import MarketDataRepository
from app.repositories.ingestion_repository import IngestionRepository
from app.providers.registry import ProviderRegistry
from app.validators import ValidationPipeline, Severity, QualityStatus
from app.analytics.market_data.freshness_policy import FreshnessPolicy
from app.analytics.returns.calculator import ReturnCalculator
from app.core.exceptions import NotFoundError, ValidationError, DatabaseError


logger = logging.getLogger("quant_api.services.market_data")

def utc_now():
    return datetime.now(timezone.utc)

class MarketDataService:
    def __init__(self, db: Session):
        self.db = db
        self.inst_repo = InstrumentRepository(db)
        self.market_repo = MarketDataRepository(db)
        self.ingest_repo = IngestionRepository(db)

    def record_bar(self, data: OHLCVCreate):
        return self.market_repo.insert_bar(data)

    def get_historical_bars(
        self,
        instrument_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        frequency: DataFrequency = DataFrequency.DAILY,
        limit: int = 1000
    ):
        return self.market_repo.get_bars(
            instrument_id=instrument_id,
            start_date=start_date,
            end_date=end_date,
            frequency=frequency,
            limit=limit
        )

    def get_latest_observation(
        self,
        instrument_id: str,
        frequency: DataFrequency = DataFrequency.DAILY
    ):
        return self.market_repo.get_latest_bar(instrument_id=instrument_id, frequency=frequency)

    def get_coverage(
        self,
        instrument_id: str,
        requested_start: Optional[datetime] = None,
        requested_end: Optional[datetime] = None
    ) -> CoverageResponse:
        instrument = self.inst_repo.get_by_id(instrument_id)
        if not instrument:
            raise NotFoundError(f"Instrument with ID '{instrument_id}' was not found.")

        min_ts, max_ts = self.market_repo.get_date_bounds(instrument_id)
        total_bars = self.market_repo.count_bars(instrument_id=instrument_id)

        missing_start = None
        missing_end = None
        has_missing = False

        if requested_start and requested_end:
            if min_ts is None or max_ts is None:
                missing_start = requested_start
                missing_end = requested_end
                has_missing = True
            else:
                if requested_start < min_ts:
                    missing_start = requested_start
                    missing_end = min_ts - timedelta(days=1)
                    has_missing = True
                elif requested_end > max_ts:
                    missing_start = max_ts + timedelta(days=1)
                    missing_end = requested_end
                    has_missing = True

        return CoverageResponse(
            instrument_id=instrument.id,
            symbol=instrument.symbol,
            total_bars=total_bars,
            min_timestamp=min_ts,
            max_timestamp=max_ts,
            requested_start=requested_start,
            requested_end=requested_end,
            missing_start=missing_start,
            missing_end=missing_end,
            has_missing_range=has_missing
        )

    def get_ingestion_history(self, instrument_id: str, limit: int = 20) -> List[IngestionLog]:
        return self.ingest_repo.get_recent_logs(instrument_id=instrument_id, limit=limit)

    def export_csv(
        self,
        instrument_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> str:
        instrument = self.inst_repo.get_by_id(instrument_id)
        if not instrument:
            raise NotFoundError(f"Instrument with ID '{instrument_id}' was not found.")

        bars = self.market_repo.get_bars(
            instrument_id=instrument_id,
            start_date=start_date,
            end_date=end_date,
            limit=10000
        )

        import io
        import csv
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["date", "open", "high", "low", "close", "adjusted_close", "volume", "provider", "symbol"])

        for bar in bars:
            dt_str = bar.timestamp.strftime("%Y-%m-%d") if isinstance(bar.timestamp, datetime) else str(bar.timestamp)[:10]
            writer.writerow([
                dt_str,
                float(bar.open),
                float(bar.high),
                float(bar.low),
                float(bar.close),
                float(bar.adjusted_close) if bar.adjusted_close is not None else float(bar.close),
                float(bar.volume),
                bar.provider,
                instrument.symbol
            ])

        return output.getvalue()



    async def search_instruments(self, query: str, provider_name: str = "yahoo_finance") -> List[InstrumentSearchResult]:
        clean_query = query.strip().upper()
        if not clean_query:
            return []

        # 1. Search local database first
        all_insts = self.inst_repo.list_instruments(limit=100)
        local_insts = [i for i in all_insts if clean_query in i.symbol.upper() or clean_query in i.name.upper()][:10]
        results: List[InstrumentSearchResult] = []
        seen_symbols = set()


        for inst in local_insts:
            results.append(InstrumentSearchResult(
                symbol=inst.symbol,
                name=inst.name,
                asset_type=inst.asset_type.value,
                exchange=inst.exchange,
                currency=inst.currency,
                provider_symbol=inst.provider_symbol or inst.symbol,
                existing_id=inst.id
            ))
            seen_symbols.add(inst.symbol)

        # 2. Search provider for external symbols
        try:
            provider = ProviderRegistry.get_provider(provider_name)
            provider_results = await provider.search_instruments(clean_query, limit=10)
            for res in provider_results:
                sym = res["symbol"]
                if sym not in seen_symbols:
                    results.append(InstrumentSearchResult(
                        symbol=sym,
                        name=res["name"],
                        asset_type=res["asset_type"],
                        exchange=res["exchange"],
                        currency=res["currency"],
                        provider_symbol=res["provider_symbol"],
                        existing_id=None
                    ))
                    seen_symbols.add(sym)
        except Exception as e:
            logger.warning(f"Provider search failed for query '{query}': {e}")

        return results

    async def fetch_and_ingest_market_data(self, request: MarketDataFetchRequest) -> IngestionSummary:
        start_time = time.time()
        
        # 1. Resolve or register Instrument
        instrument: Optional[Instrument] = None
        if request.instrument_id:
            instrument = self.inst_repo.get_by_id(request.instrument_id)
            if not instrument:
                raise NotFoundError(f"Instrument with ID '{request.instrument_id}' not found.")
        elif request.symbol:
            clean_sym = request.symbol.strip().upper()
            instrument = self.inst_repo.get_by_symbol(clean_sym)
            if not instrument:
                # Fetch metadata from provider and create Instrument
                provider = ProviderRegistry.get_provider(request.provider)
                info = await provider.get_instrument_info(clean_sym)
                if not info:
                    raise NotFoundError(f"Symbol '{clean_sym}' could not be resolved from provider '{request.provider}'.")
                
                try:
                    asset_type_enum = AssetType(info["asset_type"])
                except ValueError:
                    asset_type_enum = AssetType.EQUITY

                from app.schemas.instrument import InstrumentCreate
                create_dto = InstrumentCreate(
                    symbol=info["symbol"],
                    name=info["name"],
                    asset_type=asset_type_enum,
                    exchange=info.get("exchange", "UNKNOWN"),
                    currency=info.get("currency", "USD"),
                    provider_symbol=info.get("provider_symbol", info["symbol"])
                )
                instrument = self.inst_repo.create(create_dto)

        if not instrument:
            raise ValidationError("Unable to resolve target Instrument for data acquisition.")

        # 2. Resolve Date Range (Default last 5 years)
        end_dt = request.end_date or utc_now()
        start_dt = request.start_date or (end_dt - timedelta(days=365 * 5))
        
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)
        if end_dt.tzinfo is None:
            end_dt = end_dt.replace(tzinfo=timezone.utc)

        if start_dt > end_dt:
            raise ValidationError(f"Start date ({start_dt}) cannot be after end date ({end_dt}).")

        # 3. Create Ingestion Log
        log = self.ingest_repo.create_log(
            instrument_id=instrument.id,
            provider=request.provider,
            requested_start=start_dt,
            requested_end=end_dt,
            frequency=request.frequency
        )

        warnings = []
        
        # 4. Check existing database cache (Database-First strategy)
        existing_ts_set = set()
        if not request.force_refresh:
            existing_ts_set = self.market_repo.get_existing_timestamps(
                instrument_id=instrument.id,
                frequency=request.frequency,
                start_date=start_dt,
                end_date=end_dt
            )

        # 5. Fetch from Provider Adapter
        provider = ProviderRegistry.get_provider(request.provider)
        try:
            raw_bars = await provider.get_historical_ohlcv(
                symbol=instrument.provider_symbol or instrument.symbol,
                start_date=start_dt,
                end_date=end_dt,
                frequency=request.frequency.value
            )
        except Exception as prov_err:
            logger.error(f"Provider error while fetching market data: {prov_err}")
            self.ingest_repo.update_log(
                log_id=log.id,
                status=IngestionStatus.FAILED,
                error_message=str(prov_err)
            )
            raise DatabaseError(f"Market data provider error: {str(prov_err)}")

        rows_received = len(raw_bars)

        # 6. Pipeline Validation & Normalization
        pipeline = ValidationPipeline()
        unique_bars, quality_report = pipeline.validate_dataset(
            bars=raw_bars,
            asset_type=instrument.asset_type,
            existing_timestamps=existing_ts_set,
            instrument_id=instrument.id,
            symbol=instrument.symbol,
            provider=request.provider,
            requested_start=start_dt,
            requested_end=end_dt
        )

        rows_invalid = quality_report.summary.invalid_records
        rows_skipped = quality_report.summary.duplicate_records
        rows_inserted = 0

        actual_start: Optional[datetime] = quality_report.start_date
        actual_end: Optional[datetime] = quality_report.end_date

        valid_bars_to_insert: List[OHLCVCreate] = []
        for bar in unique_bars:
            valid_bars_to_insert.append(OHLCVCreate(
                instrument_id=instrument.id,
                timestamp=bar["timestamp"],
                frequency=request.frequency,
                open=bar["open"],
                high=bar["high"],
                low=bar["low"],
                close=bar["close"],
                adjusted_close=bar.get("adjusted_close"),
                volume=bar.get("volume", 0.0),
                provider=request.provider,
                provider_symbol=instrument.provider_symbol or instrument.symbol
            ))

        # 7. Bulk Persist Valid Bars
        if valid_bars_to_insert:
            try:
                rows_inserted = self.market_repo.bulk_insert_bars(valid_bars_to_insert)
            except Exception as db_err:
                logger.error(f"Failed to bulk insert market data bars: {db_err}")
                self.ingest_repo.update_log(
                    log_id=log.id,
                    status=IngestionStatus.FAILED,
                    error_message=f"Database persistence failure: {db_err}"
                )
                raise DatabaseError(f"Failed to persist market data: {db_err}")

        # 8. Report Status & Log Results
        elapsed_ms = int((time.time() - start_time) * 1000)
        
        status = IngestionStatus.COMPLETED
        if rows_invalid > 0 or rows_received == 0:
            status = IngestionStatus.COMPLETED_WITH_WARNINGS

        for issue in quality_report.issues:
            if issue.severity in (Severity.WARNING, Severity.ERROR, Severity.CRITICAL):
                warnings.append(f"[{issue.code.value}] {issue.message}")

        if rows_received == 0:
            warnings.append("No market data bars returned by provider for specified window.")
        if rows_invalid > 0:
            warnings.append(f"Filtered out {rows_invalid} invalid price observation(s).")
        if rows_skipped > 0:
            warnings.append(f"Skipped {rows_skipped} existing cached observation(s).")


        self.ingest_repo.update_log(
            log_id=log.id,
            status=status,
            rows_received=rows_received,
            rows_inserted=rows_inserted,
            rows_skipped=rows_skipped,
            rows_invalid=rows_invalid,
            actual_start=actual_start,
            actual_end=actual_end,
            duration_ms=elapsed_ms
        )

        return IngestionSummary(
            ingestion_id=log.id,
            instrument_id=instrument.id,
            symbol=instrument.symbol,
            provider=request.provider,
            frequency=request.frequency,
            requested_start=start_dt,
            requested_end=end_dt,
            actual_start=actual_start,
            actual_end=actual_end,
            rows_received=rows_received,
            rows_inserted=rows_inserted,
            rows_skipped=rows_skipped,
            rows_invalid=rows_invalid,
            duration_ms=elapsed_ms,
            status=status,
            warnings=warnings
        )

    def get_provider_capabilities(self, provider_name: Optional[str] = None) -> List[ProviderCapabilitiesResponse]:
        """
        Return the supported capabilities for all or a specific market data provider.
        """
        providers = [provider_name] if provider_name else ["yahoo_finance"]
        results = []
        for p_name in providers:
            try:
                p = ProviderRegistry.get_provider(p_name)
                caps = p.capabilities
                results.append(ProviderCapabilitiesResponse(
                    provider_name=caps.provider_name,
                    historical=caps.historical,
                    latest=caps.latest,
                    intraday=caps.intraday,
                    streaming=caps.streaming,
                    supported_frequencies=caps.supported_frequencies,
                    delayed_data=caps.delayed_data,
                    real_time_data=caps.real_time_data,
                ))
            except Exception as e:
                logger.warning(f"Could not load capabilities for provider '{p_name}': {e}")
        return results

    async def get_latest_market_data(
        self,
        instrument_id: Optional[str] = None,
        symbol: Optional[str] = None,
        frequency: DataFrequency = DataFrequency.DAILY,
        force_refresh: bool = False,
        provider_name: str = "yahoo_finance"
    ) -> LatestMarketDataResponse:
        """
        Database-First retrieval of the latest market observation for an instrument.
        If fresh data exists in PostgreSQL, returns it immediately.
        If missing, stale, or force_refresh=True, fetches from provider, validates, persists idempotently, and logs ingestion.
        """
        # 1. Resolve Instrument
        instrument: Optional[Instrument] = None
        if instrument_id:
            instrument = self.inst_repo.get_by_id(instrument_id)
            if not instrument:
                raise NotFoundError(f"Instrument with ID '{instrument_id}' was not found.")
        elif symbol:
            clean_sym = symbol.strip().upper()
            instrument = self.inst_repo.get_by_symbol(clean_sym)
            if not instrument:
                # Attempt to register instrument via provider info
                provider = ProviderRegistry.get_provider(provider_name)
                info = await provider.get_instrument_info(clean_sym)
                if not info:
                    raise NotFoundError(f"Instrument symbol '{clean_sym}' could not be resolved.")
                try:
                    asset_type_enum = AssetType(info["asset_type"])
                except ValueError:
                    asset_type_enum = AssetType.EQUITY

                from app.schemas.instrument import InstrumentCreate
                create_dto = InstrumentCreate(
                    symbol=info["symbol"],
                    name=info["name"],
                    asset_type=asset_type_enum,
                    exchange=info.get("exchange", "UNKNOWN"),
                    currency=info.get("currency", "USD"),
                    provider_symbol=info.get("provider_symbol", info["symbol"])
                )
                instrument = self.inst_repo.create(create_dto)
        else:
            raise ValidationError("Either instrument_id or symbol must be provided.")

        if not instrument:
            raise NotFoundError("Instrument could not be resolved.")

        # 2. Check existing database observations
        recent_bars = self.market_repo.get_recent_bars(instrument.id, limit=2, frequency=frequency)
        latest_bar = recent_bars[0] if recent_bars else None
        prev_bar = recent_bars[1] if len(recent_bars) > 1 else None

        # 3. Evaluate freshness
        freshness = FreshnessPolicy.evaluate_freshness(
            latest_bar.timestamp if latest_bar else None,
            asset_type=instrument.asset_type,
            frequency=frequency
        )

        needs_fetch = force_refresh or (latest_bar is None) or (freshness not in (DataFreshness.CURRENT, DataFreshness.RECENT))
        warning_msg: Optional[str] = None

        if needs_fetch:
            provider = ProviderRegistry.get_provider(provider_name)
            provider_sym = instrument.provider_symbol or instrument.symbol
            raw_bar = None
            try:
                raw_bar = await provider.get_latest_ohlcv(provider_sym, frequency=frequency.value)
            except Exception as prov_err:
                logger.warning(f"Provider failed to fetch latest data for {instrument.symbol}: {prov_err}")
                warning_msg = f"Provider temporarily unavailable ({str(prov_err)}). Showing the most recent validated observation."

            if raw_bar:
                pipeline = ValidationPipeline()
                unique_bars, quality_report = pipeline.validate_dataset(
                    bars=[raw_bar],
                    asset_type=instrument.asset_type,
                    existing_timestamps=set(),
                    instrument_id=instrument.id,
                    symbol=instrument.symbol,
                    provider=provider_name
                )

                if unique_bars:
                    bar_dict = unique_bars[0]
                    bar_create = OHLCVCreate(
                        instrument_id=instrument.id,
                        timestamp=bar_dict["timestamp"],
                        frequency=frequency,
                        open=bar_dict["open"],
                        high=bar_dict["high"],
                        low=bar_dict["low"],
                        close=bar_dict["close"],
                        adjusted_close=bar_dict.get("adjusted_close"),
                        volume=bar_dict.get("volume", 0.0),
                        provider=provider_name,
                        provider_symbol=provider_sym
                    )
                    persisted_bar, was_inserted = self.market_repo.insert_bar_idempotent(bar_create)

                    # Re-query recent bars to ensure ordering and calculate change
                    recent_bars = self.market_repo.get_recent_bars(instrument.id, limit=2, frequency=frequency)
                    latest_bar = recent_bars[0]
                    prev_bar = recent_bars[1] if len(recent_bars) > 1 else None

                    freshness = FreshnessPolicy.evaluate_freshness(
                        latest_bar.timestamp,
                        asset_type=instrument.asset_type,
                        frequency=frequency
                    )

                    price = float(latest_bar.close)
                    prev_close = float(prev_bar.close) if prev_bar else None
                    change = (price - prev_close) if prev_close is not None else None
                    change_pct = ReturnCalculator.calculate_period_return(prev_close, price) if prev_close is not None else None

                    return LatestMarketDataResponse(
                        instrument_id=instrument.id,
                        symbol=instrument.symbol,
                        name=instrument.name,
                        asset_type=instrument.asset_type.value,
                        exchange=instrument.exchange,
                        currency=instrument.currency,
                        price=price,
                        open=float(latest_bar.open),
                        high=float(latest_bar.high),
                        low=float(latest_bar.low),
                        close=float(latest_bar.close),
                        adjusted_close=float(latest_bar.adjusted_close) if latest_bar.adjusted_close is not None else None,
                        volume=float(latest_bar.volume),
                        previous_close=prev_close,
                        change=change,
                        change_pct=change_pct,
                        market_timestamp=latest_bar.timestamp,
                        received_at=latest_bar.retrieved_at,
                        frequency=frequency,
                        provider=latest_bar.provider,
                        provider_symbol=latest_bar.provider_symbol,
                        freshness=freshness.value,
                        quality=quality_report.status.value,
                        is_cached=False,
                        warning=None
                    )
                else:
                    warning_msg = "Latest observation from provider failed data quality validation. Showing most recent valid stored observation."

        # If we reach here: either we used cache directly, or provider failed / validation failed and we fallback to cache
        if latest_bar:
            price = float(latest_bar.close)
            prev_close = float(prev_bar.close) if prev_bar else None
            change = (price - prev_close) if prev_close is not None else None
            change_pct = ReturnCalculator.calculate_period_return(prev_close, price) if prev_close is not None else None

            return LatestMarketDataResponse(
                instrument_id=instrument.id,
                symbol=instrument.symbol,
                name=instrument.name,
                asset_type=instrument.asset_type.value,
                exchange=instrument.exchange,
                currency=instrument.currency,
                price=price,
                open=float(latest_bar.open),
                high=float(latest_bar.high),
                low=float(latest_bar.low),
                close=float(latest_bar.close),
                adjusted_close=float(latest_bar.adjusted_close) if latest_bar.adjusted_close is not None else None,
                volume=float(latest_bar.volume),
                previous_close=prev_close,
                change=change,
                change_pct=change_pct,
                market_timestamp=latest_bar.timestamp,
                received_at=latest_bar.retrieved_at,
                frequency=frequency,
                provider=latest_bar.provider,
                provider_symbol=latest_bar.provider_symbol,
                freshness=freshness.value,
                quality="GOOD",
                is_cached=True,
                warning=warning_msg
            )

        raise NotFoundError(
            f"No market data available for instrument '{instrument.symbol}'. "
            f"Provider request could not retrieve observations."
        )

    async def get_latest_market_data_batch(
        self,
        instrument_ids: Optional[List[str]] = None,
        symbols: Optional[List[str]] = None,
        frequency: DataFrequency = DataFrequency.DAILY,
        force_refresh: bool = False,
        provider_name: str = "yahoo_finance"
    ) -> List[LatestMarketDataResponse]:
        """
        Batch retrieval of latest market data for multiple instruments.
        Utilizes database-first caching and batch provider download where necessary.
        """
        target_instruments: List[Instrument] = []
        if instrument_ids:
            for iid in instrument_ids:
                inst = self.inst_repo.get_by_id(iid)
                if inst:
                    target_instruments.append(inst)
        elif symbols:
            for sym in symbols:
                inst = self.inst_repo.get_by_symbol(sym.strip().upper())
                if inst:
                    target_instruments.append(inst)

        if not target_instruments:
            return []

        results: List[LatestMarketDataResponse] = []
        symbols_to_fetch: List[Instrument] = []

        # Inspect cache first
        for inst in target_instruments:
            recent_bars = self.market_repo.get_recent_bars(inst.id, limit=2, frequency=frequency)
            latest_bar = recent_bars[0] if recent_bars else None
            freshness = FreshnessPolicy.evaluate_freshness(
                latest_bar.timestamp if latest_bar else None,
                asset_type=inst.asset_type,
                frequency=frequency
            )
            needs_fetch = force_refresh or (latest_bar is None) or (freshness not in (DataFreshness.CURRENT, DataFreshness.RECENT))
            if needs_fetch:
                symbols_to_fetch.append(inst)
            elif latest_bar:
                price = float(latest_bar.close)
                prev_bar = recent_bars[1] if len(recent_bars) > 1 else None
                prev_close = float(prev_bar.close) if prev_bar else None
                change = (price - prev_close) if prev_close is not None else None
                change_pct = ReturnCalculator.calculate_period_return(prev_close, price) if prev_close is not None else None
                results.append(LatestMarketDataResponse(
                    instrument_id=inst.id,
                    symbol=inst.symbol,
                    name=inst.name,
                    asset_type=inst.asset_type.value,
                    exchange=inst.exchange,
                    currency=inst.currency,
                    price=price,
                    open=float(latest_bar.open),
                    high=float(latest_bar.high),
                    low=float(latest_bar.low),
                    close=float(latest_bar.close),
                    adjusted_close=float(latest_bar.adjusted_close) if latest_bar.adjusted_close is not None else None,
                    volume=float(latest_bar.volume),
                    previous_close=prev_close,
                    change=change,
                    change_pct=change_pct,
                    market_timestamp=latest_bar.timestamp,
                    received_at=latest_bar.retrieved_at,
                    frequency=frequency,
                    provider=latest_bar.provider,
                    provider_symbol=latest_bar.provider_symbol,
                    freshness=freshness.value,
                    quality="GOOD",
                    is_cached=True,
                    warning=None
                ))

        # Batch fetch for remaining symbols
        if symbols_to_fetch:
            provider = ProviderRegistry.get_provider(provider_name)
            sym_list = [i.provider_symbol or i.symbol for i in symbols_to_fetch]
            batch_data = {}
            try:
                batch_data = await provider.get_latest_ohlcv_batch(sym_list, frequency=frequency.value)
            except Exception as batch_err:
                logger.warning(f"Batch provider fetch error: {batch_err}")

            pipeline = ValidationPipeline()
            for inst in symbols_to_fetch:
                p_sym = inst.provider_symbol or inst.symbol
                raw_bar = batch_data.get(p_sym)
                if raw_bar:
                    unique_bars, quality_report = pipeline.validate_dataset(
                        bars=[raw_bar],
                        asset_type=inst.asset_type,
                        existing_timestamps=set(),
                        instrument_id=inst.id,
                        symbol=inst.symbol,
                        provider=provider_name
                    )
                    if unique_bars:
                        bar_dict = unique_bars[0]
                        bar_create = OHLCVCreate(
                            instrument_id=inst.id,
                            timestamp=bar_dict["timestamp"],
                            frequency=frequency,
                            open=bar_dict["open"],
                            high=bar_dict["high"],
                            low=bar_dict["low"],
                            close=bar_dict["close"],
                            adjusted_close=bar_dict.get("adjusted_close"),
                            volume=bar_dict.get("volume", 0.0),
                            provider=provider_name,
                            provider_symbol=p_sym
                        )
                        self.market_repo.insert_bar_idempotent(bar_create)

                # Re-query
                recent_bars = self.market_repo.get_recent_bars(inst.id, limit=2, frequency=frequency)
                latest_bar = recent_bars[0] if recent_bars else None
                if latest_bar:
                    price = float(latest_bar.close)
                    prev_bar = recent_bars[1] if len(recent_bars) > 1 else None
                    prev_close = float(prev_bar.close) if prev_bar else None
                    change = (price - prev_close) if prev_close is not None else None
                    change_pct = ReturnCalculator.calculate_period_return(prev_close, price) if prev_close is not None else None
                    freshness = FreshnessPolicy.evaluate_freshness(
                        latest_bar.timestamp,
                        asset_type=inst.asset_type,
                        frequency=frequency
                    )
                    results.append(LatestMarketDataResponse(
                        instrument_id=inst.id,
                        symbol=inst.symbol,
                        name=inst.name,
                        asset_type=inst.asset_type.value,
                        exchange=inst.exchange,
                        currency=inst.currency,
                        price=price,
                        open=float(latest_bar.open),
                        high=float(latest_bar.high),
                        low=float(latest_bar.low),
                        close=float(latest_bar.close),
                        adjusted_close=float(latest_bar.adjusted_close) if latest_bar.adjusted_close is not None else None,
                        volume=float(latest_bar.volume),
                        previous_close=prev_close,
                        change=change,
                        change_pct=change_pct,
                        market_timestamp=latest_bar.timestamp,
                        received_at=latest_bar.retrieved_at,
                        frequency=frequency,
                        provider=latest_bar.provider,
                        provider_symbol=latest_bar.provider_symbol,
                        freshness=freshness.value,
                        quality="GOOD",
                        is_cached=raw_bar is None,
                        warning="Provider temporarily unavailable" if raw_bar is None else None
                    ))

        return results

    async def search_instruments(
        self,
        query: str,
        provider_name: str = "yahoo_finance",
        limit: int = 10
    ) -> List[InstrumentSearchResult]:
        """
        Search for market instruments using local database lookup and provider querying.
        """
        clean_query = query.strip().upper()
        if not clean_query:
            return []

        # 1. Search local DB first
        local_matches = self.inst_repo.search(clean_query, limit=limit)
        results: List[InstrumentSearchResult] = []
        found_symbols = set()

        for inst in local_matches:
            found_symbols.add(inst.symbol.upper())
            results.append(
                InstrumentSearchResult(
                    symbol=inst.symbol,
                    name=inst.name,
                    asset_type=inst.asset_type.value if hasattr(inst.asset_type, "value") else str(inst.asset_type),
                    exchange=inst.exchange,
                    currency=inst.currency,
                    provider_symbol=inst.provider_symbol or inst.symbol,
                    existing_id=inst.id,
                )
            )

        # 2. Query external provider for additional symbols
        try:
            provider = ProviderRegistry.get_provider(provider_name)
            provider_results = await provider.search_instruments(clean_query, limit=limit)
            for res in provider_results:
                sym = res["symbol"].upper()
                if sym not in found_symbols:
                    found_symbols.add(sym)
                    existing = self.inst_repo.get_by_symbol(sym)
                    results.append(
                        InstrumentSearchResult(
                            symbol=sym,
                            name=res.get("name", sym),
                            asset_type=res.get("asset_type", "EQUITY"),
                            exchange=res.get("exchange", "UNKNOWN"),
                            currency=res.get("currency", "USD"),
                            provider_symbol=res.get("provider_symbol", sym),
                            existing_id=existing.id if existing else None,
                        )
                    )
        except Exception as e:
            logger.warning(f"Provider search error for query '{query}': {e}")

        return results[:limit]


