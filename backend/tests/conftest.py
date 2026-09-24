import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.db.base import Base
from app.models.instrument import Instrument
from app.models.market_data import OHLCV
from app.models.portfolio import Portfolio, PortfolioHolding
from app.models.strategy import StrategyConfiguration, SignalEvent
from app.main import app
from app.db.session import get_db

@pytest.fixture(scope="function")
def sqlite_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )

    @event.listens_for(engine, "connect")
    def attach_schemas(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("ATTACH DATABASE ':memory:' AS core;")
        cursor.execute("ATTACH DATABASE ':memory:' AS market_data;")
        cursor.execute("ATTACH DATABASE ':memory:' AS strategy;")
        cursor.close()

    # Restore schema names if changed
    Instrument.__table__.schema = "core"
    OHLCV.__table__.schema = "market_data"
    Portfolio.__table__.schema = "core"
    PortfolioHolding.__table__.schema = "core"
    StrategyConfiguration.__table__.schema = "strategy"
    SignalEvent.__table__.schema = "strategy"

    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function")
def client(sqlite_db):
    def override_get_db():
        try:
            yield sqlite_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

