"""
Development Reference Seed Script.
Populates core.instruments with reference instrument metadata across Asset Classes.
Enforces Rule #30: NO FAKE HISTORICAL MARKET DATA IS GENERATED OR INSERTED.
"""

from app.db.session import SessionLocal
from app.services.instrument_service import InstrumentService
from app.schemas.instrument import InstrumentCreate
from app.models.enums import AssetType

SEED_INSTRUMENTS = [
    InstrumentCreate(
        symbol="AAPL",
        name="Apple Inc.",
        asset_type=AssetType.EQUITY,
        exchange="NASDAQ",
        currency="USD",
        country="USA",
        provider_symbol="AAPL",
        metadata_json={"sector": "Technology", "industry": "Consumer Electronics"}
    ),
    InstrumentCreate(
        symbol="MSFT",
        name="Microsoft Corporation",
        asset_type=AssetType.EQUITY,
        exchange="NASDAQ",
        currency="USD",
        country="USA",
        provider_symbol="MSFT",
        metadata_json={"sector": "Technology", "industry": "Software"}
    ),
    InstrumentCreate(
        symbol="SPY",
        name="SPDR S&P 500 ETF Trust",
        asset_type=AssetType.ETF,
        exchange="NYSE Arca",
        currency="USD",
        country="USA",
        provider_symbol="SPY",
        metadata_json={"category": "Large Cap Blend", "sponsor": "State Global Advisors"}
    ),
    InstrumentCreate(
        symbol="BTC/USD",
        name="Bitcoin / US Dollar",
        asset_type=AssetType.CRYPTO,
        exchange="GLOBAL",
        currency="USD",
        provider_symbol="BTCUSD",
        metadata_json={"network": "Bitcoin", "type": "Cryptocurrency"}
    ),
]

def seed_reference_data():
    db = SessionLocal()
    service = InstrumentService(db)
    seeded_count = 0
    try:
        for data in SEED_INSTRUMENTS:
            existing = service.repo.get_by_symbol(data.symbol, data.exchange, data.asset_type)
            if not existing:
                service.register_instrument(data)
                seeded_count += 1
        print(f"Seed completed successfully: {seeded_count} new reference instruments created.")
    except Exception as e:
        print(f"Seed encountered warning/error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_reference_data()
