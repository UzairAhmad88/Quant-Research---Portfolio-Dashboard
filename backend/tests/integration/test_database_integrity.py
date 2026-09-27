"""Integration tests for database integrity, transactions, constraints, and idempotency."""
import uuid
import datetime
import pytest
from sqlalchemy.exc import IntegrityError

from app.models.enums import AssetType, DataFrequency
from app.models.instrument import Instrument
from app.models.market_data import OHLCV
from app.schemas.instrument import InstrumentCreate
from app.schemas.market_data import OHLCVCreate
from app.schemas.portfolio import PortfolioCreate, PortfolioHoldingCreate
from app.repositories.instrument_repository import InstrumentRepository
from app.repositories.market_data_repository import MarketDataRepository
from app.services.portfolio_service import PortfolioService


def test_unique_constraint_on_ohlcv_observation(sqlite_db):
    """Enforce that duplicate (instrument_id, timestamp, frequency) raises an IntegrityError."""
    inst_repo = InstrumentRepository(sqlite_db)
    md_repo = MarketDataRepository(sqlite_db)
    
    inst = inst_repo.create(
        InstrumentCreate(
            symbol="MSFT",
            name="Microsoft Corp",
            asset_type=AssetType.EQUITY,
            exchange="NASDAQ"
        )
    )
    
    t0 = datetime.datetime(2023, 1, 3, 0, 0, 0, tzinfo=datetime.timezone.utc)
    bar1 = OHLCVCreate(
        instrument_id=inst.id,
        timestamp=t0,
        frequency=DataFrequency.DAILY,
        open=240.0,
        high=245.0,
        low=238.0,
        close=242.0,
        volume=2_000_000,
        provider="TEST"
    )
    md_repo.bulk_insert_bars([bar1])
    
    # Attempting raw duplicate insertion on same table without conflict handling
    bar2 = OHLCV(
        id=str(uuid.uuid4()),
        instrument_id=str(inst.id),
        timestamp=t0,
        frequency=DataFrequency.DAILY,
        open=240.0,
        high=245.0,
        low=238.0,
        close=242.0,
        volume=2_000_000,
        provider="TEST"
    )
    sqlite_db.add(bar2)
    with pytest.raises(IntegrityError):
        sqlite_db.commit()
    sqlite_db.rollback()


def test_idempotent_bar_insertion(sqlite_db):
    """Verify insert_bar_idempotent gracefully returns existing observation without error."""
    inst_repo = InstrumentRepository(sqlite_db)
    md_repo = MarketDataRepository(sqlite_db)
    
    inst = inst_repo.create(
        InstrumentCreate(
            symbol="NVDA",
            name="Nvidia Corp",
            asset_type=AssetType.EQUITY,
            exchange="NASDAQ"
        )
    )
    
    t0 = datetime.datetime(2023, 1, 3, 0, 0, 0, tzinfo=datetime.timezone.utc)
    bar_data = OHLCVCreate(
        instrument_id=inst.id,
        timestamp=t0,
        frequency=DataFrequency.DAILY,
        open=150.0,
        high=155.0,
        low=148.0,
        close=152.0,
        adjusted_close=152.0,
        volume=5_000_000,
        provider="TEST",
    )
    
    # First insert -> inserted
    bar1, inserted1 = md_repo.insert_bar_idempotent(bar_data)
    assert inserted1 is True
    assert bar1.close == 152.0
    
    # Second insert with same timestamp -> not inserted, returns existing
    bar2, inserted2 = md_repo.insert_bar_idempotent(bar_data)
    assert inserted2 is False
    assert bar2.id == bar1.id


def test_transaction_rollback_preserves_state(sqlite_db):
    """Verify failed database operations roll back completely without partial state."""
    initial_count = sqlite_db.query(Instrument).count()
    
    # Try creating an invalid instrument with missing required non-nullable fields
    try:
        invalid_inst = Instrument(id=str(uuid.uuid4()), symbol=None, name="Broken")
        sqlite_db.add(invalid_inst)
        sqlite_db.commit()
    except Exception:
        sqlite_db.rollback()
        
    final_count = sqlite_db.query(Instrument).count()
    assert final_count == initial_count, "Database state must remain clean after rollback"


def test_portfolio_holdings_relational_integrity(sqlite_db):
    """Verify portfolio and holdings relationship and cascade consistency."""
    port_service = PortfolioService(sqlite_db)
    inst_repo = InstrumentRepository(sqlite_db)
    
    inst = inst_repo.create(
        InstrumentCreate(
            symbol="GOOGL",
            name="Alphabet Inc",
            asset_type=AssetType.EQUITY,
            exchange="NASDAQ"
        )
    )
    
    port = port_service.create_portfolio(
        PortfolioCreate(
            name="Tech Growth Fund",
            initial_capital=50_000.0,
            holdings=[
                PortfolioHoldingCreate(
                    instrument_id=inst.id,
                    quantity=100.0,
                    entry_price=120.0,
                    target_weight=24.0
                )
            ]
        )
    )
    
    assert port.initial_capital == 50_000.0
    assert port.invested_value == 12_000.0
    assert port.cash == 38_000.0
    assert len(port.holdings) == 1
    assert port.holdings[0].instrument_id == inst.id
