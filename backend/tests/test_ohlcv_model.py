from datetime import datetime, timezone
import pytest
from app.models.enums import AssetType, DataFrequency
from app.schemas.instrument import InstrumentCreate
from app.schemas.market_data import OHLCVCreate
from app.services.instrument_service import InstrumentService
from app.services.market_data_service import MarketDataService

def test_ohlcv_bounds_validation():
    # Invalid High < Low
    with pytest.raises(ValueError, match="High price"):
        OHLCVCreate(
            instrument_id="dummy_id",
            timestamp=datetime.now(timezone.utc),
            frequency=DataFrequency.DAILY,
            open=100.0,
            high=90.0,  # Invalid: high < low
            low=95.0,
            close=98.0,
            volume=1000.0
        )

def test_market_data_service_record(sqlite_db):
    inst_service = InstrumentService(sqlite_db)
    md_service = MarketDataService(sqlite_db)

    # 1. Register parent instrument
    inst = inst_service.register_instrument(
        InstrumentCreate(
            symbol="TSLA",
            name="Tesla Inc.",
            asset_type=AssetType.EQUITY,
            exchange="NASDAQ"
        )
    )

    # 2. Insert valid bar
    now = datetime.now(timezone.utc)
    bar_dto = OHLCVCreate(
        instrument_id=inst.id,
        timestamp=now,
        frequency=DataFrequency.DAILY,
        open=200.0,
        high=210.0,
        low=195.0,
        close=205.0,
        adjusted_close=205.0,
        volume=50000.0,
        provider="TEST_PROVIDER"
    )

    recorded = md_service.record_bar(bar_dto)
    assert recorded.id is not None
    assert float(recorded.close) == 205.0

    # 3. Query historical bars
    bars = md_service.get_historical_bars(inst.id, frequency=DataFrequency.DAILY)
    assert len(bars) == 1

    # 4. Query latest observation
    latest = md_service.get_latest_observation(inst.id)
    assert latest is not None
    assert float(latest.high) == 210.0
