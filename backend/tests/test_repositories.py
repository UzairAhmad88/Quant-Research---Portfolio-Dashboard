from datetime import datetime, timezone, timedelta
import pytest
from app.models.enums import AssetType, DataFrequency
from app.schemas.instrument import InstrumentCreate
from app.schemas.market_data import OHLCVCreate
from app.repositories.instrument_repository import InstrumentRepository
from app.repositories.market_data_repository import MarketDataRepository

def test_bulk_insertion_and_date_range(sqlite_db):
    inst_repo = InstrumentRepository(sqlite_db)
    md_repo = MarketDataRepository(sqlite_db)

    inst = inst_repo.create(
        InstrumentCreate(
            symbol="ETH/USD",
            name="Ethereum / US Dollar",
            asset_type=AssetType.CRYPTO,
            exchange="GLOBAL"
        )
    )

    base_time = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    bars = []
    for i in range(5):
        bars.append(
            OHLCVCreate(
                instrument_id=inst.id,
                timestamp=base_time + timedelta(days=i),
                frequency=DataFrequency.DAILY,
                open=3000.0 + i,
                high=3100.0 + i,
                low=2950.0 + i,
                close=3050.0 + i,
                volume=10000.0 + i,
                provider="TEST_BULK"
            )
        )

    count = md_repo.bulk_insert_bars(bars)
    assert count == 5

    # Test date range filtering
    start_dt = base_time + timedelta(days=1)
    end_dt = base_time + timedelta(days=3)
    filtered = md_repo.get_bars(inst.id, start_date=start_dt, end_date=end_dt)
    assert len(filtered) == 3
