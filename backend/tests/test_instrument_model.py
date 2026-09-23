import pytest
from app.models.enums import AssetType
from app.schemas.instrument import InstrumentCreate
from app.services.instrument_service import InstrumentService
from app.db.session import SessionLocal

def test_instrument_schema_validation():
    create_dto = InstrumentCreate(
        symbol="NVDA",
        name="NVIDIA Corporation",
        asset_type=AssetType.EQUITY,
        exchange="NASDAQ",
        currency="USD"
    )
    assert create_dto.symbol == "NVDA"
    assert create_dto.asset_type == AssetType.EQUITY

def test_instrument_repository_crud(sqlite_db):
    service = InstrumentService(sqlite_db)
    dto = InstrumentCreate(
        symbol="GOOGL",
        name="Alphabet Inc.",
        asset_type=AssetType.EQUITY,
        exchange="NASDAQ",
        currency="USD"
    )
    inst = service.register_instrument(dto)
    assert inst.id is not None
    assert inst.symbol == "GOOGL"

    fetched = service.get_instrument(inst.id)
    assert fetched is not None
    assert fetched.name == "Alphabet Inc."

    # Test deactivation
    deactivated = service.deactivate_instrument(inst.id)
    assert deactivated is True
    assert service.get_instrument(inst.id).active is False
