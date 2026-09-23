from datetime import datetime, timezone, timedelta
import pytest
from app.services.instrument_service import InstrumentService
from app.services.market_data_service import MarketDataService
from app.schemas.instrument import InstrumentCreate
from app.models.enums import AssetType, DataFrequency, IngestionStatus

def test_api_get_data_quality_report(client, sqlite_db):
    inst_service = InstrumentService(sqlite_db)
    inst = inst_service.register_instrument(InstrumentCreate(
        symbol="AAPL",
        name="Apple Inc.",
        asset_type=AssetType.EQUITY,
        exchange="NASDAQ"
    ))

    # Record two valid bars
    md_service = MarketDataService(sqlite_db)
    now = datetime.now(timezone.utc)
    md_service.record_bar(type('OHLCVCreateMock', (), {
        'instrument_id': inst.id,
        'timestamp': now - timedelta(days=2),
        'frequency': DataFrequency.DAILY,
        'open': 150.0,
        'high': 155.0,
        'low': 148.0,
        'close': 152.0,
        'adjusted_close': 152.0,
        'volume': 10000.0,
        'provider': 'yahoo_finance',
        'provider_symbol': 'AAPL'
    }))
    md_service.record_bar(type('OHLCVCreateMock', (), {
        'instrument_id': inst.id,
        'timestamp': now - timedelta(days=1),
        'frequency': DataFrequency.DAILY,
        'open': 152.0,
        'high': 158.0,
        'low': 151.0,
        'close': 156.0,
        'adjusted_close': 156.0,
        'volume': 12000.0,
        'provider': 'yahoo_finance',
        'provider_symbol': 'AAPL'
    }))

    res = client.get(f"/api/v1/market-data/{inst.id}/quality")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("GOOD", "GOOD_WITH_WARNINGS")
    assert data["summary"]["total_records"] == 2
    assert data["summary"]["valid_records"] == 2
    assert data["symbol"] == "AAPL"

def test_api_get_ingestion_detail(client, sqlite_db):
    inst_service = InstrumentService(sqlite_db)
    inst = inst_service.register_instrument(InstrumentCreate(
        symbol="NVDA",
        name="NVIDIA Corp",
        asset_type=AssetType.EQUITY,
        exchange="NASDAQ"
    ))

    from app.repositories.ingestion_repository import IngestionRepository
    repo = IngestionRepository(sqlite_db)
    now = datetime.now(timezone.utc)
    log = repo.create_log(
        instrument_id=inst.id,
        provider="yahoo_finance",
        requested_start=now - timedelta(days=10),
        requested_end=now,
        frequency=DataFrequency.DAILY
    )

    res = client.get(f"/api/v1/market-data/{inst.id}/ingestions/{log.id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == log.id
    assert data["provider"] == "yahoo_finance"
    assert "quality_report" in data
