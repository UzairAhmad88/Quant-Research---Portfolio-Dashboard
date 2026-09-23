from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
import time
import logging
from sqlalchemy.orm import Session
from app.models.enums import DataFrequency, IngestionStatus, AssetType
from app.models.instrument import Instrument
from app.schemas.market_data import (
    MarketDataFetchRequest,
    IngestionSummary,
    OHLCVCreate,
    OHLCVResponse,
    InstrumentSearchResult
)
from app.repositories.instrument_repository import InstrumentRepository
from app.repositories.market_data_repository import MarketDataRepository
from app.repositories.ingestion_repository import IngestionRepository
from app.providers.registry import ProviderRegistry
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

                from app.schemas.instruments import InstrumentCreate
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
        rows_inserted = 0
        rows_skipped = 0
        rows_invalid = 0

        valid_bars_to_insert: List[OHLCVCreate] = []
        batch_ts_seen = set()

        actual_start: Optional[datetime] = None
        actual_end: Optional[datetime] = None

        # 6. Normalize, Validate & Deduplicate
        for bar in raw_bars:
            ts = bar["timestamp"]
            open_p = bar["open"]
            high_p = bar["high"]
            low_p = bar["low"]
            close_p = bar["close"]
            adj_close = bar.get("adjusted_close")
            vol = bar.get("volume", 0.0)

            # Record actual range bounds
            if actual_start is None or ts < actual_start:
                actual_start = ts
            if actual_end is None or ts > actual_end:
                actual_end = ts

            # OHLC validation rules
            is_valid = (
                open_p > 0 and high_p > 0 and low_p > 0 and close_p > 0 and vol >= 0
                and high_p >= open_p and high_p >= close_p and high_p >= low_p
                and low_p <= open_p and low_p <= close_p
            )

            if not is_valid:
                rows_invalid += 1
                continue

            # Skip existing database timestamps (Deduplication)
            if ts in existing_ts_set or ts in batch_ts_seen:
                rows_skipped += 1
                continue

            batch_ts_seen.add(ts)
            valid_bars_to_insert.append(OHLCVCreate(
                instrument_id=instrument.id,
                timestamp=ts,
                frequency=request.frequency,
                open=open_p,
                high=high_p,
                low=low_p,
                close=close_p,
                adjusted_close=adj_close,
                volume=vol,
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
