import pytest
from app.services.portfolio_service import PortfolioService
from app.services.instrument_service import InstrumentService
from app.schemas.portfolio import PortfolioCreate, PortfolioHoldingCreate, PortfolioUpdate
from app.schemas.instrument import InstrumentCreate
from app.models.enums import AssetType
from app.core.exceptions import ValidationError, NotFoundError

def test_portfolio_service_crud(sqlite_db):
    inst_service = InstrumentService(sqlite_db)
    inst1 = inst_service.register_instrument(
        InstrumentCreate(symbol="AAPL", name="Apple Inc", asset_type=AssetType.EQUITY)
    )

    port_service = PortfolioService(sqlite_db)
    # Create portfolio
    port = port_service.create_portfolio(
        PortfolioCreate(
            name="Tech Growth Fund",
            description="Tech holdings",
            initial_capital=100000.0,
            holdings=[
                PortfolioHoldingCreate(
                    instrument_id=inst1.id,
                    quantity=100.0,
                    entry_price=150.0,
                    target_weight=50.0,
                )
            ]
        )
    )

    assert port.name == "Tech Growth Fund"
    assert port.initial_capital == 100000.0
    assert port.invested_value == 15000.0
    assert port.cash == 85000.0
    assert len(port.holdings) == 1

    # Update portfolio
    updated_port = port_service.update_portfolio(port.id, PortfolioUpdate(name="Tech Growth Portfolio"))
    assert updated_port.name == "Tech Growth Portfolio"

    # List portfolios
    ports = port_service.list_portfolios()
    assert len(ports) >= 1

    # Deactivate portfolio
    port_service.deactivate_portfolio(port.id)
    with pytest.raises(NotFoundError):
        port_service.get_portfolio(port.id)

def test_portfolio_capital_validation(sqlite_db):
    inst_service = InstrumentService(sqlite_db)
    inst1 = inst_service.register_instrument(
        InstrumentCreate(symbol="MSFT", name="Microsoft Corp", asset_type=AssetType.EQUITY)
    )

    port_service = PortfolioService(sqlite_db)
    # Exceeding initial capital in create payload
    with pytest.raises(ValidationError):
        port_service.create_portfolio(
            PortfolioCreate(
                name="Overallocated Fund",
                initial_capital=10000.0,
                holdings=[
                    PortfolioHoldingCreate(
                        instrument_id=inst1.id,
                        quantity=100.0,
                        entry_price=150.0,  # 15,000 > 10,000
                    )
                ]
            )
        )

def test_duplicate_holding_validation(sqlite_db):
    inst_service = InstrumentService(sqlite_db)
    inst1 = inst_service.register_instrument(
        InstrumentCreate(symbol="GOOGL", name="Alphabet Inc", asset_type=AssetType.EQUITY)
    )

    port_service = PortfolioService(sqlite_db)
    port = port_service.create_portfolio(PortfolioCreate(name="Single Stock", initial_capital=50000.0))

    port_service.add_holding(
        port.id,
        PortfolioHoldingCreate(instrument_id=inst1.id, quantity=10.0, entry_price=100.0)
    )

    # Attempt adding duplicate instrument
    with pytest.raises(ValidationError):
        port_service.add_holding(
            port.id,
            PortfolioHoldingCreate(instrument_id=inst1.id, quantity=20.0, entry_price=110.0)
        )
