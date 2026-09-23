import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, patch
from app.schemas.market_data import MarketDataFetchRequest
from app.services.market_data_service import MarketDataService
from app.services.instrument_service import InstrumentService
from app.schemas.instrument import InstrumentCreate
from app.models.enums import AssetType, DataFrequency, IngestionStatus

@pytest.mark.asyncio
async def test_market_data_service_acquisition_flow(sqlite_db):
    inst_service = InstrumentService(sqlite_db)
    inst = inst_service.register_instrument(InstrumentCreate(
        symbol="MSFT",
        name="Microsoft Corp",
        asset_type=AssetType.EQUITY,
        exchange="NASDAQ"
    ))

    md_service = MarketDataService(sqlite_db)

    now = datetime.now(timezone.utc)
    mock_bars = [
        {
            "timestamp": now - timedelta(days=2),
            "open": 300.0,
            "high": 305.0,
            "low": 298.0,
            "close": 302.0,
            "adjusted_close": 302.0,
            "volume": 50000.0,
            "provider_symbol": "MSFT"
        },
        {
            "timestamp": now - timedelta(days=1),
            "open": 302.0,
            "high": 310.0,
            "low": 301.0,
            "close": 308.0,
            "adjusted_close": 308.0,
            "volume": 60000.0,
            "provider_symbol": "MSFT"
        }
    ]

    with patch("app.providers.yahoo.YahooFinanceProvider.get_historical_ohlcv", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = mock_bars
        
        req = MarketDataFetchRequest(
            instrument_id=inst.id,
            start_date=now - timedelta(days=5),
            end_date=now,
            provider="yahoo_finance"
        )
        summary = await md_service.fetch_and_ingest_market_data(req)

        assert summary.rows_received == 2
        assert summary.rows_inserted == 2
        assert summary.rows_skipped == 0
        assert summary.status == IngestionStatus.COMPLETED

        # 2. Second fetch of identical range (Deduplication / Database Cache test)
        summary2 = await md_service.fetch_and_ingest_market_data(req)
        assert summary2.rows_received == 2
        assert summary2.rows_inserted == 0
        assert summary2.rows_skipped == 2

@pytest.mark.asyncio
async def test_market_data_service_invalid_bar_filtering(sqlite_db):
    inst_service = InstrumentService(sqlite_db)
    inst = inst_service.register_instrument(InstrumentCreate(
        symbol="SPY",
        name="SPDR S&P 500 ETF Trust",
        asset_type=AssetType.ETF,
        exchange="NYSE"
    ))

    md_service = MarketDataService(sqlite_db)
    now = datetime.now(timezone.utc)

    mock_bars = [
        {
            "timestamp": now - timedelta(days=1),
            "open": 400.0,
            "high": 390.0,  # INVALID: high < open
            "low": 395.0,
            "close": 398.0,
            "volume": 100.0,
            "provider_symbol": "SPY"
        }
    ]

    with patch("app.providers.yahoo.YahooFinanceProvider.get_historical_ohlcv", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = mock_bars
        req = MarketDataFetchRequest(
            instrument_id=inst.id,
            start_date=now - timedelta(days=5),
            end_date=now,
            provider="yahoo_finance"
        )
        summary = await md_service.fetch_and_ingest_market_data(req)
        assert summary.rows_received == 1
        assert summary.rows_inserted == 0
        assert summary.rows_invalid == 1
        assert summary.status == IngestionStatus.COMPLETED_WITH_WARNINGS
